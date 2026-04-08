"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { initializePool, queryOne, execute } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { generateToken, verifyToken } from "@/lib/jwt";
import type { DatabaseUser } from "@/lib/auth-interfaces";

/**
 * SIGN UP - Register a new user
 * 
 * WHAT HAPPENS:
 * 1. Extract email, username, password from form
 * 2. Check if email already exists in database
 * 3. Hash the password using bcryptjs
 * 4. Insert user into database
 * 5. Generate JWT token
 * 6. Store token in HTTP-only cookie
 * 7. Redirect to dashboard
 */
export async function signUp(formData: FormData) {
  try {
    // Initialize database pool on first call (lazy initialization)
    await initializePool();

    const credentials = {
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    // Validate inputs
    if (!credentials.email || !credentials.password || !credentials.username) {
      return { status: "error", message: "Missing required fields", user: null };
    }

    // Check if email already exists
    const existingUser = await queryOne<DatabaseUser>(
      "SELECT id FROM users WHERE email = ?",
      [credentials.email]
    );

    if (existingUser) {
      return {
        status: "error",
        message: "Email already registered",
        user: null,
      };
    }

    // Hash password before storing
    const hashedPassword = await hashPassword(credentials.password);

    // Insert user into database
    const result = await execute(
      "INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)",
      [credentials.email, credentials.username, hashedPassword, "customer"]
    );

    // Create JWT token
    const token = generateToken({
      userId: result.lastId,
      email: credentials.email,
      username: credentials.username,
      role: "customer",
    });

    // Store token in HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    revalidatePath("/", "layout");
    return {
      status: "success",
      message: "Account created successfully",
      user: {
        id: result.lastId,
        email: credentials.email,
        username: credentials.username,
        role: "customer",
      },
    };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      status: "error",
      message: "Failed to create account",
      user: null,
    };
  }
}

/**
 * SIGN IN - Login existing user
 * 
 * WHAT HAPPENS:
 * 1. Extract email and password from form
 * 2. Query database for user by email
 * 3. Verify password matches hash
 * 4. Generate JWT token
 * 5. Store token in HTTP-only cookie
 * 6. Revalidate cache
 */
export async function signIn(formData: FormData) {
  try {
    // Initialize database pool on first call (lazy initialization)
    await initializePool();

    const credentials = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    // Validate inputs
    if (!credentials.email || !credentials.password) {
      return {
        status: "error",
        message: "Email and password required",
        user: null,
      };
    }

    // Find user by email
    const user = await queryOne<DatabaseUser>(
      "SELECT id, email, username, password_hash, role FROM users WHERE email = ?",
      [credentials.email]
    );

    // User not found
    if (!user) {
      return {
        status: "error",
        message: "Invalid email or password",
        user: null,
      };
    }

    // Verify password matches
    const passwordMatch = await verifyPassword(
      credentials.password,
      user.password_hash
    );

    if (!passwordMatch) {
      return {
        status: "error",
        message: "Invalid email or password",
        user: null,
      };
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Store token in HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    revalidatePath("/", "layout");
    return {
      status: "success",
      message: "Logged in successfully",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Signin error:", error);
    return {
      status: "error",
      message: "Login failed",
      user: null,
    };
  }
}

/**
 * SIGN OUT - Logout user
 * 
 * WHAT HAPPENS:
 * 1. Clear the authentication token cookie
 * 2. Revalidate cache
 * 3. Redirect to login page
 * 
 * WHY JWT SIGNOUT IS DIFFERENT:
 * - With traditional sessions: delete from database immediately
 * - With JWT: just delete the cookie (token becomes useless)
 * - Token is only valid if user has the cookie
 */
export async function signOut() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("authToken");

    revalidatePath("/", "layout");
    redirect("/accounts/auth/login");
  } catch (error) {
    console.error("Signout error:", error);
    return { status: "error", message: "Failed to logout" };
  }
}

/**
 * GET CURRENT USER - Extract user from JWT token
 * 
 * WHAT HAPPENS:
 * 1. Read authToken from cookies
 * 2. Verify token signature
 * 3. Return user data from token payload
 * 
 * WHY NO DATABASE QUERY:
 * - All user info is in the token
 * - Signature proves token is genuine
 * - No database overhead!
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    return payload || null;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

/**
 * PROMOTE TO ADMIN - Upgrade user to admin role
 * 
 * WHAT HAPPENS:
 * 1. Get current user from token
 * 2. Check if current user is admin
 * 3. Update target user's role to admin
 * 4. Revalidate cache
 * 
 * WHY CHECK CURRENT USER:
 * - Safety: Only admins should promote other users
 * - Prevents privilege escalation
 */
export async function promoteToAdmin(userId: number) {
  try {
    // Get current user
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { status: "error", message: "Not authenticated" };
    }

    // Check if current user is admin
    if (currentUser.role !== "admin") {
      return {
        status: "error",
        message: "Unauthorized: Admin access required",
      };
    }

    // Update user role to admin
    const result = await execute(
      "UPDATE users SET role = ? WHERE id = ?",
      ["admin", userId]
    );

    if (result.affectedRows === 0) {
      return { status: "error", message: "User not found" };
    }

    revalidatePath("/", "layout");
    return { status: "success", message: "User promoted to admin" };
  } catch (error) {
    console.error("Promote to admin error:", error);
    return { status: "error", message: "Failed to promote user" };
  }
}