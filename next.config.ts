import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set workspace root to avoid conflicts with multiple lockfiles
    root: ".",
  },
  // Allow cross-origin dev resources (HMR, etc.) when accessing
  // the dev server through ngrok. Without this, mobile browsers
  // can't fully hydrate React and forms fall back to native GET.
  allowedDevOrigins: [
    "delmy-brutelike-giovanni.ngrok-free.dev",
    "localhost",
    "127.0.0.1",
  ],
};

export default nextConfig;