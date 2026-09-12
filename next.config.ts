import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * No Content-Security-Policy yet: it lands in Phase 2 alongside Supabase and
 * the admin panel, where a wrong policy would silently break authentication. The
 * headers below are the ones that are safe and useful to set now.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    // Only meaningful over HTTPS; ignored on localhost.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // YouTube video thumbnails for the Social Presence facades. Keyless.
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  // Surfaces accidental `any`-shaped mistakes at build time rather than runtime.
  typedRoutes: true,
};

export default nextConfig;
