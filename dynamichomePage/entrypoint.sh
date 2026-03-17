#!/bin/sh
set -e

# Write runtime environment config for the frontend.
# VITE_COGNITO_AUTHORITY and VITE_COGNITO_CLIENT_ID are injected by ECS as
# container environment variables. If absent (e.g. local dev), the file is
# written with empty strings and main.tsx falls back to its hardcoded defaults.
cat > /usr/share/nginx/html/env.js << EOF
window.__env__ = {
  COGNITO_AUTHORITY: "${VITE_COGNITO_AUTHORITY}",
  COGNITO_CLIENT_ID: "${VITE_COGNITO_CLIENT_ID}"
};
EOF

exec nginx -g "daemon off;"
