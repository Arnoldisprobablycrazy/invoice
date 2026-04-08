import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * 
 * Clear authentication token
 * 
 * Response:
 * {
 *   "status": "success",
 *   "message": "Logged out successfully"
 * }
 */
export async function POST() {
  try {
    const response = NextResponse.json(
      { status: "success", message: "Logged out successfully" },
      { status: 200 }
    );

    // Clear the auth token cookie
    response.cookies.set("authToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { status: "error", message: "Logout failed" },
      { status: 500 }
    );
  }
}
