"use client";

import { useState } from "react";
import {
  CART_STORAGE_KEY,
  CART_UPDATED_EVENT,
  cartLineKey,
  parseCustomization,
  type CartCustomization,
} from "@/app/lib/cart-items";

export type AddToCartOptions = {
  /** e.g. the chosen colour; items with different customization stay separate lines. */
  customization?: CartCustomization;
  /** Image shown for this line in the cart and order. */
  previewImageUrl?: string;
};

function readRawCart(): Array<Record<string, unknown>> {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      : [];
  } catch {
    return [];
  }
}

/**
 * Add one unit to the cart. Existing entries keep all their fields (e.g. custom
 * preview images); a matching line (same product, colours, option and name) is incremented.
 */
export function addToCart(productId: string, options: AddToCartOptions = {}) {
  if (typeof window === "undefined") return;
  const id = String(productId);
  const key = cartLineKey({ productId: id, customization: options.customization });
  const current = readRawCart();

  const index = current.findIndex(
    (x) =>
      cartLineKey({ productId: String(x.productId), customization: parseCustomization(x.customization) }) === key
  );

  if (index >= 0) {
    const qty = Number(current[index].quantity);
    current[index] = {
      ...current[index],
      quantity: (Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 1) + 1,
    };
  } else {
    current.push({
      productId: id,
      quantity: 1,
      ...(options.customization ? { customization: options.customization } : {}),
      ...(options.previewImageUrl ? { previewImageUrl: options.previewImageUrl } : {}),
    });
  }

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(current));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export default function AddToCartButton({
  productId,
  className,
  getOptions,
}: {
  productId: string;
  className?: string;
  /** Return options for this add, or null to cancel (e.g. no colour chosen yet). */
  getOptions?: () => AddToCartOptions | null;
}) {
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        const options = getOptions ? getOptions() : {};
        if (options === null) return;
        addToCart(productId, options);
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
