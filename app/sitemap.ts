import type { MetadataRoute } from "next";
import { getProducts } from "@/app/lib/products-db";
import { SITE_URL } from "@/app/lib/site";
import { slugify, getProductImages } from "@/app/lib/product-seo";

const PRODUCT_CATEGORIES = new Set([
  "keychains",
  "accessories",
  "desk-add-ons",
  "fanboys",
]);

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Core Pages
  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/shop`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/shop/keychains`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/shop/accessories`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/shop/desk-add-ons`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/shop/fanboys`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/shop/new-arrivals`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/shop/tools`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/custom-quote`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Dynamic Product Pages
  const products = await getProducts().catch(() => []);
  const productRoutes: MetadataRoute.Sitemap = products
    .filter((p) => p?.category && p?.slug && PRODUCT_CATEGORIES.has(p.category))
    .map((p) => {
      const cleanSlug = slugify(p.slug);
      const images = getProductImages(p).map((img) =>
        String(img).startsWith("http") ? String(img) : `${SITE_URL}${img}`
      );

      return {
        url: `${SITE_URL}/shop/${encodeURIComponent(p.category)}/${encodeURIComponent(cleanSlug)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        images: images.length ? images : undefined,
      };
    });

  const unique = new Map<string, MetadataRoute.Sitemap[number]>();
  [...coreRoutes, ...productRoutes].forEach((entry) => {
    unique.set(entry.url, entry);
  });

  return Array.from(unique.values());
}
