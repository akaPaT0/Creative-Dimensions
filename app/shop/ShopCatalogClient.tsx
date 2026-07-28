"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Filter, Box } from "lucide-react";

export type Product = {
  id?: string;
  name?: string;
  title?: string;
  label?: string;
  slug: string;
  category: string;
  subCategory?: string;
  featured?: boolean;
  priceUSD?: number;
  price?: number | string;
  currency?: string;
  description?: string;
  shortDesc?: string;
  shortDescription?: string;
  desc?: string;
  image?: string;
  images?: string[];
};

type Suggestion =
  | { type: "category"; label: string; value: string }
  | { type: "subCategory"; label: string; value: string }
  | { type: "keyword"; label: string; value: string }
  | {
      type: "product";
      label: string;
      value: string;
      slug: string;
      category: string;
    };

const SYNONYMS: Record<string, string[]> = {
  key: ["keychain", "keychains", "keys", "keyring"],
  keys: ["keychain", "keychains", "keyring"],
  chain: ["keychain", "keychains"],
  car: ["cars", "bmw", "mercedes", "rim", "wheel", "grille"],
  mine: ["minecraft", "mc", "creeper", "block"],
};

function norm(s: string) {
  return (s || "").trim().toLowerCase();
}

function scoreMatch(query: string, target: string) {
  const q = norm(query);
  const t = norm(target);
  if (!q) return -1;
  if (t.startsWith(q)) return 100 - (t.length - q.length);
  const i = t.indexOf(q);
  if (i !== -1) return 60 - i;
  return -1;
}

function getCardImage(p: Product) {
  if (Array.isArray(p.images) && p.images.length > 0 && p.images[0]) return p.images[0];
  if (typeof p.image === "string" && p.image.trim()) return p.image;

  const cat = p?.category;
  const sub = p?.subCategory || "other";
  const slug = p?.slug;
  if (cat && slug) return `/products/${cat}/${sub}/${slug}-1.webp`;

  return "";
}

function ProductCardImage({ p, alt }: { p: Product; alt: string }) {
  const [error, setError] = useState(false);
  const src = getCardImage(p);

  if (!src || error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 text-white/30 rounded-lg">
        <Box className="w-8 h-8 mb-1 opacity-40" />
        <span className="text-[10px] font-mono uppercase tracking-wider">3D Print</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      onError={() => setError(true)}
      className="object-cover group-hover:scale-[1.03] transition duration-300 rounded-lg"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  );
}

function getTitle(p: Product) {
  return (
    p.title ||
    p.name ||
    p.label ||
    (p.slug ? String(p.slug).replace(/-/g, " ") : "Product")
  );
}

function getDesc(p: Product) {
  return (
    p.shortDesc ||
    p.shortDescription ||
    p.desc ||
    p.description ||
    "Custom 3D print item."
  );
}

function getPriceLabel(p: Product) {
  const price = p.price ?? p.priceUSD;
  const currency = p.currency || "USD";

  if (typeof price === "number") return `$${price}`;
  if (typeof price === "string" && price.trim()) return price;
  return "Custom Quote";
}

function getNumericPrice(p: Product) {
  return Number(p.priceUSD ?? p.price ?? 0) || 0;
}

function getProductHref(p: Product) {
  if (p?.category && p?.slug) return `/shop/${p.category}/${p.slug}`;
  if (p?.category) return `/shop/${p.category}`;
  return "/shop";
}

function getStableKey(p: Product) {
  return `${p.category ?? "x"}-${p.slug ?? "no-slug"}-${p.id ?? "no-id"}`;
}

