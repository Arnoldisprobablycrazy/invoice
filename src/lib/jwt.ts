import jwt, { SignOptions } from 'jsonwebtoken';

/**
 * JWT UTILITY - Token Creation & Verification
 * 
 * WHAT HAPPENS HERE:
 * 1. User logs in with email + password
 * 2. We verify password is correct
 * 3. We create a JWT token containing user info
 * 4. User gets token back and stores it
 * 5. For every request, user sends token
 * 6. We verify the token signature (proves we created it)
 * 7. We extract user info from token (no database query needed!)
 * 
 * WHY THIS IS FAST:
 * - No database query needed after login
 * - Token contains all necessary user info
 * - Signature proves token wasn't tampered with
 */

// Get secret from environment (MUST be long and random in production)
const JWT_SECRET: string = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

/**
 * User data structure stored in JWT payload
 */
export interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  role: 'customer' | 'admin';
  iat?: number;      // Issued At (auto-added by jwt library)
  exp?: number;      // Expiration (added by us)
}

/**
 * Generate a JWT token
 * 
 * WHEN TO USE: After successful login
 * 
 * @param payload - User data to encode in token
 * @param expiresIn - Token expiration time (default: 7 days)
 * @returns JWT token string
 * 
 * Example:
 * const token = generateToken({
 *   userId: 123,
 *   email: 'user@example.com',
 *   username: 'john',
 *   role: 'customer'
 * });
 * // Returns: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2V...
 */
export function generateToken(
  payload: JWTPayload,
  expiresIn: string | number = '7d'  // 7 days (production: use shorter like '1h')
): string {
  try {
    const token = jwt.sign(
      payload,
      JWT_SECRET,
      {
        expiresIn,
        algorithm: 'HS256',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
    );
    return token;
  } catch (error) {
    console.error('Error generating JWT:', error);
    throw new Error('Failed to generate authentication token');
  }
}

/**
 * Verify and decode a JWT token
 * 
 * WHEN TO USE: When user makes a request (extract user info from token)
 * 
 * @param token - JWT token from request
 * @returns Decoded payload with user info, or null if invalid
 * 
 * Example:
 * const payload = verifyToken(tokenFromRequest);
 * if (payload) {
 *   console.log('User ID:', payload.userId);
 *   // Token is valid
 * } else {
 *   // Token is invalid or expired
 * }
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    // Token expired, invalid signature, or malformed
    if (error instanceof jwt.TokenExpiredError) {
      console.warn('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.warn('Invalid token');
    } else {
      console.error('Token verification error:', error);
    }
    return null;
  }
}

/**
 * Extract token from HTTP Authorization header
 * 
 * WHEN TO USE: Parsing incoming requests
 * 
 * @param authHeader - Authorization header from request
 * @returns Token string or null
 * 
 * Example:
 * // Request header: "Authorization: Bearer eyJhbGc..."
 * const token = extractTokenFromHeader('Bearer eyJhbGc...');
 * // Returns: "eyJhbGc..."
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * EXPIRATION TIME EXPLAINED:
 * 
 * SHORT-LIVED TOKEN (1 hour):
 * ✅ Security: If stolen, thief has limited time
 * ❌ UX: User must re-login often
 * 
 * LONG-LIVED TOKEN (30 days):
 * ✅ UX: User stays logged in longer
 * ❌ Security: More time for stolen token to be useful
 * 
 * SOLUTION - REFRESH TOKEN PATTERN:
 * 1. accessToken: 1 hour (used for API requests)
 * 2. refreshToken: 30 days (used to get new accessToken)
 * 
 * When accessToken expires:
 * - User sends refreshToken
 * - Server validates it and issues new accessToken
 * - User continues without re-logging
 * 
 * For now, we'll use 7 days (balance of security + UX)
 * Later, you can upgrade to refresh token pattern.
 */

/**
 * WHY JWT IS STATELESS:
 * 
 * TRADITIONAL SESSION:
 * Browser → Server: "I'm user 123"
 * Server: Checks database for session 123
 * ✅ Secure (can revoke immediately)
 * ❌ Slow (database query per request)
 * ❌ Doesn't scale (need session store)
 * 
 * JWT:
 * Browser → Server: "Here's my token signed by you"
 * Server: Verifies signature (no database needed)
 * ✅ Fast (no database query)
 * ✅ Scales (stateless, no server-to-server sync)
 * ❌ Hard to revoke (token valid until expiration)
 * 
 * Best of both: Start with JWT, add session revocation later if needed
 */
