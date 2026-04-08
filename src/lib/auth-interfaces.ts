/**
 * AUTH INTERFACES
 * 
 * Central location for all authentication-related TypeScript interfaces
 * Ensures type consistency across signup, login, and user management
 */

// ========== REQUEST INTERFACES ==========

/**
 * Login Request
 * User credentials for authentication
 */
export interface LoginFormState {
  email: string;
  password: string;
}

/**
 * Signup Request
 * User information needed to create a new account
 */
export interface SignupFormState {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

// ========== RESPONSE INTERFACES ==========

/**
 * User Data Returned After Auth
 * Contains non-sensitive user information
 * Password is NEVER included in responses
 */
export interface AuthUser {
  id: number;
  email: string;
  username: string;
  role: "customer" | "admin";
  created_at?: string;
}

/**
 * Generic Auth Response
 * Used by signup, login, and logout endpoints
 */
export interface AuthResponse {
  status: "success" | "error";
  message: string;
  user?: AuthUser;
}

/**
 * Login Response
 * Server response after login attempt
 */
export interface LoginResponse extends AuthResponse {
  status: "success" | "error";
  message: string;
  user?: AuthUser;
  redirectUrl?: string; // URL to redirect after login
}

/**
 * Signup Response
 * Server response after signup attempt
 */
export interface SignupResponse extends AuthResponse {
  status: "success" | "error";
  message: string;
  user?: AuthUser;
}

/**
 * Logout Response
 * Server response after logout
 */
export interface LogoutResponse {
  status: "success" | "error";
  message: string;
}

/**
 * Current User Response
 * Response from /api/auth/me endpoint
 * Extracted from JWT token
 */
export interface CurrentUserResponse {
  userId: number;
  email: string;
  username: string;
  role: "customer" | "admin";
}

// ========== DATABASE INTERFACES ==========

/**
 * User Record from Database
 * Contains sensitive information (only used server-side)
 * NEVER send password_hash to client
 */
export interface DatabaseUser {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  role: "customer" | "admin";
  created_at: string;
  updated_at: string;
}

// ========== JWT PAYLOAD INTERFACE ==========

/**
 * JWT Payload
 * Data encoded inside the JWT token
 * Verified using JWT_SECRET
 */
export interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  role: "customer" | "admin";
  iat?: number; // Issued at (timestamp)
  exp?: number; // Expiration (timestamp)
}

// ========== ERROR HANDLING ==========

/**
 * Auth Error Details
 * Used for consistent error handling
 */
export interface AuthError {
  code: "INVALID_CREDENTIALS" | "USER_EXISTS" | "DB_ERROR" | "VALIDATION_ERROR" | "UNKNOWN";
  message: string;
  statusCode: number;
}

// ========== API REQUEST/RESPONSE TYPES ==========

/**
 * Generic API Response Wrapper
 * Can be used for any API response
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}
