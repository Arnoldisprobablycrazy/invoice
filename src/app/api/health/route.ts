import { NextResponse } from "next/server";
import { isDbConnected, initializePool } from "@/lib/db";

/**
 * GET /api/health
 * 
 * Simple health check endpoint to verify the server is running
 * 
 * Response:
 * {
 *   "status": "ok",
 *   "server": true,
 *   "database": true
 * }
 */
export async function GET() {
  try {
    await initializePool();
  } catch (error) {
    console.warn("Health check: Database not available");
  }

  return NextResponse.json(
    {
      status: "ok",
      server: true,
      database: isDbConnected(),
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
