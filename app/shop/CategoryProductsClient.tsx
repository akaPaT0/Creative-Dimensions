"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import LikeIconButton from "../components/LikeIconButton";
import WishlistIconButton from "../components/WishlistIconButton";
import type { Product } from "../data/products";

type SortOption =
  | "default"
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc";

function getCardImage(p: Product) {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.image === "string" && p.image) return p.image;
  if (p.category && p.slug) return `/products/${p.category}/${p.slug}-1.jpg`;
  return "/products/placeholder.jpg";
}

export default function CategoryProductsClient({
  products,
  category,
}: {
  products: Product[];
  category: string;
}) {
  const [sort, setSort] = useState<SortOption>("default");
  const [subCategory, setSubCategory] = useState<string>("all");

  const subCategoryOptions = useMemo(() => {
    const values = Array.from(
      new Set(products.map((product) => product.subCategory?.trim() || "").filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    return ["all", ...values];
  }, [products]);

  const visibleProducts = useMemo(() => {
    if (subCategory === "all") return products;
    return products.filter((product) => product.subCategory === subCategory);
  }, [products, subCategory]);

  const sortedProducts = useMemo(() => {
    const list = visibleProducts.slice();

    if (sort === "name-asc") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "name-desc") {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sort === "price-asc") {
      list.sort((a, b) => (a.priceUSD ?? 0) - (b.priceUSD ?? 0));
    } else if (sort === "price-desc") {
      list.sort((a, b) => (b.priceUSD ?? 0) - (a.priceUSD ?? 0));
    }

    return list;
  }, [visibleProducts, sort]);

  const hasSubCategories = subCategoryOptions.length > 1;

  return (
    <>
      <div className="mt-10 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-white/60">
          {sortedProducts.length} {sortedProducts.length === 1 ? "product" : "products"}
        </div>

        <div className={`grid gap-3 ${hasSubCategories ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
          {hasSubCategories && (
            <select
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="rounded-2xl border border-white/15 bg-[#0D0D0D]/60 px-4 py-3 text-white outline-none"
            >
              {subCategoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All" : option}
                </option>
              ))}
            </select>
          )}

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-2xl border border-white/15 bg-[#0D0D0D]/60 px-4 py-3 text-white outline-none"
          >
            <option value="default">Sort: default</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedProducts.map((p) => (
          <Link
            key={p.id}
            href={`/shop/${category}/${encodeURIComponent(p.slug)}`}
            className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10 lg:hover:-translate-y-[2px] lg:hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 transition lg:group-hover:scale-[1.02]">
              <Image
                src={getCardImage(p)}
                alt={p.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-70 transition lg:group-hover:opacity-90" />
              <LikeIconButton
                productId={String(p.id)}
                positionClass="bottom-2 right-10"
              />
              <WishlistIconButton productId={String(p.id)} />
            </div>

            <div className="mt-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-white font-semibold">{p.name}</div>
                <div className="mt-1 text-sm text-white/60 line-clamp-2">
                  {p.description || "-"}
                </div>
              </div>

              <div className="shrink-0 text-sm text-white/80">
                {p.priceUSD ? `$${p.priceUSD}` : ""}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {sortedProducts.length === 0 && (
        <div className="mt-10 text-center text-white/60">
          No products match this sub-category.
        </div>
      )}
    </>
  );
}
