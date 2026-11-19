import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "OAI-SearchBot",
        // Product photos are served from /api/img; crawlers must be able to fetch them.
        allow: ["/", "/api/img"],
        disallow: [
          "/admin",
          "/admin/*",
          "/api/*",
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
      {
        userAgent: "*",
        // Product photos are served from /api/img; crawlers must be able to fetch them.
        allow: ["/", "/api/img"],
        disallow: [
          "/admin",
          "/admin/*",
          "/api/*",
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
    host: SITE_URL,
  };
}
