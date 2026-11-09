"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";
import TemphomeCustomRequestCta from "../components/TemphomeCustomRequestCta";
import { getProductPath } from "../lib/product-url";
import type { Product } from "../data/products";

type StoredCartItem = {
  productId: string;
  quantity: number;
  previewImageUrl?: string;
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

type CartLine = {
  key: string;
  productId: string;
  product: Product;
  quantity: number;
  previewImageUrl?: string;
  customization?: StoredCartItem["customization"];
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function parseStoredCart(raw: unknown): StoredCartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: StoredCartItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const id = typeof row.productId === "string" ? row.productId : "";
    const qtyRaw =
      typeof row.quantity === "number"
        ? row.quantity
        : typeof row.qty === "number"
          ? row.qty
          : 1;
    const quantity = Math.max(1, Math.floor(qtyRaw));
    if (!id) continue;
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
      productId: id,
      quantity,
      previewImageUrl: typeof row.previewImageUrl === "string" ? row.previewImageUrl : undefined,
      customization: slots.length ? { summary, slots } : undefined,
    });
  }
  return out;
}

function cartLineKey(item: StoredCartItem) {
  return JSON.stringify({
    productId: item.productId,
    slots: (item.customization?.slots || []).map((x) => ({ slot: x.slot, filamentId: x.filamentId })),
  });
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
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [cartItems, setCartItems] = useState<StoredCartItem[]>(() =>
    readCartFromStorage()
  );

  useEffect(() => {
    let alive = true;
    async function loadProducts() {
      const res = await fetch("/api/products", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { products?: Product[] };
      if (!alive) return;
      if (res.ok && Array.isArray(data.products)) setProducts(data.products);
      setProductsLoaded(true);
    }
    void loadProducts();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    saveCartToStorage(cartItems);
  }, [cartItems]);

  const cartLines = useMemo<CartLine[]>(() => {
    const byId = new Map<string, Product>();
    for (const product of products) byId.set(product.id, product);
    const out: CartLine[] = [];
    for (const item of cartItems) {
      const product = byId.get(item.productId);
      if (!product) continue;
      out.push({
        key: cartLineKey(item),
        productId: item.productId,
        product,
        quantity: item.quantity,
        previewImageUrl: item.previewImageUrl,
        customization: item.customization,
      });
    }
    return out;
  }, [cartItems, products]);

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

  function setQuantity(lineKey: string, nextQuantity: number) {
    const quantity = Math.max(1, Math.floor(nextQuantity));
    setCartItems((prev) =>
      prev.map((x) => (cartLineKey(x) === lineKey ? { ...x, quantity } : x))
    );
  }

  function removeItem(lineKey: string) {
    setCartItems((prev) => prev.filter((x) => cartLineKey(x) !== lineKey));
  }

  function clearCart() {
    setCartItems([]);
  }

  // The cart lives in localStorage, which the server can't read: show the
  // loading state until mounted so server and first client render match.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const loading = !mounted || (!productsLoaded && cartItems.length > 0);
  const skeletonRows = mounted ? Math.min(3, Math.max(1, cartItems.length)) : 2;

  return (
    <div className="relative min-h-screen text-white">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-32 lg:pb-16">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Your cart</h1>
            <p className="mt-1 text-sm text-white/55">
              {loading
                ? "Loading your items…"
                : itemCount > 0
                  ? `${itemCount} ${itemCount === 1 ? "item" : "items"}`
                  : "Nothing here yet"}
            </p>
          </div>
          {!loading && cartLines.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs sm:text-sm text-white/45 hover:text-red-300 transition"
            >
              Clear cart
            </button>
          )}
        </header>

        {loading ? (
          <div className="mt-6 space-y-3" aria-hidden="true">
            {Array.from({ length: skeletonRows }, (_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
            ))}
          </div>
        ) : cartLines.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-white/10 bg-[#141417]/90 px-6 py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FF8B64]/12 text-[#FF8B64]">
              <ShoppingCart size={24} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-xl sm:text-2xl font-bold">Your cart is empty</h2>
            <p className="mt-1.5 text-sm text-white/55">Find something in the shop, or tell us what you want made.</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="w-full sm:w-auto rounded-2xl bg-[#FF8B64] px-7 py-3 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition"
              >
                Browse the shop
              </Link>
              <TemphomeCustomRequestCta
                buttonLabel="Get a Quote"
                className="w-full sm:w-auto rounded-2xl border border-white/15 bg-white/[0.04] px-7 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
              />
            </div>
          </section>
        ) : (
          <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <ul className="space-y-3">
              {cartLines.map((line) => {
                const swatch = line.customization?.slots?.[0]?.colorValue;
                return (
                  <li
                    key={line.key}
                    className="flex gap-3 sm:gap-4 rounded-2xl border border-white/10 bg-[#161619]/90 p-3 sm:p-4"
                  >
                    <Link
                      href={getProductPath(line.product)}
                      className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl border border-white/5 bg-black/40"
                    >
                      {(line.previewImageUrl || "").startsWith("data:") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={line.previewImageUrl} alt={line.product.name} className="h-full w-full object-cover" />
                      ) : (
                        <Image
                          src={line.previewImageUrl || getProductImage(line.product)}
                          alt={line.product.name}
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      )}
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={getProductPath(line.product)}
                          className="line-clamp-2 text-sm sm:text-base font-semibold leading-snug hover:text-[#FF8B64] transition-colors"
                        >
                          {line.product.name}
                        </Link>
                        <button
                          type="button"
                          aria-label={`Remove ${line.product.name}`}
                          onClick={() => removeItem(line.key)}
                          className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/40 hover:bg-red-500/10 hover:text-red-300 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {line.customization?.slots?.length ? (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-white/60">
                          {swatch && (
                            <span
                              className="h-3 w-3 rounded-full border border-white/30"
                              style={{ backgroundColor: swatch }}
                              aria-hidden="true"
                            />
                          )}
                          {line.customization.summary || "Custom colours selected"}
                        </p>
                      ) : null}

                      <p className="mt-1 text-xs text-white/45">{formatMoney(line.product.priceUSD)} each</p>

                      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                        <div className="inline-flex items-center rounded-xl border border-white/15 bg-white/[0.04]">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() =>
                              line.quantity > 1 ? setQuantity(line.key, line.quantity - 1) : removeItem(line.key)
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-l-xl text-white/80 hover:bg-white/10 transition"
                          >
                            {line.quantity > 1 ? <Minus size={14} /> : <Trash2 size={13} />}
                          </button>
                          <span className="min-w-8 text-center text-sm font-semibold tabular-nums">{line.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => setQuantity(line.key, line.quantity + 1)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-r-xl text-white/80 hover:bg-white/10 transition"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="text-base font-bold text-[#FF8B64] tabular-nums">
                          {formatMoney(line.product.priceUSD * line.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className="rounded-3xl border border-white/10 bg-[#141417]/90 p-5 sm:p-6 lg:sticky lg:top-28">
              <h2 className="text-lg font-bold">Order summary</h2>
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-white/65">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-white/65">
                  <dt>Delivery (Lebanon)</dt>
                  <dd className="tabular-nums">{formatMoney(estimatedShipping)}</dd>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-3 text-white">
                  <dt className="font-semibold">Total</dt>
                  <dd className="text-xl font-extrabold tabular-nums">{formatMoney(total)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-white/40">Promo codes and final delivery are applied at checkout.</p>

              <Link
                href="/checkout"
                className="mt-5 hidden lg:flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF8B64] px-5 py-3.5 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition"
              >
                Checkout <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                href="/shop"
                className="mt-3 block text-center text-sm text-white/55 hover:text-white transition"
              >
                Continue shopping
              </Link>
            </aside>
          </section>
        )}

        <Footer />
      </main>

      {/* Mobile checkout bar */}
      {!loading && cartLines.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0D0D0D]/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-[1200px] items-center gap-4">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-white/45">Total</div>
              <div className="text-lg font-extrabold tabular-nums">{formatMoney(total)}</div>
            </div>
            <Link
              href="/checkout"
              className="ml-auto flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#FF8B64] px-5 py-3.5 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition"
            >
              Checkout <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
