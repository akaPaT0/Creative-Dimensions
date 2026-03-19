import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ypevaawhxhupjxjgkwdp.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/product_images/**",
      },
    ],
  },
};

export default nextConfig;