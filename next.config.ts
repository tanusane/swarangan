import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy: an allow-list of where the page may load things
 * from, so injected markup cannot pull in a script, frame the site, or post a
 * form elsewhere.
 *
 * Scripts allow 'unsafe-inline' deliberately. Next.js inlines its bootstrap and
 * the structured data; the alternative — a per-request nonce — would make every
 * page render dynamically and throw away the static speed of the public site.
 * Everything else is locked to named hosts, and user-edited text is already
 * escaped where it reaches a script (lib/json-ld.ts).
 *
 * Adding an embed from a new service means adding its host here, or it will be
 * blocked silently.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // data:/blob: for blur placeholders and upload previews in the admin.
  "img-src 'self' data: blob: https://i.ytimg.com https://*.supabase.co",
  "font-src 'self'",
  // The admin uploads photos straight to Supabase Storage from the browser.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  // YouTube players, Instagram posts, the Facebook page preview, the map.
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://www.instagram.com https://www.facebook.com https://maps.google.com https://www.google.com",
  "media-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
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
        // Images uploaded through the admin panel, served from Supabase Storage.
        // Only the public "media" bucket path is allowed, not the whole host.
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/media/**",
      },
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
