import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/user",
          "/user/*",
          "/checkout",
          "/orders",
          "/orders/*",
          "/invoice/*",
          "/sign-in",
          "/sign-in/*",
          "/sign-up",
          "/sign-up/*",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
