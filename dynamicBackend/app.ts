import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as jwt from 'jsonwebtoken';
import * as jwksRsa from 'jwks-rsa';

interface AuthenticatedRequest extends Request {
  user?: jwt.JwtPayload;
}

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// Cognito config (replace with your actual values or use env vars)
const COGNITO_REGION = 'eu-central-1';
const COGNITO_USERPOOL_ID = 'eu-central-1_EtLI65dHb';
const COGNITO_ISSUER = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USERPOOL_ID}`;

// JWKS client for Cognito
const jwks = jwksRsa.expressJwtSecret({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: `${COGNITO_ISSUER}/.well-known/jwks.json`,
});

// Middleware to validate Cognito JWT
function authenticateJwt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(
    token,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwks as any, // jwks-rsa callback is not typed to match jwt.verify's SecretOrKeyProvider overload
    {
      algorithms: ['RS256'],
      issuer: COGNITO_ISSUER,
    },
    (err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) => {
      if (err) {
        res.status(401).json({ error: 'Invalid token', details: err.message });
        return;
      }
      req.user = decoded as jwt.JwtPayload;
      next();
    }
  );
}

// Public health endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Example protected endpoint
app.get('/api/protected', authenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  res.json({ message: 'You are authenticated!', user: req.user });
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});