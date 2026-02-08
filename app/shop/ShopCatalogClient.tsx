"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Product = {
  id?: string;
  name?: string;
  title?: string;
  label?: string;
  slug: string;
  category: string;
  subCategory?: string;
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
  const price = (p as any).price ?? p.priceUSD;
  const currency = (p as any).currency || "USD";

  if (typeof price === "number") return `${price} ${currency}`;
  if (typeof price === "string" && price.trim()) return price;
  return "DM for price";
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
                "slug" in s ? `${(s as any).category}/${(s as any).slug}` : s.value
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

  // ✅ default load as 2 columns
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

  useEffect(() => {
    const handle = () => {
      if (typeof window === "undefined") return;
      if (window.location.hash === "#all") resetAll();
    };
    handle();
    window.addEventListener("hashchange", handle);
    return () => window.removeEventListener("hashchange", handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      list.sort(
        (a, b) =>
          (Number((a as any).priceUSD ?? (a as any).price ?? 0) || 0) -
          (Number((b as any).priceUSD ?? (b as any).price ?? 0) || 0)
      );
    } else if (sort === "price-desc") {
      list.sort(
        (a, b) =>
          (Number((b as any).priceUSD ?? (b as any).price ?? 0) || 0) -
          (Number((a as any).priceUSD ?? (a as any).price ?? 0) || 0)
      );
    }

    return list;
  }, [products, search, category, subCategory, sort]);

  return (
    <section
      id="all"
      className="mt-10 isolate rounded-2xl border border-white/10 bg-white/5 p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-center sm:text-left">
        <div>
          <h2 className="text-xl font-semibold text-white">All products</h2>
          <p className="text-sm text-white/60">
            Filter by category, subcategory, or search by keyword.
          </p>
        </div>

        <div className="flex items-center justify-center sm:justify-end gap-2">
          <button
            type="button"
            onClick={resetAll}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white hover:bg-white/10 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-5 grid gap-3 lg:grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr_0.8fr]">
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
            const v = e.target.value as any;
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
          onChange={(e) => setSubCategory(e.target.value as any)}
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
          onChange={(e) => setSort(e.target.value as any)}
          className="rounded-2xl border border-white/15 bg-[#0D0D0D]/60 px-4 py-3 text-white outline-none"
        >
          <option value="default">Sort: default</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>

        <select
          value={columns}
          onChange={(e) =>
            setColumns(Number(e.target.value) as 1 | 2 | 3 | 4)
          }
          className="rounded-2xl border border-white/15 bg-[#0D0D0D]/60 px-4 py-3 text-white outline-none"
        >
          <option value={1}>Columns: 1</option>
          <option value={2}>Columns: 2</option>
          <option value={3}>Columns: 3</option>
          <option value={4}>Columns: 4</option>
        </select>
      </div>

      {/* Results */}
      <div className="mt-6 flex items-center justify-between text-sm text-white/60">
        <div>{filtered.length} results</div>
        <div className="hidden sm:block">
          Tip: type <span className="text-white/80">key</span> to see suggestions
        </div>
      </div>

      {/* Cards */}
      <div
        className="mt-4 grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {filtered.map((p) => (
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

            <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div className="min-w-0">
                <div className="text-white font-semibold text-[15px] leading-snug line-clamp-2">
                  {getTitle(p)}
                </div>
              </div>

              <div className="shrink-0 text-white/80 text-sm sm:text-right">
                {getPriceLabel(p)}
              </div>
            </div>

            <div className="mt-2 text-sm text-white/60 line-clamp-2">
              {getDesc(p)}
            </div>

            <div className="mt-2 text-xs text-white/45">
              {p.category}
              {p.subCategory ? ` / ${p.subCategory}` : ""}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-10 text-center text-white/60">
          No matches. Try a different keyword or reset filters.
        </div>
      )}
    </section>
  );
}
