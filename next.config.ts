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
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/catalog-variants/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Contact card from /info: phones open "Add contact" only with the vCard type.
      {
        source: "/creative-dimensions.vcf",
        headers: [{ key: "Content-Type", value: "text/vcard; charset=utf-8" }],
      },
    ];
  },
  images: {
    // Vercel Image Optimization is not used: its free plan allows only 5,000 resized copies a month,
    // and once that ran out every uncached photo failed to load. Our loader serves bundled copies
    // directly and uses /api/img for photos added after the bundle was generated.
    loader: "custom",
    loaderFile: "./app/lib/image-loader.ts",
    // Keep srcsets to the widths /api/img actually makes.
    deviceSizes: [400, 800, 1600],
    imageSizes: [160],
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
