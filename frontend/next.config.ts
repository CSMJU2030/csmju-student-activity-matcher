import type { NextConfig } from "next";

/**
 * The frontend is the subsystem's only public origin (auth-contract §5).
 * /api/* and the SSO routes go on to the NestJS backend, so the callback
 * registered in the Core Hub (http://localhost:3001/auth/callback) and the
 * HttpOnly session cookie it sets live on the same origin as these pages.
 */
const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:3002";

const nextConfig: NextConfig = {
  // Core Hub web origin for the "back to portal" link (ui-design-system.md 5.1).
  // Read under the standard name CORE_HUB_WEB_URL; the browser sees it as NEXT_PUBLIC_*.
  env: { NEXT_PUBLIC_CORE_HUB_WEB_URL: process.env.CORE_HUB_WEB_URL ?? "" },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      { source: "/auth/login", destination: `${BACKEND_URL}/auth/login` },
      { source: "/auth/callback", destination: `${BACKEND_URL}/auth/callback` },
      { source: "/auth/logout", destination: `${BACKEND_URL}/auth/logout` },
    ];
  },
};

export default nextConfig;
