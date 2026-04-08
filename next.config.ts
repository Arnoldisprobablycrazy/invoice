import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set workspace root to avoid conflicts with multiple lockfiles
    root: ".",
  },
};

export default nextConfig;
