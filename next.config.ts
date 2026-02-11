import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests to Next dev server (development only).
  // In a future Next.js major version this must be explicitly configured.
  // Set to ['*'] to allow all dev origins — safe for local development only.
  allowedDevOrigins: ["*"],
};

export default nextConfig;
