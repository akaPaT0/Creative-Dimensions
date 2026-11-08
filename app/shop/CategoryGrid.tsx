"use client";

import { useMemo, useState } from "react";
import ProductCard, { type ProductCardData } from "../components/ProductCard";

export type CategoryGridItem = ProductCardData & {
  id: string;
  /** Filter group key, e.g. a subcategory slug. */
  group?: string;
  groupLabel?: string;
};

// Only show filter chips when they actually help.
const MIN_ITEMS_FOR_FILTERS = 6;

export default function CategoryGrid({ items }: { items: CategoryGridItem[] }) {
  const [active, setActive] = useState<string | null>(null);

  const groups = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of items) {
      if (item.group && !seen.has(item.group)) seen.set(item.group, item.groupLabel || item.group);
    }
    return [...seen.entries()];
  }, [items]);

  const showFilters = items.length >= MIN_ITEMS_FOR_FILTERS && groups.length >= 2;
  const visible = active ? items.filter((i) => i.group === active) : items;

  const chipClass = (on: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-xs sm:text-sm transition ${
      on
        ? "border-[#FF8B64] bg-[#FF8B64] font-semibold text-[#0D0D0D]"
        : "border-white/12 bg-white/[0.04] text-white/75 hover:border-white/25 hover:text-white"
    }`;

  return (
    <div>
      {showFilters && (
        <div
          className="mb-5 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Filter products"
        >
          <button type="button" aria-pressed={active === null} onClick={() => setActive(null)} className={chipClass(active === null)}>
            All
          </button>
          {groups.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={active === key}
              onClick={() => setActive(active === key ? null : key)}
              className={chipClass(active === key)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
        {visible.map((item) => (
          <ProductCard
            key={item.id}
            item={item}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            productId={item.id}
          />
        ))}
      </div>
    </div>
  );
}
