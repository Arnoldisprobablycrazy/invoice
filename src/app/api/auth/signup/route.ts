import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute, initializePool } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { generateToken } from "@/lib/jwt";

interface User {
  id?: number;
  email?: string;
  username?: string;
  password_hash?: string;
  role?: string;
}

/**
 * POST /api/auth/signup
 * 
 * Register a new user account
 * 
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "username": "johndoe",
 *   "password": "securepassword123"
 * }
 * 
 * Response:
 * {
 *   "status": "success",
 *   "message": "Account created",
 *   "user": { "id": 1, "email": "...", "username": "...", "role": "customer" }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize database on first request
    await initializePool();

    const body = await request.json();
    const { email, username, password } = body;

    // Validate inputs
    if (!email || !username || !password) {
      return NextResponse.json(
        { status: "error", message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await queryOne<User>(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser) {
      return NextResponse.json(
        { status: "error", message: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user
    const result = await execute(
      "INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)",
      [email, username, hashedPassword, "customer"]
    );

    // Generate token
    const token = generateToken({
      userId: result.lastId,
      email,
      username,
      role: "customer",
    });

    // Create response and set cookie
    const response = NextResponse.json(
      {
        status: "success",
        message: "Account created successfully",
        user: {
          id: result.lastId,
          email,
          username,
          role: "customer",
        },
      },
      { status: 201 }
    );

    response.cookies.set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error instanceof Error ? error.message : String(error));
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { status: "error", message: `Failed to create account: ${message}` },
      { status: 500 }
    );
  }
}
