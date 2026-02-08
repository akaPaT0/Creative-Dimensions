"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/app/data/products";
import CustomizeColorsModal from "./CustomizeColorsModal";

type Props = {
  product: Product;
  className?: string;
};

const STORAGE_KEY = "cd_cart_v1";
const CART_UPDATED_EVENT = "cd-cart-updated";

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

type StoredCartItem = {
  productId: string;
  quantity: number;
  customization?: {
    summary: string;
    slots: Array<{
      slot: string;
      label: string;
      filamentId: string;
      filamentLabel: string;
      colorValue: string;
    }>;
  };
};

function parseStoredCart(raw: unknown): StoredCartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: StoredCartItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const productId = typeof row.productId === "string" ? row.productId : "";
    const quantity =
      typeof row.quantity === "number" && Number.isFinite(row.quantity)
        ? Math.max(1, Math.floor(row.quantity))
        : 1;
    if (!productId) continue;
    const customizationRaw =
      row.customization && typeof row.customization === "object"
        ? (row.customization as Record<string, unknown>)
        : null;
    const slots = Array.isArray(customizationRaw?.slots)
      ? customizationRaw.slots
          .map((slot) => {
            if (!slot || typeof slot !== "object") return null;
            const s = slot as Record<string, unknown>;
            const filamentId = typeof s.filamentId === "string" ? s.filamentId : "";
            if (!filamentId) return null;
            return {
              slot: typeof s.slot === "string" ? s.slot : "",
              label: typeof s.label === "string" ? s.label : "",
              filamentId,
              filamentLabel: typeof s.filamentLabel === "string" ? s.filamentLabel : "",
              colorValue: typeof s.colorValue === "string" ? s.colorValue : "",
            };
          })
          .filter((x): x is NonNullable<typeof x> => Boolean(x))
      : [];
    const summary = typeof customizationRaw?.summary === "string" ? customizationRaw.summary : "";
    out.push({
      productId,
      quantity,
      customization: slots.length ? { summary, slots } : undefined,
    });
  }
  return out;
}

function buildFingerprint(item: StoredCartItem) {
  const slots = item.customization?.slots || [];
  return JSON.stringify({
    productId: item.productId,
    slots: slots.map((x) => ({ slot: x.slot, filamentId: x.filamentId })),
  });
}

export default function ProductCustomizeColorsAction({ product, className = "" }: Props) {
  const customizeConfig = product.customizeColors;
  const [open, setOpen] = useState(false);
  const [filamentOptions, setFilamentOptions] = useState<FilamentOption[]>([]);
  const [selectedFilamentIds, setSelectedFilamentIds] = useState<string[]>([]);
  const [slots, setSlots] = useState<SlotInfo[]>([]);

  if (!customizeConfig) return null;

  useEffect(() => {
    if (!open) return;
    if (!slots.length) return;
    if (!filamentOptions.length) return;
    setSelectedFilamentIds((prev) => {
      const fallback = filamentOptions[0]?.id || "";
      const next = slots.map((_, index) => prev[index] || fallback);
      const same =
        prev.length === next.length && prev.every((value, index) => value === next[index]);
      return same ? prev : next;
    });
  }, [open, slots, filamentOptions]);

  async function handleOpen() {
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

  function handleAddToCart() {
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
      customization: selectedSlots.length ? { summary, slots: selectedSlots } : undefined,
    };

    let current: StoredCartItem[] = [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      current = raw ? parseStoredCart(JSON.parse(raw)) : [];
    } catch {
      current = [];
    }

    const fingerprint = buildFingerprint(newItem);
    const idx = current.findIndex((x) => buildFingerprint(x) === fingerprint);
    if (idx >= 0) {
      current[idx] = { ...current[idx], quantity: current[idx].quantity + 1 };
    } else {
      current.push(newItem);
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));

    setSelectedFilamentIds([]);
    setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={handleOpen} className={className}>
        Customize Colors
      </button>

      <CustomizeColorsModal
        open={open}
        onClose={() => setOpen(false)}
        productName={product.name}
        config={customizeConfig}
        selectedFilamentIds={selectedFilamentIds}
        onChangeFilamentIds={setSelectedFilamentIds}
        filamentOptions={filamentOptions}
        onSlotsChange={setSlots}
        onReset={handleReset}
        onAddToCart={handleAddToCart}
      />
    </>
  );
}

