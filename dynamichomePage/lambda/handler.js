'use strict';

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.pdf':  'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':  'font/ttf',
  '.txt':  'text/plain',
};

const BINARY_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.woff', '.woff2', '.ttf']);

exports.handler = async (event) => {
  const rawPath = event.rawPath || '/';

  // Serve a dynamic env.js so the frontend reads Cognito config from Lambda env vars
  // rather than hardcoded values. This integrates with the window.__env__ pattern in main.tsx.
  if (rawPath === '/env.js') {
    const authority = process.env.COGNITO_AUTHORITY || '';
    const clientId  = process.env.COGNITO_CLIENT_ID  || '';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-cache' },
      body: `window.__env__ = { COGNITO_AUTHORITY: "${authority}", COGNITO_CLIENT_ID: "${clientId}" };`,
      isBase64Encoded: false,
    };
  }

  const ext = path.extname(rawPath).toLowerCase();
  const isStaticAsset = ext !== '' && ext !== '.html';
  const filePath = isStaticAsset
    ? path.join(DIST_DIR, rawPath)
    : path.join(DIST_DIR, 'index.html');

  try {
    const content = fs.readFileSync(filePath);
    const contentType = CONTENT_TYPES[ext] || 'text/html; charset=utf-8';
    const isBinary = BINARY_EXTENSIONS.has(ext);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': isStaticAsset ? 'max-age=31536000, immutable' : 'no-cache, no-store, must-revalidate',
      },
      body: isBinary ? content.toString('base64') : content.toString('utf-8'),
      isBase64Encoded: isBinary,
    };
  } catch (_err) {
    if (isStaticAsset) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Not found',
        isBase64Encoded: false,
      };
    }

    // SPA fallback: unknown HTML routes all serve index.html
    try {
      const index = fs.readFileSync(path.join(DIST_DIR, 'index.html'));
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        body: index.toString('utf-8'),
        isBase64Encoded: false,
      };
    } catch (_indexErr) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Internal server error',
        isBase64Encoded: false,
      };
    }
  }
};
