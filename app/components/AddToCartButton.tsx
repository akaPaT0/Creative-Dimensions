"use client";

import { useState } from "react";

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

const STORAGE_KEY = "cd_cart_v1";
const CART_UPDATED_EVENT = "cd-cart-updated";

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

function addToCart(productId: string) {
  if (typeof window === "undefined") return;
  const id = String(productId);

  let current: StoredCartItem[] = [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    current = raw ? parseStoredCart(JSON.parse(raw)) : [];
  } catch {
    current = [];
  }

  const index = current.findIndex((x) => x.productId === id && !x.customization?.slots?.length);
  if (index >= 0) {
    current[index] = { ...current[index], quantity: current[index].quantity + 1 };
  } else {
    current.push({ productId: id, quantity: 1 });
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export default function AddToCartButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        addToCart(productId);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1200);
      }}
      className={
        className ||
        "rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center text-white/90 hover:bg-white/15 transition"
      }
    >
      {added ? "Added to cart" : "Add to cart"}
    </button>
  );
}
