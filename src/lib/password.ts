import bcryptjs from 'bcryptjs';

/**
 * PASSWORD HASHING UTILITY - Using bcryptjs
 * 
 * WHY BCRYPTJS?
 * 1. ONE-WAY HASHING: Can't reverse hash back to password (unlike simple encrypt)
 * 2. ADAPTIVE: Gets slower every year as computers get faster (future-proof)
 * 3. SALT: Automatically adds randomness, prevents rainbow table attacks
 * 4. INDUSTRY STANDARD: Used by major companies (Google, Facebook, etc.)
 * 
 * NEVER store plain passwords. Always hash them.
 */

const SALT_ROUNDS = 10;  // Number of times to hash (higher = slower + securer)

/**
 * Hash a plain text password
 * 
 * WHEN TO USE: During user signup
 * 
 * @param password - Plain text password from user
 * @returns Hashed password safe to store in database
 * 
 * Example:
 * const hashed = await hashPassword('MyPassword123');
 * // Output: $2a$10$aG....Z6RVJLvZ2 (different every time due to salt)
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // bcryptjs automatically generates salt and applies it
    const hashedPassword = await bcryptjs.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Compare plain text password with hashed password
 * 
 * WHEN TO USE: During user login
 * 
 * @param plainPassword - Plain text password from login form
 * @param hashedPassword - Hashed password from database
 * @returns True if passwords match, false otherwise
 * 
 * Example:
 * const matches = await verifyPassword('MyPassword123', hashedFromDB);
 * if (matches) {
 *   // Login successful
 * }
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    // bcryptjs compares without revealing the password
    const matches = await bcryptjs.compare(plainPassword, hashedPassword);
    return matches;
  } catch (error) {
    console.error('Error verifying password:', error);
    throw new Error('Failed to verify password');
  }
}

/**
 * WHY NOT PLAINTEXT PASSWORDS?
 * 
 * Scenario 1: Database gets hacked
 * ❌ Plaintext: Attacker has all user passwords → Can access email, bank, etc.
 * ✅ Hashed: Attacker has gibberish → Can't recover original passwords
 * 
 * Scenario 2: Developer mistake (password logged)
 * ❌ Plaintext: Password exposed in logs
 * ✅ Hashed: Even if logged, it's useless
 * 
 * Scenario 3: Rainbow table attack (pre-computed password -> hash)
 * ❌ Plaintext: N/A (already exposed)
 * ✅ Hashed: Bcrypt's salt makes rainbow tables ineffective
 * 
 * SALT EXPLAINED:
 * Same password, different salt = different hash
 * 
 * Password: "MyPassword123"
 * Hash 1: $2a$10$aG...ZjM2ZjMxMDc3.....  (salt: aG)
 * Hash 2: $2a$10$ew...NzY4NDAzOTAy.....  (salt: ew)
 * 
 * Even with hash, attacker can't easily reverse it!
 */
