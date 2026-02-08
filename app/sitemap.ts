import type { MetadataRoute } from "next";
import { getProducts } from "@/app/lib/products-db";
import { SITE_URL } from "@/app/lib/site";

const PRODUCT_ROUTE_CATEGORIES = new Set(["keychains", "fanboys", "new-arrivals"]);
const STATIC_ROUTES = [
  "/",
  "/about",
  "/contact",
  "/shop",
  "/shop/keychains",
  "/shop/fanboys",
  "/shop/new-arrivals",
  "/shop/accessories",
  "/shop/tools",
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes = STATIC_ROUTES.map((routePath) => ({
      url: `${SITE_URL}${routePath}`,
      lastModified: now,
    }));

  const products = await getProducts().catch(() => []);
  const productRoutes = products
    .filter((p) => p?.category && p?.slug && PRODUCT_ROUTE_CATEGORIES.has(p.category))
    .map((p) => ({
      url: `${SITE_URL}/shop/${encodeURIComponent(p.category)}/${encodeURIComponent(p.slug)}`,
      lastModified: now,
    }));

  const unique = new Map<string, MetadataRoute.Sitemap[number]>();
  [...staticRoutes, ...productRoutes].forEach((entry) => {
    unique.set(entry.url, entry);
  });

  return Array.from(unique.values());
}
