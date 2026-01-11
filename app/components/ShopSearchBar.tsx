"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  subCategory?: string;
  description: string;
};

type Suggestion =
  | { type: "category"; label: string; value: string }
  | { type: "subCategory"; label: string; value: string }
  | { type: "keyword"; label: string; value: string }
  | { type: "product"; label: string; value: string; slug: string };

const SYNONYMS: Record<string, string[]> = {
  key: ["keychain", "keychains", "keys", "keyring"],
  keyc: ["keychain", "keychains"],
  minecraft: ["minecraft", "mc", "creeper", "block"],
  car: ["cars", "bmw", "mercedes", "rim", "wheel"],
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

function scoreMatch(query: string, target: string) {
  // simple scoring: starts-with > contains > no match
  const q = norm(query);
  const t = norm(target);
  if (!q) return 0;
  if (t.startsWith(q)) return 100 - (t.length - q.length);
  const i = t.indexOf(q);
  if (i !== -1) return 60 - i;
  return -1;
}

export default function ShopSearchBar({
  products,
  value,
  onValueChange,
  selectedCategory,
  onCategoryChange,
  selectedSubCategory,
  onSubCategoryChange,
  onPickProduct, // optional: navigate to product page
}: {
  products: Product[];
  value: string;
  onValueChange: (v: string) => void;

  selectedCategory: string | "all";
  onCategoryChange: (v: string | "all") => void;

  selectedSubCategory: string | "all";
  onSubCategoryChange: (v: string | "all") => void;

  onPickProduct?: (slug: string, category?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) set.add(p.category);
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

    // 1) categories
    for (const c of categories) {
      const sc = scoreMatch(q, c);
      if (sc >= 0) out.push({ s: { type: "category", label: c, value: c }, score: sc + 10 });
    }

    // 2) subcategories
    for (const s of subCategories) {
      const sc = scoreMatch(q, s);
      if (sc >= 0) out.push({ s: { type: "subCategory", label: s, value: s }, score: sc + 5 });
    }

    // 3) synonyms keywords
    for (const [k, words] of Object.entries(SYNONYMS)) {
      if (!k.startsWith(q) && scoreMatch(q, k) < 0) continue;
      for (const w of words) {
        const sc = scoreMatch(q, w);
        if (sc >= 0) out.push({ s: { type: "keyword", label: w, value: w }, score: sc });
      }
    }

    // 4) product names (optional but nice)
    for (const p of products) {
      const sc = scoreMatch(q, p.name);
      if (sc >= 0) out.push({ s: { type: "product", label: p.name, value: p.name, slug: p.slug }, score: sc + 15 });
    }

    // de-dupe by (type+value)
    const seen = new Set<string>();
    const deduped: { s: Suggestion; score: number }[] = [];
    for (const item of out.sort((a, b) => b.score - a.score)) {
      const key = `${item.s.type}:${"slug" in item.s ? item.s.slug : item.s.value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
      if (deduped.length >= 8) break;
    }

    return deduped.map((x) => x.s);
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
      onCategoryChange(s.value);
      onSubCategoryChange("all");
      onValueChange(""); // optional: clear text
      return;
    }

    if (s.type === "subCategory") {
      onSubCategoryChange(s.value);
      onValueChange(""); // optional
      return;
    }

    if (s.type === "product") {
      onPickProduct?.(s.slug);
      // if you prefer: just set query instead of navigating
      // onValueChange(s.value);
      return;
    }

    // keyword
    onValueChange(s.value);
    inputRef.current?.focus();
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <input
        ref={inputRef}
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
        placeholder="Search products… (try: key, car, minecraft)"
        className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/35"
      />

      {open && suggestions.length > 0 && (
        <div className="absolute mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0D0D0D]/85 backdrop-blur-xl">
          {suggestions.map((s, i) => (
            <button
              key={`${s.type}:${"slug" in s ? s.slug : s.value}:${i}`}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(s)}
              className={`w-full px-4 py-3 text-left text-sm transition ${
                i === active ? "bg-white/10" : "bg-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white/90">{s.label}</span>
                <span className="text-xs text-white/45">
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
