import type { NextConfig } from "next";

// Sent with every response.
const securityHeaders = [
  // No other website may show our pages inside a frame (stops "clickjacking" on admin/checkout).
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  // Browsers must trust the declared file type and not guess.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Other sites only learn our domain, never the full page address.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The shop never needs these device features.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ypevaawhxhupjxjgkwdp.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
