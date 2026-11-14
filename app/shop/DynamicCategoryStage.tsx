"use client";

import { useMemo } from "react";
import { getProductPath } from "@/app/lib/product-url";
import Link from "next/link";
import FeaturedCarousel from "../components/FeaturedCarousel";
import type { Product } from "./ShopCatalogClient";
import { pricePrefix } from "@/app/lib/product-options";

function getCardImage(p: Product) {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.image === "string" && p.image) return p.image;

  const cat = p?.category;
  const sub = p?.subCategory || "other";
  const slug = p?.slug;
  if (cat && slug) return `/products/${cat}/${sub}/${slug}-1.webp`;

  return "/products/Cute_Crab_1.webp";
}

function getTitle(p: Product) {
  return (
    p.title ||
    p.name ||
    p.label ||
    (p.slug ? String(p.slug).replace(/-/g, " ") : "Product")
  );
}

function getPriceLabel(p: Product) {
  const price = p.price ?? p.priceUSD;
  if (typeof price === "number") return `${pricePrefix(p)}$${price}`;
  if (typeof price === "string" && price.trim())
    return price.startsWith("$") ? price : `$${price}`;
  return "DM";
}

const getProductHref = getProductPath;

const CATEGORY_LABELS: Record<string, string> = {
  halloween: "Halloween",
  keychains: "Keychains",
  accessories: "Accessories",
  fanboys: "Fanboys",
  "desk-add-ons": "Desk Add-Ons",
  tools: "Tools",
  "new-arrivals": "New Arrivals",
};

function getCategoryLabel(category?: string) {
  if (!category) return "";
  return CATEGORY_LABELS[category] ?? category.replace(/-/g, " ");
}

function getStableKey(p: Product) {
  return `${p.category ?? "x"}-${p.slug ?? "no-slug"}-${p.id ?? "no-id"}`;
}

export default function DynamicCategoryStage({
  products,
}: {
  products: Product[];
}) {
  const items = useMemo(() => {
    const feat = products.filter((p) => p.featured === true);
    return feat.length > 0 ? feat : products.slice(0, 6);
  }, [products]);

  return (
    <section className="relative w-full min-w-0 max-w-full overflow-hidden">
      {/* Stage Carousel */}
      {items.length > 0 ? (
        <FeaturedCarousel
          header={
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                  Signature Prints
                </h2>
                <p className="text-xs sm:text-sm text-white/50 mt-0.5 line-clamp-1">
                  Handpicked signature models and community favorites
                </p>
              </div>
              <a
                href="#all"
                className="text-xs sm:text-sm font-semibold text-[#FF8B64] hover:text-[#ffa282] transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap md:mr-2"
              >
                <span>Browse all</span>
                <span aria-hidden="true">↓</span>
              </a>
            </div>
          }
          items={items.map((p) => ({
            key: `sig-${getStableKey(p)}`,
            id: p.id ? String(p.id) : undefined,
            href: getProductHref(p),
            title: getTitle(p),
            price: getPriceLabel(p),
            category: getCategoryLabel(p.category),
            image: getCardImage(p),
            hoverImage:
              Array.isArray(p.images) && p.images.length > 1 ? p.images[1] : undefined,
            isNew: (p as { isNew?: boolean }).isNew === true,
            hasVariants: !!(p as { variants?: unknown[] }).variants?.length,
          }))}
        />
      ) : (
        <>
        <h2 className="mb-4 text-xl sm:text-2xl font-bold tracking-tight text-white">Signature Prints</h2>
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center max-w-md mx-auto">
          <p className="text-white/70 text-sm font-medium">
            New prints are currently being prototyped for this collection.
          </p>
          <p className="text-white/40 text-xs mt-1">
            Have a specific STL model or file you want printed?
          </p>
          <Link
            href="/about"
            className="inline-block mt-4 text-xs font-semibold text-[#FF8B64] hover:underline"
          >
            Request a Custom 3D Print →
          </Link>
        </div>
        </>
      )}
    </section>
  );
}