function ShopSearchBar({
  products,
  value,
  onValueChange,
  onPickCategory,
  onPickSubCategory,
  onPickProduct,
}: {
  products: Product[];
  value: string;
  onValueChange: (v: string) => void;
  onPickCategory: (cat: string) => void;
  onPickSubCategory: (sub: string) => void;
  onPickProduct: (category: string, slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const wrapRef = useRef<HTMLDivElement | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.category) set.add(p.category);
    return Array.from(set).sort();
  }, [products]);

  const subCategories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.subCategory) set.add(p.subCategory);
    return Array.from(set).sort();
  }, [products]);

  const suggestions = useMemo(() => {
    const q = norm(value);
    if (!q) return [] as Suggestion[];

    const out: { s: Suggestion; score: number }[] = [];

    for (const c of categories) {
      const sc = scoreMatch(q, c);
      if (sc >= 0)
        out.push({
          s: { type: "category", label: c, value: c },
          score: sc + 10,
        });
    }

    for (const s of subCategories) {
      const sc = scoreMatch(q, s);
      if (sc >= 0)
        out.push({
          s: { type: "subCategory", label: s, value: s },
          score: sc + 5,
        });
    }

    for (const [k, words] of Object.entries(SYNONYMS)) {
      if (!k.startsWith(q) && scoreMatch(q, k) < 0) continue;
      for (const w of words) {
        const sc = scoreMatch(q, w);
        if (sc >= 0)
          out.push({ s: { type: "keyword", label: w, value: w }, score: sc });
      }
    }

    for (const p of products) {
      const name = getTitle(p);
      const sc = scoreMatch(q, name);
      if (sc >= 0) {
        out.push({
          s: {
            type: "product",
            label: name,
            value: name,
            slug: p.slug,
            category: p.category,
          },
          score: sc + 15,
        });
      }
    }

    const seen = new Set<string>();
    const ranked = out.sort((a, b) => b.score - a.score);
    const final: Suggestion[] = [];

    for (const item of ranked) {
      const key =
        item.s.type === "product"
          ? `product:${item.s.category}/${item.s.slug}`
          : `${item.s.type}:${item.s.value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      final.push(item.s);
      if (final.length >= 8) break;
    }

    return final;
  }, [value, products, categories, subCategories]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  function pick(s: Suggestion) {
    setOpen(false);
    setActive(0);

    if (s.type === "category") {
      onPickCategory(s.value);
      onValueChange("");
      return;
    }
    if (s.type === "subCategory") {
      onPickSubCategory(s.value);
      onValueChange("");
      return;
    }
    if (s.type === "product") {
      onPickProduct(s.category, s.slug);
      return;
    }

    onValueChange(s.value);
  }

  return (
    <div ref={wrapRef} className="relative w-full z-[200]">
      <input
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open) return;

          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            const s = suggestions[active];
            if (s) {
              e.preventDefault();
              pick(s);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Search products… (try: keychain, bmw, cat)"
        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#FF8B64]/50 transition"
      />

      {open && suggestions.length > 0 && (
        <div className="absolute z-[210] mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0D0D0D]/90 backdrop-blur-xl shadow-2xl">
          {suggestions.map((s, i) => (
            <button
              key={`${s.type}:${
                s.type === "product" ? `${s.category}/${s.slug}` : s.value
              }:${i}`}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(s)}
              className={`w-full px-4 py-2.5 text-left text-sm transition ${
                i === active ? "bg-white/10 text-white" : "text-white/80"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate">{s.label}</span>
                <span className="text-xs text-[#FF8B64] shrink-0 capitalize">
                  {s.type === "subCategory" ? "sub" : s.type}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ShopCatalogClient({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | "all">("all");
  const [subCategory, setSubCategory] = useState<string | "all">("all");
  const [sort, setSort] = useState<"default" | "price-asc" | "price-desc">(
    "default"
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [columns, setColumns] = useState<1 | 2 | 3 | 4>(2);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.category) set.add(p.category);
    return ["all", ...Array.from(set).sort()] as const;
  }, [products]);

  const subCategoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (category !== "all" && p.category !== category) continue;
      if (p.subCategory) set.add(p.subCategory);
    }
    return ["all", ...Array.from(set).sort()];
  }, [products, category]);

  function resetAll() {
    setSearch("");
    setCategory("all");
    setSubCategory("all");
    setSort("default");
  }

  function renderControls() {
    return (
      <>
        <ShopSearchBar
          products={products}
          value={search}
          onValueChange={setSearch}
          onPickCategory={(c) => {
            setCategory(c);
            setSubCategory("all");
          }}
          onPickSubCategory={(s) => {
            setSubCategory(s);
          }}
          onPickProduct={(cat, slug) => {
            window.location.href = `/shop/${cat}/${slug}`;
          }}
        />

        <select
          value={category}
          onChange={(e) => {
            const v = e.target.value;
            setCategory(v);
            setSubCategory("all");
          }}
          className="rounded-xl border border-white/15 bg-[#0D0D0D]/60 px-3 py-2 text-xs text-white outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All categories" : c}
            </option>
          ))}
        </select>

        <select
          value={subCategory}
          onChange={(e) => setSubCategory(e.target.value)}
          className="rounded-xl border border-white/15 bg-[#0D0D0D]/60 px-3 py-2 text-xs text-white outline-none"
        >
          {subCategoryOptions.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All subcategories" : s}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) =>
            setSort(e.target.value as "default" | "price-asc" | "price-desc")
          }
          className="rounded-xl border border-white/15 bg-[#0D0D0D]/60 px-3 py-2 text-xs text-white outline-none"
        >
          <option value="default">Sort: Default</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>

        <select
          value={columns}
          onChange={(e) =>
            setColumns(Number(e.target.value) as 1 | 2 | 3 | 4)
          }
          className="rounded-xl border border-white/15 bg-[#0D0D0D]/60 px-3 py-2 text-xs text-white outline-none"
        >
          <option value={1}>1 Column</option>
          <option value={2}>2 Columns</option>
          <option value={3}>3 Columns</option>
          <option value={4}>4 Columns</option>
        </select>
      </>
    );
  }

  useEffect(() => {
    const handle = () => {
      if (typeof window === "undefined") return;
      if (window.location.hash === "#all") resetAll();
    };
    handle();
    window.addEventListener("hashchange", handle);
    return () => window.removeEventListener("hashchange", handle);
  }, []);

  const filtered = useMemo(() => {
    const q = norm(search);
    let list = products.slice();

    if (category !== "all") list = list.filter((p) => p.category === category);
    if (subCategory !== "all")
      list = list.filter((p) => (p.subCategory || "") === subCategory);

    if (q) {
      list = list.filter((p) => {
        const hay = `${p.id || ""} ${getTitle(p)} ${p.slug} ${p.category} ${
          p.subCategory || ""
        } ${getDesc(p)}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (sort === "price-asc") {
      list.sort((a, b) => getNumericPrice(a) - getNumericPrice(b));
    } else if (sort === "price-desc") {
      list.sort((a, b) => getNumericPrice(b) - getNumericPrice(a));
    }

    return list;
  }, [products, search, category, subCategory, sort]);

  const activeFilterCount = [
    category !== "all",
    subCategory !== "all",
    search.trim().length > 0,
  ].filter(Boolean).length;

  return (
    <>
      {/* Mobile filter bottom sheet */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 sm:hidden"
          onClick={() => setMobileFiltersOpen(false)}
        />
      )}

      <div
        className={`fixed inset-x-0 bottom-0 z-50 sm:hidden transition-transform duration-300 ease-in-out ${
          mobileFiltersOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="rounded-t-3xl border-t border-white/10 bg-[#141210] px-5 pb-10 pt-5">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-white">Filter &amp; Search</p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetAll}
                className="text-xs text-[#FF8B64] hover:opacity-80 transition"
              >
                Reset all
              </button>
            )}
          </div>
          <div className="grid gap-3">{renderControls()}</div>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(false)}
            className="mt-4 w-full rounded-xl bg-[#FF8B64] py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Show {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </button>
        </div>
      </div>

      {/* FAB for Mobile */}
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 sm:hidden">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((o) => !o)}
          aria-label="Toggle filters"
          className="flex items-center gap-2 rounded-2xl border border-white/20 bg-[#1a1918]/90 backdrop-blur-md px-5 py-3 text-sm font-medium text-white shadow-xl transition active:scale-95"
        >
          <Filter className="size-4" aria-hidden="true" />
          Filter
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FF8B64] text-[10px] font-bold text-black">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Clean borderless section */}
      <section id="all" className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Products</h2>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCategory(c);
                  setSubCategory("all");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  category === c
                    ? "bg-[#FF8B64] text-black"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {c === "all" ? "All Products" : c}
              </button>
            ))}
          </div>
        </div>

        {/* Controls — desktop search & filters */}
        <div className="mt-4 hidden gap-3 sm:grid lg:grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr_0.8fr]">
          {renderControls()}
        </div>

        {/* Count */}
        <div className="mt-4 text-xs text-white/50">
          Showing {filtered.length} items
        </div>

        {/* Clean Product Grid */}
        <div
          className="mt-6 grid gap-6"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {filtered.map((p) => (
            <Link
              key={getStableKey(p)}
              href={getProductHref(p)}
              className="group flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-white/5">
                  <ProductCardImage p={p} alt={getTitle(p)} />
                </div>

                <div className="mt-3 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-white text-sm line-clamp-2 leading-snug group-hover:text-[#FF8B64] transition">
                    {getTitle(p)}
                  </h3>
                  <span className="shrink-0 text-[#FF8B64] font-bold text-xs pt-0.5">
                    {getPriceLabel(p)}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-white/40 capitalize">
                {p.category} {p.subCategory ? `/ ${p.subCategory}` : ""}
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-12 text-center text-white/50 text-sm py-12">
            No matching products found. Try resetting your search.
          </div>
        )}

        <div className="h-16 sm:hidden" />
      </section>
    </>
  );
}
