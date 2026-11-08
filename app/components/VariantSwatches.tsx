"use client";

import { Check } from "lucide-react";
import { useProductSelection } from "./ProductSelection";
import { swatchBackground } from "@/app/lib/product-variants";

/** Colour circles for products that have colour variants. */
export default function VariantSwatches() {
  const sel = useProductSelection();
  if (!sel || sel.variants.length === 0) return null;

  const { variants, selected, selectVariant, needsColour } = sel;

  return (
    <div className="mt-5">
      <div className="text-sm text-white/60">
        Colour:{" "}
        <span className={selected ? "font-semibold text-white" : needsColour ? "text-[#FF8B64]" : "text-white/40"}>
          {selected ? selected.label : "Choose a colour"}
        </span>
      </div>
      <div
        className={`mt-2.5 flex flex-wrap gap-2.5 rounded-2xl transition ${
          needsColour ? "ring-2 ring-[#FF8B64]/70 ring-offset-4 ring-offset-[#0D0D0D]" : ""
        }`}
        role="radiogroup"
        aria-label="Colour"
      >
        {variants.map((v) => {
          const on = selected?.label === v.label;
          return (
            <button
              key={v.label}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={v.label}
              title={v.label}
              onClick={() => selectVariant(v)}
              className={`relative h-10 w-10 rounded-full border transition ${
                on
                  ? "border-[#FF8B64] ring-2 ring-[#FF8B64] ring-offset-2 ring-offset-[#0D0D0D]"
                  : "border-white/25 hover:border-white/60"
              }`}
              style={{ background: swatchBackground(v) }}
            >
              {on && (
                <Check
                  size={16}
                  strokeWidth={3}
                  className="absolute inset-0 m-auto"
                  style={
                    v.hex2
                      ? { color: "#ffffff", filter: "drop-shadow(0 0 2px rgba(0,0,0,0.9))" }
                      : { color: isLight(v.hex) ? "#0D0D0D" : "#ffffff" }
                  }
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function isLight(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return false;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}
