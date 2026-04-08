import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, extractTokenFromHeader } from "@/lib/jwt";

/**
 * Middleware - Route Protection
 * 
 * WHAT IT DOES:
 * 1. Runs on EVERY request to check if user is authenticated
 * 2. Redirects unauthenticated users to login page
 * 3. Allows authenticated users to proceed
 * 4. Attaches user data to request for later use
 * 
 * WHY MIDDLEWARE:
 * - Centralizes authentication logic
 * - Prevents accessing protected routes without login
 * - Runs before your page/API code executes
 */

// Routes that DON'T require authentication
const PUBLIC_ROUTES = [
  "/accounts/auth/login",
  "/accounts/auth/signup",
  "/error",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
];

// Routes that REQUIRE authentication
const PROTECTED_ROUTES = [
  "/accounts",
  "/dashboard",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    // Public routes are always accessible
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Get token from cookie
    const token = request.cookies.get("authToken")?.value;

    // No token found
    if (!token) {
      const loginUrl = new URL("/accounts/auth/login", request.url);
      loginUrl.searchParams.set("from", pathname); // Remember where user came from
      return NextResponse.redirect(loginUrl);
    }

    // Verify token
    const payload = verifyToken(token);

    // Token invalid or expired
    if (!payload) {
      const loginUrl = new URL("/accounts/auth/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Token valid - attach user to request for use in pages/routes
    // (This allows you to access user data in server components)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId.toString());
    requestHeaders.set("x-user-email", payload.email);
    requestHeaders.set("x-user-role", payload.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Route is neither public nor protected - allow access
  return NextResponse.next();
}

/**
 * Configure which paths should be checked by middleware
 * 
 * WHY MATCHER:
 * - Without matcher, middleware runs on EVERY request (slow)
 * - With matcher, only check requests to specific paths
 * - This improves performance significantly
 */
export const config = {
  matcher: [
    // Check all routes
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

/**
 * MIDDLEWARE FLOW DIAGRAM:
 * 
 * User Request
 *     ↓
 * Middleware runs
 *     ↓
 * Is it a public route? (login, signup, error)
 *     ├─ YES → Allow access → NextResponse.next()
 *     └─ NO → Continue
 *           ↓
 *        Is it protected? (dashboard, accounts)
 *           ├─ YES → Has token?
 *           │        ├─ NO → Redirect to login
 *           │        └─ YES → Token valid?
 *           │                 ├─ NO → Redirect to login
 *           │                 └─ YES → Attach user to request → NextResponse.next()
 *           └─ NO → Allow access (unprotected route)
 *                   ↓
 *              NextResponse.next()
 *                   ↓
 *              Page/API code executes
 */
