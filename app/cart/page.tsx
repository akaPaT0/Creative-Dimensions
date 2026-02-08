"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";
import { products, type Product } from "../data/products";

type StoredCartItem = {
  productId: string;
  quantity: number;
};

type CartLine = {
  product: Product;
  quantity: number;
};

const STORAGE_KEY = "cd_cart_v1";
const CART_UPDATED_EVENT = "cd-cart-updated";

function getProductImage(product: Product) {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0];
  }
  if (product.image) return product.image;
  return "/products/placeholder.jpg";
}

function getProductHref(product: Product) {
  return `/shop/${product.category}/${product.slug}`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function parseStoredCart(raw: unknown): StoredCartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const id = typeof row.productId === "string" ? row.productId : "";
      const qtyRaw =
        typeof row.quantity === "number"
          ? row.quantity
          : typeof row.qty === "number"
            ? row.qty
            : 1;
      const quantity = Math.max(1, Math.floor(qtyRaw));
      if (!id) return null;
      return { productId: id, quantity };
    })
    .filter((x): x is StoredCartItem => Boolean(x));
}

function readCartFromStorage(): StoredCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return parseStoredCart(JSON.parse(raw));
  } catch {
    return [];
  }
}

function saveCartToStorage(items: StoredCartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<StoredCartItem[]>(() =>
    readCartFromStorage()
  );

  useEffect(() => {
    saveCartToStorage(cartItems);
  }, [cartItems]);

  const cartLines = useMemo<CartLine[]>(() => {
    const byId = new Map<string, Product>();
    for (const product of products) byId.set(product.id, product);
    return cartItems
      .map((item) => {
        const product = byId.get(item.productId);
        if (!product) return null;
        return { product, quantity: item.quantity };
      })
      .filter((x): x is CartLine => Boolean(x));
  }, [cartItems]);

  const itemCount = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.quantity, 0),
    [cartLines]
  );

  const subtotal = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.product.priceUSD * line.quantity, 0),
    [cartLines]
  );

  const estimatedShipping = cartLines.length > 0 ? 5 : 0;
  const total = subtotal + estimatedShipping;

  function setQuantity(productId: string, nextQuantity: number) {
    const quantity = Math.max(1, Math.floor(nextQuantity));
    setCartItems((prev) =>
      prev.map((x) => (x.productId === productId ? { ...x, quantity } : x))
    );
  }

  function removeItem(productId: string) {
    setCartItems((prev) => prev.filter((x) => x.productId !== productId));
  }

  function clearCart() {
    setCartItems([]);
  }

  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold text-white">Your Cart</h1>
              <p className="mt-2 text-white/70">
                Review your selected items before checkout.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-white/80">
              <ShoppingCart size={16} />
              <span>{itemCount} item(s)</span>
            </div>
          </div>
        </section>

        {cartLines.length === 0 ? (
          <section className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-10 text-center">
            <h2 className="text-2xl font-semibold text-white">Your cart is empty</h2>
            <p className="mt-2 text-white/70">
              Add products from the shop to see them here.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/shop"
                className="w-full sm:w-auto rounded-xl bg-[#FF8B64] px-5 py-2.5 font-medium text-black hover:opacity-90 transition"
              >
                Browse products
              </Link>
              <Link
                href="/user"
                className="w-full sm:w-auto rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-white/90 hover:bg-white/10 transition"
              >
                Go to account
              </Link>
            </div>
          </section>
        ) : (
          <section className="mt-5 grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-white">Items</h2>
                <button
                  type="button"
                  onClick={clearCart}
                  className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-100 hover:bg-red-500/20 transition"
                >
                  Clear cart
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {cartLines.map((line) => (
                  <article
                    key={line.product.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-3"
                  >
                    <div className="flex gap-3">
                      <Link
                        href={getProductHref(line.product)}
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5"
                      >
                        <Image
                          src={getProductImage(line.product)}
                          alt={line.product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={getProductHref(line.product)}
                          className="line-clamp-1 text-white font-medium hover:underline underline-offset-4"
                        >
                          {line.product.name}
                        </Link>
                        <p className="mt-1 text-sm text-white/75">
                          {formatMoney(line.product.priceUSD)} each
                        </p>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="inline-flex items-center rounded-lg border border-white/15 bg-white/5">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() =>
                                setQuantity(line.product.id, line.quantity - 1)
                              }
                              className="inline-flex h-8 w-8 items-center justify-center text-white/85 hover:bg-white/10 transition"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="inline-flex min-w-10 items-center justify-center px-2 text-sm text-white">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() =>
                                setQuantity(line.product.id, line.quantity + 1)
                              }
                              className="inline-flex h-8 w-8 items-center justify-center text-white/85 hover:bg-white/10 transition"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white/90">
                              {formatMoney(line.product.priceUSD * line.quantity)}
                            </span>
                            <button
                              type="button"
                              aria-label={`Remove ${line.product.name}`}
                              onClick={() => removeItem(line.product.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/30 bg-red-500/10 text-red-100 hover:bg-red-500/20 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <aside className="lg:col-span-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <h2 className="text-xl font-semibold text-white">Order Summary</h2>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between text-white/75">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-white/75">
                  <span>Shipping (Lebanon)</span>
                  <span>{formatMoney(estimatedShipping)}</span>
                </div>
                <div className="my-2 h-px bg-white/10" />
                <div className="flex items-center justify-between text-white">
                  <span className="font-medium">Total</span>
                  <span className="text-lg font-semibold">{formatMoney(total)}</span>
                </div>
              </div>

              <button
                type="button"
                className="mt-5 w-full rounded-xl bg-[#FF8B64] px-5 py-2.5 font-medium text-black hover:opacity-90 transition"
              >
                Proceed to checkout
              </button>

              <Link
                href="/shop"
                className="mt-2 block w-full rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-center text-white/90 hover:bg-white/10 transition"
              >
                Continue shopping
              </Link>

              <p className="mt-3 text-xs text-white/55">
                Taxes and final shipping are calculated during checkout.
              </p>
            </aside>
          </section>
        )}

        <Footer />
      </main>
    </div>
  );
}
