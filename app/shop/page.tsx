"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Props = {
  products: any[];
};

/** Helpers (safe fallbacks so Image never gets undefined) */
function getCardImage(p: any) {
  if (Array.isArray(p?.images) && p.images.length > 0 && p.images[0]) return p.images[0];
  if (typeof p?.image === "string" && p.image) return p.image;

  const cat = p?.category;
  const sub = p?.subCategory || "other";
  const slug = p?.slug;
  if (cat && slug) return `/products/${cat}/${sub}/${slug}-1.webp`;

  return "/products/placeholder.jpg";
}

function getTitle(p: any) {
  return (
    p?.title ||
    p?.name ||
    p?.label ||
    (p?.slug ? String(p.slug).replace(/-/g, " ") : "Product")
  );
}

function getDesc(p: any) {
  return (
    p?.shortDesc ||
    p?.shortDescription ||
    p?.desc ||
    p?.description ||
    "Custom 3D print item."
  );
}

function getPriceLabel(p: any) {
  const price = p?.price ?? p?.priceUSD;
  const currency = p?.currency || "USD";

  if (typeof price === "number") return `${price} ${currency}`;
  if (typeof price === "string" && price.trim()) return price;
  return "DM for price";
}

/** IMPORTANT: your routes are /shop/{category}/{slug} */
function getProductHref(p: any) {
  if (p?.category && p?.slug) return `/shop/${p.category}/${p.slug}`;
  if (p?.category) return `/shop/${p.category}`;
  return "/shop";
}

function getStableKey(p: any) {
  return `${p?.category ?? "x"}-${p?.slug ?? "no-slug"}-${p?.id ?? "no-id"}`;
}

type SortKey = "recommended" | "newest" | "az" | "priceLow" | "priceHigh";

export default function ShopCatalogClient({ products }: Props) {
  // your existing sort dropdown (keep)
  const [sort, setSort] = useState<SortKey>("recommended");

  // NEW: columns dropdown below sort
  const [columns, setColumns] = useState<1 | 2 | 3 | 4>(3);

  const list = useMemo(() => {
    const arr = Array.isArray(products) ? [...products] : [];

    const getDate = (p: any) =>
      new Date(p?.createdAt || p?.date || p?.updatedAt || 0).getTime();

    const getPrice = (p: any) => {
      const v = p?.price ?? p?.priceUSD;
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const n = Number(v.replace(/[^\d.]/g, ""));
        return Number.isFinite(n) ? n : Infinity;
      }
      return Infinity;
    };

    switch (sort) {
      case "newest":
        arr.sort((a, b) => getDate(b) - getDate(a));
        break;
      case "az":
        arr.sort((a, b) => getTitle(a).localeCompare(getTitle(b)));
        break;
      case "priceLow":
        arr.sort((a, b) => getPrice(a) - getPrice(b));
        break;
      case "priceHigh":
        arr.sort((a, b) => getPrice(b) - getPrice(a));
        break;
      case "recommended":
      default:
        // keep original data order
        break;
    }

    return arr;
  }, [products, sort]);

  return (
    <section id="all" className="mt-10">
      {/* Controls */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Browse All</h2>
            <p className="mt-1 text-sm text-white/60">Sort and adjust the grid.</p>
          </div>

          <div className="w-full sm:w-auto flex flex-col gap-2">
            {/* Sort dropdown */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="w-full sm:w-[220px] rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-white/90
                backdrop-blur-xl backdrop-saturate-150 hover:bg-white/10 transition focus:outline-none"
            >
              <option className="text-black" value="recommended">
                Sort: Recommended
              </option>
              <option className="text-black" value="newest">
                Sort: Newest
              </option>
              <option className="text-black" value="az">
                Sort: A → Z
              </option>
              <option className="text-black" value="priceLow">
                Sort: Price Low → High
              </option>
              <option className="text-black" value="priceHigh">
                Sort: Price High → Low
              </option>
            </select>

            {/* NEW: Columns dropdown (below sort) */}
            <select
              value={columns}
              onChange={(e) => setColumns(Number(e.target.value) as 1 | 2 | 3 | 4)}
              className="w-full sm:w-[220px] rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-white/90
                backdrop-blur-xl backdrop-saturate-150 hover:bg-white/10 transition focus:outline-none"
            >
              <option className="text-black" value={1}>
                Columns: 1
              </option>
              <option className="text-black" value={2}>
                Columns: 2
              </option>
              <option className="text-black" value={3}>
                Columns: 3
              </option>
              <option className="text-black" value={4}>
                Columns: 4
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div
        className="mt-6 grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {list.map((p: any) => (
          <Link
            key={getStableKey(p)}
            href={getProductHref(p)}
            className="group rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-black/30 transition"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-white/5 border border-white/10">
              <Image
                src={getCardImage(p)}
                alt={getTitle(p)}
                fill
                className="object-cover group-hover:scale-[1.02] transition"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>

            <div className="mt-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-white font-semibold truncate">{getTitle(p)}</div>
                <div className="mt-1 text-sm text-white/60 line-clamp-2">{getDesc(p)}</div>
              </div>

              <div className="shrink-0 text-white/80 text-sm">{getPriceLabel(p)}</div>
            </div>

            <div className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-white/90 group-hover:bg-white/10 transition text-center">
              View
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
