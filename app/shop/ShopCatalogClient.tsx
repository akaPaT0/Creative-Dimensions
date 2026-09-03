"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Filter, Search, X, ArrowUpDown, Grid3X3, LayoutGrid } from "lucide-react";

export const ALL_CATEGORY_TABS = [
  { id: "all", label: "All Prints" },
  { id: "keychains", label: "Keychains" },
  { id: "desk-add-ons", label: "Desk Add-Ons" },
  { id: "accessories", label: "Accessories" },
  { id: "fanboys", label: "Fanboys & Gaming" },
  { id: "tools", label: "Tools" },
  { id: "new-arrivals", label: "New Arrivals" },
] as const;

export type Product = {
  id?: string;
  name?: string;
  title?: string;
  label?: string;
  slug: string;
  category: string;
  subCategory?: string;
  featured?: boolean;
  isNew?: boolean;
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
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.image === "string" && p.image) return p.image;

  // fallback for older data
  const cat = p?.category;
  const sub = p?.subCategory || "other";
  const slug = p?.slug;
  if (cat && slug) return `/products/${cat}/${sub}/${slug}-1.webp`;

  return "/products/placeholder.jpg";
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

  if (typeof price === "number") return `$${price}`;
  if (typeof price === "string" && price.trim()) {
    return price.startsWith("$") ? price : `$${price}`;
  }
  return "DM for price";
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

    // categories
    for (const c of categories) {
      const sc = scoreMatch(q, c);
      if (sc >= 0)
        out.push({
          s: { type: "category", label: c, value: c },
          score: sc + 10,
        });
    }

    // subcategories
    for (const s of subCategories) {
      const sc = scoreMatch(q, s);
      if (sc >= 0)
        out.push({
          s: { type: "subCategory", label: s, value: s },
          score: sc + 5,
        });
    }

    // synonyms
    for (const [k, words] of Object.entries(SYNONYMS)) {
      if (!k.startsWith(q) && scoreMatch(q, k) < 0) continue;
      for (const w of words) {
        const sc = scoreMatch(q, w);
        if (sc >= 0)
          out.push({ s: { type: "keyword", label: w, value: w }, score: sc });
      }
    }

    // product names
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

    // de-dupe + top 8
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
        placeholder="Search… (try: key, car, minecraft)"
        className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/35"
      />

      {open && suggestions.length > 0 && (
        <div className="absolute z-[210] mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0D0D0D]/85 backdrop-blur-xl">
          {suggestions.map((s, i) => (
            <button
              key={`${s.type}:${
                s.type === "product" ? `${s.category}/${s.slug}` : s.value
              }:${i}`}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(s)}
              className={`w-full px-4 py-3 text-left text-sm transition ${
                i === active ? "bg-white/10" : "bg-transparent"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/90 truncate">{s.label}</span>
                <span className="text-xs text-white/45 shrink-0">
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

  // null = auto-responsive (2 on mobile, 3 on tablet, 4 on desktop)
  const [columns, setColumns] = useState<number | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.category) set.add(p.category);
    return ["all", ...Array.from(set).sort()] as const;
  }, [products]);

  const subCategoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (category === "new-arrivals") {
        if (!p.isNew) continue;
      } else if (category === "tools") {
        if (p.category !== "tools" && p.subCategory !== "tools") continue;
      } else if (category !== "all" && p.category !== category) {
        continue;
      }
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
          className="rounded-2xl border border-white/15 bg-[#0D0D0D]/60 px-4 py-3 text-white outline-none"
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
          className="rounded-2xl border border-white/15 bg-[#0D0D0D]/60 px-4 py-3 text-white outline-none"
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
          className="rounded-2xl border border-white/15 bg-[#0D0D0D]/60 px-4 py-3 text-white outline-none"
        >
          <option value="default">Sort: default</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>

        <select
          value={columns ?? 3}
          onChange={(e) =>
            setColumns(Number(e.target.value))
          }
          className="rounded-2xl border border-white/15 bg-[#0D0D0D]/60 px-4 py-3 text-white outline-none"
        >
          <option value={2}>Columns: 2</option>
          <option value={3}>Columns: 3</option>
          <option value={4}>Columns: 4</option>
          <option value={5}>Columns: 5</option>
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

    if (category !== "all") {
      if (category === "new-arrivals") {
        list = list.filter((p) => p.isNew === true);
      } else if (category === "tools") {
        list = list.filter((p) => p.category === "tools" || p.subCategory === "tools");
      } else {
        list = list.filter((p) => p.category === category);
      }
    }
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

  // Count active filters for the FAB badge
  const activeFilterCount = [
    category !== "all",
    subCategory !== "all",
    search.trim().length > 0,
  ].filter(Boolean).length;

  return (
    <>
      {/* ── Mobile filter bottom sheet ─────────────────────────────────── */}
      {/* Backdrop */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 sm:hidden"
          onClick={() => setMobileFiltersOpen(false)}
        />
      )}

      {/* Sheet — slides up from the bottom */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 sm:hidden transition-transform duration-300 ease-in-out ${
          mobileFiltersOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="rounded-t-3xl border-t border-white/10 bg-[#141210] px-5 pb-10 pt-5">
          {/* Drag handle */}
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

          <div className="grid gap-3.5">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSubCategory("all");
                }}
                className="w-full rounded-xl border border-white/15 bg-[#1c1a18] px-3.5 py-2.5 text-sm text-white outline-none"
              >
                {ALL_CATEGORY_TABS.map((tab) => (
                  <option key={`m-cat-${tab.id}`} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>

            {subCategoryOptions.length > 1 && (
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5">
                  Subcategory
                </label>
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#1c1a18] px-3.5 py-2.5 text-sm text-white outline-none"
                >
                  {subCategoryOptions.map((s) => (
                    <option key={`m-sub-${s}`} value={s}>
                      {s === "all" ? "All Subcategories" : s.replace(/-/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5">
                Sort By
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="w-full rounded-xl border border-white/15 bg-[#1c1a18] px-3.5 py-2.5 text-sm text-white outline-none"
              >
                <option value="default">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen(false)}
            className="mt-4 w-full rounded-xl bg-[#FF8B64] py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Show Results
          </button>
        </div>
      </div>

      {/* FAB — fixed, always visible on mobile */}
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

    <section
      id="all"
      className="mt-20 sm:mt-28 w-full min-w-0 max-w-full"
    >
      <div className="flex items-baseline justify-between gap-3 text-left mb-3 sm:mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">All Products</h2>
        </div>

        <button
          type="button"
          onClick={resetAll}
          className="hidden rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs sm:text-sm text-white transition hover:bg-white/10 sm:inline-flex"
        >
          Reset filters
        </button>
      </div>

      {/* ── CATEGORY PILLS (NO WRAPPER BOX) ──────── */}
      <div className="mt-4 w-full min-w-0 max-w-full">
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
          {ALL_CATEGORY_TABS.map((tab) => {
            const isActive = category === tab.id;
            return (
              <button
                key={`cat-tab-${tab.id}`}
                type="button"
                onClick={() => {
                  setCategory(tab.id);
                  setSubCategory("all");
                }}
                className={`relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-[#FF8B64] text-black font-bold shadow-md shadow-[#FF8B64]/20 scale-[1.02]"
                    : "border border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-white/25 hover:bg-white/10"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── UNIFIED TOOLBAR: SEARCH, SUBCATEGORY & SORT ─────────────── */}
      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Live Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, car, anime, keyword..."
            className="w-full rounded-xl border border-white/10 bg-[#141417]/80 pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder:text-white/40 outline-none focus:border-[#FF8B64]/60 transition-all duration-200"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white p-1"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Right Controls: Subcategory, Sort & Grid Layout */}
        <div className="flex items-center gap-2.5 justify-between sm:justify-end flex-wrap">
          {/* Active filter count / clear */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetAll}
              className="text-xs text-[#FF8B64] hover:underline transition sm:hidden"
            >
              Clear filters
            </button>
          )}

          {/* Contextual Subcategory Filter (unified style) */}
          {category !== "all" && subCategoryOptions.length > 2 && (
            <div className="relative">
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="appearance-none rounded-xl border border-white/10 bg-[#141417]/80 pl-3.5 pr-8 py-2.5 text-xs sm:text-sm text-white/80 font-medium outline-none focus:border-[#FF8B64]/60 transition cursor-pointer capitalize"
              >
                {subCategoryOptions.map((s) => (
                  <option key={`sub-opt-${s}`} value={s} className="bg-[#141417] text-white">
                    {s === "all" ? `All ${category.replace(/-/g, " ")}` : s.replace(/-/g, " ")}
                  </option>
                ))}
              </select>
              <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-white/40 pointer-events-none" />
            </div>
          )}

          {/* Sort Selector (unified style) */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="appearance-none rounded-xl border border-white/10 bg-[#141417]/80 pl-3.5 pr-8 py-2.5 text-xs sm:text-sm text-white/80 font-medium outline-none focus:border-[#FF8B64]/60 transition cursor-pointer"
            >
              <option value="default" className="bg-[#141417] text-white">Sort: Featured</option>
              <option value="price-asc" className="bg-[#141417] text-white">Price: Low to High</option>
              <option value="price-desc" className="bg-[#141417] text-white">Price: High to Low</option>
            </select>
            <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-white/40 pointer-events-none" />
          </div>

          {/* Desktop Column Density Toggle (3 or 4 cols) */}
          <div className="hidden sm:flex items-center rounded-xl border border-white/10 bg-[#141417]/80 p-1">
            <button
              type="button"
              onClick={() => setColumns(3)}
              title="3 Columns"
              className={`p-1.5 rounded-lg transition ${
                (columns ?? 3) === 3 ? "bg-white/15 text-white" : "text-white/40 hover:text-white"
              }`}
            >
              <Grid3X3 className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setColumns(4)}
              title="4 Columns"
              className={`p-1.5 rounded-lg transition ${
                (columns ?? 3) === 4 ? "bg-white/15 text-white" : "text-white/40 hover:text-white"
              }`}
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Tip */}
      <div className="mt-4 hidden sm:flex items-center justify-end text-xs text-white/40">
        <div>Tip: search by item name or category</div>
      </div>

      {/* Cards */}
      <div
        className={`mt-4 grid gap-3 sm:gap-4 lg:gap-5 ${
          columns === null
            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3"
            : "max-sm:!grid-cols-2"
        }`}
        style={
          columns !== null
            ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
            : undefined
        }
      >
        {filtered.map((p) => (
          <Link
            key={getStableKey(p)}
            href={getProductHref(p)}
            className="group flex flex-col rounded-2xl border border-white/10 bg-[#161619]/90 hover:border-[#FF8B64]/40 transition-all duration-200 p-2.5 sm:p-3 shadow-md"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/40 border border-white/5">
              <Image
                src={getCardImage(p)}
                alt={getTitle(p)}
                fill
                className="object-cover group-hover:scale-[1.04] transition duration-300"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>

            <div className="mt-2.5 flex flex-col flex-1 justify-between">
              <div>
                <div className="text-white text-xs sm:text-sm font-semibold line-clamp-1 group-hover:text-[#FF8B64] transition-colors">
                  {getTitle(p)}
                </div>
                <div className="text-[11px] text-white/40 capitalize mt-0.5 truncate">
                  {p.category}{p.subCategory ? ` · ${p.subCategory}` : ""}
                </div>
              </div>

              <div className="mt-1.5 text-xs sm:text-sm font-bold text-[#FF8B64]">
                {getPriceLabel(p)}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-10 text-center text-white/60">
          No matches. Try a different keyword or reset filters.
        </div>
      )}

      {/* Bottom padding so FAB doesn't overlap last card */}
      <div className="h-16 sm:hidden" />
    </section>
    </>
  );
}
