import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

/**
 * GET /api/auth/me
 * 
 * Get current logged-in user information
 * 
 * Response:
 * {
 *   "status": "success",
 *   "user": { "id": 1, "email": "...", "username": "...", "role": "customer" }
 * }
 * 
 * If not logged in:
 * {
 *   "status": "error",
 *   "message": "Not authenticated",
 *   "user": null
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get("authToken")?.value;

    if (!token) {
      return NextResponse.json(
        { status: "error", message: "Not authenticated", user: null },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { status: "error", message: "Invalid or expired token", user: null },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        status: "success",
        userId: payload.userId,
        email: payload.email,
        username: payload.username,
        role: payload.role,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to get user info", user: null },
      { status: 500 }
    );
  }
}
