"use client";

import {
  CART_STORAGE_KEY,
  cartLineKey,
  parseStoredCart,
  writeStoredCart,
  type StoredCartItem,
} from "@/app/lib/cart-items";
import { useState } from "react";
import dynamic from "next/dynamic";
import type { Product } from "@/app/data/products";

const CustomizeColorsModal = dynamic(() => import("./CustomizeColorsModal"), {
  ssr: false,
});

type Props = {
  product: Product;
  className?: string;
};

const CUSTOMIZE_COLORS_ENABLED =
  process.env.NEXT_PUBLIC_CUSTOMIZE_COLORS === "1";

type FilamentOption = {
  id: string;
  type: string;
  color: string;
  hex: string;
  brand: string;
  finish: string;
  label: string;
};

type SlotInfo = {
  key: string;
  materialName: string;
};


function buildFingerprint(item: StoredCartItem) {
  return cartLineKey(item);
}

function tokenize(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function pickBestFilamentId(slotLabel: string, options: FilamentOption[]) {
  const slotTokens = tokenize(slotLabel);
  if (!slotTokens.length || !options.length) return options[0]?.id || "";

  let bestId = options[0]?.id || "";
  let bestScore = -1;

  for (const option of options) {
    const hay = `${option.color} ${option.label} ${option.type} ${option.brand} ${option.finish}`;
    const optionTokens = tokenize(hay);
    const optionTokenSet = new Set(optionTokens);
    let score = 0;

    for (const token of slotTokens) {
      if (optionTokenSet.has(token)) {
        score += 5;
        continue;
      }
      if (optionTokens.some((word) => word.includes(token) || token.includes(word))) {
        score += 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestId = option.id;
    }
  }

  return bestId;
}

export default function ProductCustomizeColorsAction({ product, className = "" }: Props) {
  const customizeConfig = product.customizeColors;
  const [open, setOpen] = useState(false);
  const [filamentOptions, setFilamentOptions] = useState<FilamentOption[]>([]);
  const [selectedFilamentIds, setSelectedFilamentIds] = useState<string[]>([]);
  const [slots, setSlots] = useState<SlotInfo[]>([]);

  function syncSelectedFilaments(nextSlots: SlotInfo[], options: FilamentOption[]) {
    if (!customizeConfig || !CUSTOMIZE_COLORS_ENABLED) return;
    if (!nextSlots.length) return;
    if (!options.length) return;

    setSelectedFilamentIds((prev) => {
      const fallback = options[0]?.id || "";
      const next = nextSlots.map((slot, index) => {
        if (prev[index]) return prev[index];
        const slotName = slot.materialName || `slot ${index + 1}`;
        const guessed = pickBestFilamentId(slotName, options);
        return guessed || fallback;
      });
      const same =
        prev.length === next.length && prev.every((value, index) => value === next[index]);
      return same ? prev : next;
    });
  }

  function handleSlotsChange(nextSlots: SlotInfo[]) {
    setSlots(nextSlots);
    syncSelectedFilaments(nextSlots, filamentOptions);
  }

  async function handleOpen() {
    if (!customizeConfig || !CUSTOMIZE_COLORS_ENABLED) return;

    try {
      const res = await fetch("/api/filaments", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as {
        items?: Array<{
          id?: string;
          type?: string;
          color?: string;
          hex?: string;
          brand?: string;
          finish?: string;
        }>;
      };
      if (res.ok && Array.isArray(data.items)) {
        setFilamentOptions(
          data.items
            .map((x) => {
              const id = typeof x.id === "string" ? x.id : "";
              const color = typeof x.color === "string" ? x.color.trim() : "";
              const hexRaw = typeof x.hex === "string" ? x.hex.trim() : "";
              const hex = /^#([0-9a-fA-F]{6})$/.test(hexRaw) ? hexRaw.toLowerCase() : "";
              if (!id || !color) return null;
              const type = typeof x.type === "string" ? x.type.trim() : "";
              const brand = typeof x.brand === "string" ? x.brand.trim() : "";
              const finish = typeof x.finish === "string" ? x.finish.trim() : "";
              return {
                id,
                type,
                color,
                hex,
                brand,
                finish,
                label: color,
              };
            })
            .filter((x): x is FilamentOption => Boolean(x))
        );
      }
    } catch {
      setFilamentOptions([]);
    }
    setSelectedFilamentIds([]);
    setOpen(true);
  }

  function handleReset() {
    setSelectedFilamentIds([]);
  }

  function handleAddToCart(previewImageUrl?: string) {
    if (typeof window === "undefined") return;
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const selectedSlots = slots
      .map((slot, index) => {
        const filamentId = selectedFilamentIds[index] || "";
        if (!filamentId) return null;
        const option = filamentOptions.find((x) => x.id === filamentId);
        if (!option) return null;
        const slotLetter = letters[index] || String(index + 1);
        const slotLabel =
          customizeConfig?.slotLabels?.[index] || slot.materialName || `Slot ${slotLetter}`;
        return {
          slot: slotLetter,
          label: slotLabel,
          filamentId: option.id,
          filamentLabel: option.label,
          colorValue: option.hex || option.color,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    const summary = selectedSlots.length
      ? `Custom colors (${selectedSlots.map((x) => `${x.slot}:${x.colorValue}`).join(", ")})`
      : "";

    const newItem: StoredCartItem = {
      productId: String(product.id),
      quantity: 1,
      previewImageUrl,
      customization: selectedSlots.length ? { summary, slots: selectedSlots } : undefined,
    };

    let current: StoredCartItem[] = [];
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      current = raw ? parseStoredCart(JSON.parse(raw)) : [];
    } catch {
      current = [];
    }

    const fingerprint = buildFingerprint(newItem);
    const idx = current.findIndex((x) => buildFingerprint(x) === fingerprint);
    if (idx >= 0) {
      current[idx] = {
        ...current[idx],
        quantity: current[idx].quantity + 1,
        previewImageUrl: previewImageUrl || current[idx].previewImageUrl,
      };
    } else {
      current.push(newItem);
    }

    writeStoredCart(current);

    setSelectedFilamentIds([]);
    setOpen(false);
  }

  if (!customizeConfig || !CUSTOMIZE_COLORS_ENABLED) {
    return (
      <button type="button" disabled className={className} aria-disabled="true">
        Coming soon
      </button>
    );
  }

  return (
    <>
      <button type="button" onClick={handleOpen} className={className}>
        Customize Colors
      </button>

      {open && (
        <CustomizeColorsModal
          open={open}
          onClose={() => setOpen(false)}
          productName={product.name}
          config={customizeConfig}
          selectedFilamentIds={selectedFilamentIds}
          onChangeFilamentIds={setSelectedFilamentIds}
          filamentOptions={filamentOptions}
          onSlotsChange={handleSlotsChange}
          onReset={handleReset}
          onAddToCart={handleAddToCart}
        />
      )}
    </>
  );
}

