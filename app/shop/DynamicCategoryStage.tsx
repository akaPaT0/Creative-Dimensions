"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "./ShopCatalogClient";

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
  if (typeof price === "number") return `$${price}`;
  if (typeof price === "string" && price.trim())
    return price.startsWith("$") ? price : `$${price}`;
  return "DM";
}

function getProductHref(p: Product) {
  if (p?.category && p?.slug) return `/shop/${p.category}/${p.slug}`;
  if (p?.category) return `/shop/${p.category}`;
  return "/shop";
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
      {/* Stage Header */}
      <div className="mb-4 sm:mb-6 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Signature Prints
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-0.5">
            Handpicked signature models and community favorites
          </p>
        </div>

        <a
          href="#all"
          className="text-xs sm:text-sm font-semibold text-[#FF8B64] hover:text-[#ffa282] transition-colors flex items-center gap-1 shrink-0"
        >
          <span>Browse all</span>
          <span aria-hidden="true">↓</span>
        </a>
      </div>

      {/* Stage Carousel */}
      {items.length > 0 ? (
        <div className="flex gap-3.5 sm:gap-4 lg:gap-5 overflow-x-auto overscroll-x-contain snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2 sm:pb-0">
          {items.map((p) => (
            <Link
              key={`sig-${getStableKey(p)}`}
              href={getProductHref(p)}
              className="group flex flex-col rounded-2xl border border-white/10 bg-[#161619]/90 hover:border-[#FF8B64]/40 transition-all duration-200 p-2.5 sm:p-3 w-[155px] sm:w-[190px] md:w-[210px] shrink-0 snap-start shadow-md"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/40 border border-white/5">
                <Image
                  src={getCardImage(p)}
                  alt={getTitle(p)}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 155px, 210px"
                />
              </div>

              <div className="mt-2.5 flex flex-col flex-1 justify-between">
                <div className="text-white text-xs sm:text-sm font-semibold line-clamp-2 min-h-[2.5rem] leading-snug group-hover:text-[#FF8B64] transition-colors">
                  {getTitle(p)}
                </div>
                <div className="mt-1.5 text-xs sm:text-sm font-bold text-[#FF8B64]">
                  {getPriceLabel(p)}
                </div>
              </div>
            </Link>
          ))}
          <div className="shrink-0 w-2 sm:hidden pointer-events-none" aria-hidden="true" />
        </div>
      ) : (
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
      )}
    </section>
  );
}
