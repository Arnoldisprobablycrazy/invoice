import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

/**
 * Middleware - Route Protection
 *
 * Runs before page/API code. Redirects unauthenticated users to login.
 * Attaches verified user claims to request headers for downstream use.
 *
 * IMPORTANT: This runs on Vercel's Edge Runtime, so it must not import
 * Node.js-only modules. That's why we use `jose` instead of `jsonwebtoken`.
 */

// Routes that DON'T require authentication
const PUBLIC_ROUTES = [
  "/accounts/login",
  "/accounts/signup",
  "/accounts/auth/login",
  "/accounts/auth/signup",
  "/accounts/auth/forgot-password",
  "/accounts/auth/confirm",
  "/error",
  "/i/",              // public invoice view
  "/privacy",
  "/terms",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/payments/callback",
  "/api/payments/c2b",
  "/api/health",
];

// Routes that REQUIRE authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/invoices",
  "/clients",
  "/payments",
  "/products",
  "/reports",
  "/settings",
  "/accounts",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + "/") || pathname.startsWith(route)
  );
  if (isPublicRoute) return NextResponse.next();

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + "/") || pathname.startsWith(route)
  );
  if (!isProtectedRoute) return NextResponse.next();

  // Protected route — check auth
  const token = request.cookies.get("authToken")?.value;
  if (!token) {
    const loginUrl = new URL("/accounts/auth/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyToken(token); // ← await is critical
  if (!payload) {
    const loginUrl = new URL("/accounts/auth/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", String(payload.userId));
  requestHeaders.set("x-user-email", payload.email);
  requestHeaders.set("x-user-role", payload.role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};