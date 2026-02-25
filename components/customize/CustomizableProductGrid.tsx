"use client";

import type { CustomizableProduct } from "@/types/customize";

type Props = {
  products: CustomizableProduct[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function CustomizableProductGrid({
  products,
  selectedId,
  onSelect,
}: Props) {
  return (
    <div>
      <div className="mb-3">
        <p className="text-xs uppercase tracking-[0.22em] text-white/45">Catalog</p>
        <h2 className="mt-1 text-lg font-semibold text-white">Customizable Models</h2>
      </div>
      <div className="grid gap-2.5">
        {products.map((product) => {
          const active = product.id === selectedId;
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product.id)}
              className={`rounded-lg border p-3 text-left transition ${
                active
                  ? "border-[#FF8B64]/80 bg-[#FF8B64]/15"
                  : "border-white/10 bg-black/20 hover:bg-black/30"
              }`}
              aria-pressed={active}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">{product.name}</div>
                  <div className="mt-1 text-xs text-white/65 line-clamp-2">
                    {product.description}
                  </div>
                </div>
                {active && (
                  <span className="rounded-md border border-[#FF8B64]/60 bg-[#FF8B64]/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#FFD6C8]">
                    Active
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
