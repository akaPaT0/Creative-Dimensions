"use client";

import { useState } from "react";

type StoredCartItem = {
  productId: string;
  quantity: number;
};

const STORAGE_KEY = "cd_cart_v1";
const CART_UPDATED_EVENT = "cd-cart-updated";

function parseStoredCart(raw: unknown): StoredCartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const productId = typeof row.productId === "string" ? row.productId : "";
      const quantity =
        typeof row.quantity === "number" && Number.isFinite(row.quantity)
          ? Math.max(1, Math.floor(row.quantity))
          : 1;
      if (!productId) return null;
      return { productId, quantity };
    })
    .filter((x): x is StoredCartItem => Boolean(x));
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

  const index = current.findIndex((x) => x.productId === id);
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
