import { NextRequest, NextResponse } from "next/server";
import { queryOne, initializePool } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { generateToken } from "@/lib/jwt";

interface User {
  id?: number;
  email?: string;
  username?: string;
  password_hash?: string;
  role?: string;
}

/**
 * POST /api/auth/login
 * 
 * Authenticate a user and return JWT token
 * 
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "securepassword123"
 * }
 * 
 * Response:
 * {
 *   "status": "success",
 *   "message": "Logged in successfully",
 *   "user": { "id": 1, "email": "...", "username": "...", "role": "customer" }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize database on first request
    await initializePool();

    const body = await request.json();
    const { email, password } = body;

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { status: "error", message: "Email and password required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await queryOne<User>(
      "SELECT id, email, username, password_hash, role FROM users WHERE email = ?",
      [email]
    );

    // User not found
    if (!user || !user.password_hash) {
      return NextResponse.json(
        { status: "error", message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await verifyPassword(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { status: "error", message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken({
      userId: user.id || 0,
      email: user.email || "",
      username: user.username || "",
      role: (user.role as "customer" | "admin") || "customer",
    });

    // Create response and set cookie
    const response = NextResponse.json(
      {
        status: "success",
        message: "Logged in successfully",
        user: {
          id: user.id || 0,
          email: user.email || "",
          username: user.username || "",
          role: user.role || "customer",
        },
      },
      { status: 200 }
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
    console.error("Login error:", error);
    return NextResponse.json(
      { status: "error", message: "Login failed" },
      { status: 500 }
    );
  }
}
