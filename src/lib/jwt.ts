import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const secret = process.env.JWT_SECRET;
if (!secret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is required in production');
}

const JWT_SECRET = new TextEncoder().encode(
  secret || 'dev-only-fallback-secret-do-not-use-in-prod'
);

export interface TokenPayload extends JWTPayload {
  userId: number;
  email: string;
  username?: string;
  role: string;
}

/**
 * Generate a signed JWT. Expires in 7 days.
 */
export async function generateToken(payload: {
  userId: number;
  email: string;
  username?: string;
  role: string;
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

/**
 * Verify a JWT and return its payload, or null if invalid/expired.
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as TokenPayload;
  } catch (err) {
    console.error('Token verification error:', err);
    return null;
  }
}