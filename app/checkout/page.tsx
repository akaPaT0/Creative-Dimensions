"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Check, CheckCircle2, Loader2, Lock, MapPin, Printer } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";
import type { Product } from "../data/products";
import { openInvoiceWindow } from "@/app/lib/invoiceWindow";
import AuthModal from "../components/AuthModal";
import { authFetch, useSupabaseAuth } from "@/app/lib/supabase/auth-client";

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

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type AddressFormState = {
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type PromoRule = {
  label?: string;
  description?: string;
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  minSubtotal?: number;
  maxDiscount?: number;
};

type PlacedOrderPrintData = {
  id?: string;
  orderNumber?: string;
  createdAt?: string;
  subtotalUSD?: number;
  discountUSD?: number;
  shippingUSD?: number;
  totalUSD?: number;
  status?: string;
  invoice?: {
    invoiceNumber?: string;
    issuedAt?: string;
    paymentStatus?: string;
  };
  address?: {
    fullName?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  items?: Array<{
    name?: string;
    quantity?: number;
    unitPriceUSD?: number;
    lineTotalUSD?: number;
    customizationSummary?: string;
  }>;
};

const STORAGE_KEY = "cd_cart_v1";
const CART_UPDATED_EVENT = "cd-cart-updated";
const EMPTY_ADDRESS_FORM: AddressFormState = {
  label: "",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "LB",
  isDefault: false,
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
      previewImageUrl: typeof row.previewImageUrl === "string" ? row.previewImageUrl : undefined,
      customization: slots.length ? { summary, slots } : undefined,
    });
  }
  return out;
}

function readCart(): StoredCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? parseStoredCart(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function computePromoDiscount(
  subtotalUSD: number,
  shippingUSD: number,
  rawCode: string,
  rules: Record<string, PromoRule>
) {
  const normalized = rawCode.trim().toUpperCase();
  if (!normalized) {
    return { discountUSD: 0, shippingUSD, normalized: "" };
  }

  const rule = rules[normalized];
  if (!rule) {
    return {
      discountUSD: 0,
      shippingUSD,
      normalized,
      error: "Invalid promo code.",
    };
  }

  if (rule.minSubtotal && subtotalUSD < rule.minSubtotal) {
    return {
      discountUSD: 0,
      shippingUSD,
      normalized,
      error: `Code requires at least ${formatMoney(rule.minSubtotal)} subtotal.`,
    };
  }

  if (rule.type === "free_shipping") {
    return { discountUSD: 0, shippingUSD: 0, normalized };
  }

  const baseDiscount =
    rule.type === "percent"
      ? (subtotalUSD * rule.value) / 100
      : rule.value;

  let discountUSD = Math.min(subtotalUSD, baseDiscount);
  if (rule.maxDiscount && rule.maxDiscount > 0) {
    discountUSD = Math.min(discountUSD, rule.maxDiscount);
  }

  return { discountUSD, shippingUSD, normalized };
}

export default function CheckoutPage() {
  const { isLoaded, isSignedIn } = useSupabaseAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [authOpen, setAuthOpen] = useState(false);

  const [cart, setCart] = useState<StoredCartItem[]>(() => readCart());
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [successOrderMessage, setSuccessOrderMessage] = useState("");
  const [placedOrderPrintData, setPlacedOrderPrintData] = useState<PlacedOrderPrintData | null>(
    null
  );

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressFormState>(
    EMPTY_ADDRESS_FORM
  );

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoInfo, setPromoInfo] = useState("");
  const [promoRules, setPromoRules] = useState<Record<string, PromoRule>>({});
  const [promoChecking, setPromoChecking] = useState(false);

  async function loadAddresses() {
    const res = await authFetch("/api/addresses");
    const data = (await res.json().catch(() => ({}))) as { addresses?: Address[] };
    if (res.ok && Array.isArray(data.addresses)) {
      setAddresses(data.addresses);
      const preferred =
        data.addresses.find((x) => x.isDefault)?.id ?? data.addresses[0]?.id ?? "";
      setAddressId(preferred);
    } else {
      setAddresses([]);
      setAddressId("");
    }
  }

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let alive = true;

    async function init() {
      setLoadingAddresses(true);
      await loadAddresses();
      if (!alive) return;
      setLoadingAddresses(false);
    }

    void init();
    return () => {
      alive = false;
    };
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    let alive = true;
    async function loadProducts() {
      const res = await fetch("/api/products", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { products?: Product[] };
      if (!alive) return;
      if (res.ok && Array.isArray(data.products)) setProducts(data.products);
    }
    void loadProducts();
    return () => {
      alive = false;
    };
  }, []);

  const itemCount = useMemo(() => cart.reduce((sum, x) => sum + x.quantity, 0), [cart]);

  const subtotal = useMemo(() => {
    const byId = new Map(products.map((p) => [String(p.id), p]));
    return cart.reduce((sum, row) => {
      const p = byId.get(row.productId);
      if (!p) return sum;
      return sum + p.priceUSD * row.quantity;
    }, 0);
  }, [cart, products]);

  const cartPreview = useMemo(() => {
    const byId = new Map(products.map((p) => [String(p.id), p]));
    return cart
      .map((row) => {
        const product = byId.get(row.productId);
        if (!product) return null;
        return {
          key: JSON.stringify({
            productId: row.productId,
            slots: (row.customization?.slots || []).map((x) => x.filamentId),
          }),
          productId: row.productId,
          name: product.name,
          quantity: row.quantity,
          lineTotalUSD: product.priceUSD * row.quantity,
          customizationSummary: row.customization?.summary || "",
          image:
            row.previewImageUrl ||
            (Array.isArray(product.images) && product.images[0]) ||
            product.image ||
            "/products/placeholder.jpg",
          colour: row.customization?.slots?.[0]?.colorValue || "",
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [cart, products]);

  const promoSummary = useMemo(
    () =>
      computePromoDiscount(
        subtotal,
        subtotal > 0 ? 5 : 0,
        appliedPromoCode,
        promoRules
      ),
    [subtotal, appliedPromoCode, promoRules]
  );
  const promoDiscount = promoSummary.discountUSD;
  const shipping = promoSummary.shippingUSD;
  const total = subtotal - promoDiscount + shipping;

  async function placeOrder() {
    if (placing) return;
    setError("");
    setSuccessOrderMessage("");
    setPlacedOrderPrintData(null);

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!addressId) {
      setError("Please choose a shipping address.");
      return;
    }

    setPlacing(true);
    try {
      const res = await authFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          addressId,
          promoCode: appliedPromoCode || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        order?: PlacedOrderPrintData;
      };
      if (!res.ok) {
        setError(data.error || "Could not place order.");
        return;
      }

      const orderLabel = data.order?.orderNumber || data.order?.id || "Order placed";
      const invoiceLabel = data.order?.invoice?.invoiceNumber;
      setSuccessOrderMessage(
        invoiceLabel
          ? `${orderLabel} | Invoice ${invoiceLabel}`
          : orderLabel
      );
      setPlacedOrderPrintData(data.order ?? null);
      setCart([]);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        window.dispatchEvent(new Event(CART_UPDATED_EVENT));
      }
    } catch {
      setError("Could not place order.");
    } finally {
      setPlacing(false);
    }
  }

  async function addAddress() {
    if (addingAddress) return;
    setError("");

    setAddingAddress(true);
    try {
      const res = await authFetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        address?: Address;
      };

      if (!res.ok) {
        setError(data.error || "Could not add address.");
        return;
      }

      setAddressForm(EMPTY_ADDRESS_FORM);
      setShowAddressForm(false);
      await loadAddresses();
      if (data.address?.id) setAddressId(data.address.id);
    } catch {
      setError("Could not add address.");
    } finally {
      setAddingAddress(false);
    }
  }

  /** Ask the server about one typed code. Returns the rule, null if it isn't valid, or throws. */
  async function lookupPromo(code: string): Promise<PromoRule | null> {
    const res = await fetch(`/api/promocodes?code=${encodeURIComponent(code)}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      promos?: Array<{
        code?: string;
        label?: string;
        description?: string;
        type?: PromoRule["type"];
        value?: number;
        minSubtotal?: number;
        maxDiscount?: number;
      }>;
    };
    if (!res.ok) throw new Error(data.error || "Promo codes are temporarily unavailable. Please try again.");
    const promo = (data.promos ?? []).find(
      (x) => typeof x.code === "string" && x.code.toUpperCase() === code
    );
    if (!promo) return null;
    return {
      label: typeof promo.label === "string" ? promo.label : "",
      description: typeof promo.description === "string" ? promo.description : "",
      type: promo.type === "fixed" || promo.type === "free_shipping" ? promo.type : "percent",
      value: typeof promo.value === "number" ? Math.max(0, promo.value) : 0,
      minSubtotal: typeof promo.minSubtotal === "number" ? Math.max(0, promo.minSubtotal) : 0,
      maxDiscount: typeof promo.maxDiscount === "number" ? Math.max(0, promo.maxDiscount) : 0,
    };
  }

  async function applyPromo() {
    if (promoChecking) return;
    setPromoError("");
    setPromoInfo("");

    const typed = promoInput.trim().toUpperCase();
    if (!typed) {
      setAppliedPromoCode("");
      setPromoInfo("Promo code removed.");
      return;
    }

    let rules = promoRules;
    if (!rules[typed]) {
      setPromoChecking(true);
      try {
        const found = await lookupPromo(typed);
        if (found) {
          rules = { ...promoRules, [typed]: found };
          setPromoRules(rules);
        }
      } catch (e) {
        setAppliedPromoCode("");
        setPromoError(e instanceof Error ? e.message : "Promo codes are temporarily unavailable. Please try again.");
        return;
      } finally {
        setPromoChecking(false);
      }
    }

    const result = computePromoDiscount(subtotal, subtotal > 0 ? 5 : 0, typed, rules);
    if (result.error) {
      setAppliedPromoCode("");
      setPromoError(result.error);
      return;
    }

    const rule = rules[result.normalized];
    let context = `You saved ${formatMoney(result.discountUSD)}.`;
    if (rule?.type === "free_shipping") {
      const shippingSaved = subtotal > 0 ? 5 : 0;
      context = `Free shipping applied. You saved ${formatMoney(shippingSaved)} on shipping.`;
    } else if (rule?.type === "percent") {
      context = `${rule.value}% off applied. You saved ${formatMoney(
        result.discountUSD
      )}.`;
    } else if (rule?.type === "fixed") {
      context = `${formatMoney(rule.value)} off applied. You saved ${formatMoney(
        result.discountUSD
      )}.`;
    }

    const extra = rule?.description ? ` ${rule.description}` : "";
    setAppliedPromoCode(result.normalized);
    setPromoInfo(`Promo ${result.normalized} applied. ${context}${extra}`);
  }

  // Cart and auth only exist in the browser: hold a loading state until both are ready.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const ready = mounted && isLoaded;
  const placed = !!successOrderMessage;
  const step = placed ? 3 : 2;

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#FF8B64]/60";
  const labelClass = "text-xs font-semibold uppercase tracking-wider text-white/50";

  const placeButton = (extra = "") => (
    <button
      type="button"
      onClick={() => void placeOrder()}
      disabled={placing || cart.length === 0}
      className={`flex items-center justify-center gap-2 rounded-2xl bg-[#FF8B64] px-6 py-3.5 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] disabled:opacity-60 transition ${extra}`}
    >
      {placing ? (
        <>
          <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Placing order…
        </>
      ) : (
        <>
          <Lock size={15} aria-hidden="true" /> Place order
        </>
      )}
    </button>
  );

  return (
    <div className="relative min-h-screen text-white">
      <Background />
      <Navbar />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <main className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-32 lg:pb-16">
        {/* Steps */}
        <ol className="flex items-center gap-2 text-xs sm:text-sm" aria-label="Checkout steps">
          {["Cart", "Checkout", "Done"].map((label, i) => {
            const n = i + 1;
            const state = n < step ? "done" : n === step ? "current" : "todo";
            return (
              <li key={label} className="flex items-center gap-2">
                {i > 0 && <span className={`h-px w-6 sm:w-10 ${n <= step ? "bg-[#FF8B64]/60" : "bg-white/15"}`} />}
                <span
                  className={`flex items-center gap-1.5 ${
                    state === "current" ? "font-semibold text-white" : state === "done" ? "text-[#FF8B64]" : "text-white/35"
                  }`}
                  aria-current={state === "current" ? "step" : undefined}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      state === "todo" ? "border border-white/20 text-white/40" : "bg-[#FF8B64] text-[#0D0D0D]"
                    }`}
                  >
                    {state === "done" ? <Check size={11} strokeWidth={3} /> : n}
                  </span>
                  {n === 1 && state === "done" && !placed ? <Link href="/cart" className="hover:underline">{label}</Link> : label}
                </span>
              </li>
            );
          })}
        </ol>

        {!ready ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]" aria-busy="true">
            <div className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
            <div className="h-96 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
          </div>
        ) : placed ? (
          /* Success */
          <section className="mx-auto mt-8 max-w-lg rounded-3xl border border-white/10 bg-[#141417]/90 p-6 text-center sm:p-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
              <CheckCircle2 size={34} aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight">Order placed!</h1>
            <p className="mt-2 text-sm text-white/60">Thanks for your order. We&rsquo;ll be in touch to confirm the details.</p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-white/50">Order</span>
                <span className="font-semibold">{placedOrderPrintData?.orderNumber || successOrderMessage}</span>
              </div>
              {placedOrderPrintData?.invoice?.invoiceNumber && (
                <div className="mt-1.5 flex justify-between gap-3">
                  <span className="text-white/50">Invoice</span>
                  <span className="font-semibold">{placedOrderPrintData.invoice.invoiceNumber}</span>
                </div>
              )}
              {typeof placedOrderPrintData?.totalUSD === "number" && (
                <div className="mt-1.5 flex justify-between gap-3">
                  <span className="text-white/50">Total</span>
                  <span className="font-semibold text-[#FF8B64]">{formatMoney(placedOrderPrintData.totalUSD)}</span>
                </div>
              )}
            </div>
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {placedOrderPrintData?.id ? (
                <Link
                  href={`/orders/${encodeURIComponent(placedOrderPrintData.id)}`}
                  className="rounded-2xl bg-[#FF8B64] px-5 py-3 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition"
                >
                  Track order
                </Link>
              ) : (
                <Link
                  href="/orders"
                  className="rounded-2xl bg-[#FF8B64] px-5 py-3 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition"
                >
                  My orders
                </Link>
              )}
              {placedOrderPrintData?.id && (
                <button
                  type="button"
                  onClick={() => openInvoiceWindow(`/invoice/${encodeURIComponent(placedOrderPrintData.id!)}`)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
                >
                  <Printer size={15} aria-hidden="true" /> Print invoice
                </button>
              )}
            </div>
            <Link href="/shop" className="mt-4 inline-block text-sm text-white/55 hover:text-white transition">
              Continue shopping
            </Link>
          </section>
        ) : !isSignedIn ? (
          /* Signed out */
          <section className="mx-auto mt-8 max-w-lg rounded-3xl border border-white/10 bg-[#141417]/90 p-6 text-center sm:p-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FF8B64]/12 text-[#FF8B64]">
              <Lock size={22} aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Sign in to check out</h1>
            <p className="mt-2 text-sm text-white/60">
              Your order is saved to your account so you can track it and get your invoice.
            </p>
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="mt-6 w-full rounded-2xl bg-[#FF8B64] px-5 py-3 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition"
            >
              Sign in or create account
            </button>
            <Link href="/cart" className="mt-3 inline-block text-sm text-white/55 hover:text-white transition">
              Back to cart
            </Link>
          </section>
        ) : cart.length === 0 ? (
          /* Empty */
          <section className="mx-auto mt-8 max-w-lg rounded-3xl border border-white/10 bg-[#141417]/90 p-6 text-center sm:p-10">
            <h1 className="text-2xl font-extrabold tracking-tight">Your cart is empty</h1>
            <p className="mt-2 text-sm text-white/60">Add something before checking out.</p>
            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-2xl bg-[#FF8B64] px-7 py-3 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition"
            >
              Browse the shop
            </Link>
          </section>
        ) : (
          <>
            <h1 className="mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight">Checkout</h1>

            <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
              {/* Address */}
              <div className="rounded-3xl border border-white/10 bg-[#141417]/90 p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <MapPin size={18} className="text-[#FF8B64]" aria-hidden="true" /> Delivery address
                  </h2>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAddressForm((v) => !v)}
                      className="text-sm font-semibold text-[#FF8B64] hover:text-[#ffa282] transition"
                    >
                      {showAddressForm ? "Cancel" : "+ New address"}
                    </button>
                  )}
                </div>

                {loadingAddresses ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-busy="true">
                    <div className="h-28 animate-pulse rounded-2xl bg-white/[0.05]" />
                    <div className="h-28 animate-pulse rounded-2xl bg-white/[0.05]" />
                  </div>
                ) : addresses.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Delivery address">
                    {addresses.map((addr) => {
                      const on = addressId === addr.id;
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setAddressId(addr.id)}
                          className={`relative rounded-2xl border p-4 text-left transition ${
                            on
                              ? "border-[#FF8B64] bg-[#FF8B64]/[0.08]"
                              : "border-white/10 bg-white/[0.03] hover:border-white/25"
                          }`}
                        >
                          <span
                            className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border ${
                              on ? "border-[#FF8B64] bg-[#FF8B64] text-[#0D0D0D]" : "border-white/25"
                            }`}
                            aria-hidden="true"
                          >
                            {on && <Check size={12} strokeWidth={3} />}
                          </span>
                          <div className="pr-7 text-sm font-semibold">{addr.label || "Address"}</div>
                          <div className="mt-1.5 text-sm text-white/80">{addr.fullName}</div>
                          <div className="text-xs text-white/55">{addr.phone}</div>
                          <div className="mt-1.5 text-xs leading-relaxed text-white/55">
                            {addr.line1}
                            {addr.line2 ? `, ${addr.line2}` : ""}
                            <br />
                            {addr.city}, {addr.state} {addr.postalCode}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  !showAddressForm && (
                    <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-5 text-center">
                      <p className="text-sm text-white/60">Add where you&rsquo;d like your order delivered.</p>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(true)}
                        className="mt-3 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold hover:bg-white/10 transition"
                      >
                        + Add address
                      </button>
                    </div>
                  )
                )}

                {showAddressForm && (
                  <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-2">
                    <label className={labelClass}>
                      Label
                      <input
                        value={addressForm.label}
                        onChange={(e) => setAddressForm((x) => ({ ...x, label: e.target.value }))}
                        className={inputClass}
                        placeholder="Home, Work…"
                      />
                    </label>
                    <label className={labelClass}>
                      Full name*
                      <input
                        value={addressForm.fullName}
                        onChange={(e) => setAddressForm((x) => ({ ...x, fullName: e.target.value }))}
                        className={inputClass}
                        autoComplete="name"
                      />
                    </label>
                    <label className={labelClass}>
                      Phone*
                      <input
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm((x) => ({ ...x, phone: e.target.value }))}
                        className={inputClass}
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </label>
                    <label className={labelClass}>
                      Country*
                      <input
                        value={addressForm.country}
                        onChange={(e) => setAddressForm((x) => ({ ...x, country: e.target.value }))}
                        className={inputClass}
                        autoComplete="country-name"
                      />
                    </label>
                    <label className={`${labelClass} sm:col-span-2`}>
                      Address line 1*
                      <input
                        value={addressForm.line1}
                        onChange={(e) => setAddressForm((x) => ({ ...x, line1: e.target.value }))}
                        className={inputClass}
                        autoComplete="address-line1"
                      />
                    </label>
                    <label className={`${labelClass} sm:col-span-2`}>
                      Address line 2
                      <input
                        value={addressForm.line2}
                        onChange={(e) => setAddressForm((x) => ({ ...x, line2: e.target.value }))}
                        className={inputClass}
                        autoComplete="address-line2"
                      />
                    </label>
                    <label className={labelClass}>
                      City*
                      <input
                        value={addressForm.city}
                        onChange={(e) => setAddressForm((x) => ({ ...x, city: e.target.value }))}
                        className={inputClass}
                        autoComplete="address-level2"
                      />
                    </label>
                    <label className={labelClass}>
                      State*
                      <input
                        value={addressForm.state}
                        onChange={(e) => setAddressForm((x) => ({ ...x, state: e.target.value }))}
                        className={inputClass}
                        autoComplete="address-level1"
                      />
                    </label>
                    <label className={labelClass}>
                      ZIP / Postal*
                      <input
                        value={addressForm.postalCode}
                        onChange={(e) => setAddressForm((x) => ({ ...x, postalCode: e.target.value }))}
                        className={inputClass}
                        autoComplete="postal-code"
                      />
                    </label>
                    <label className="mt-6 flex items-center gap-2 text-sm text-white/75">
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm((x) => ({ ...x, isDefault: e.target.checked }))}
                        className="h-4 w-4 accent-[#FF8B64]"
                      />
                      Set as default
                    </label>
                    <div className="flex gap-2 sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => void addAddress()}
                        disabled={addingAddress}
                        className="rounded-xl bg-[#FF8B64] px-5 py-2.5 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] disabled:opacity-60 transition"
                      >
                        {addingAddress ? "Saving…" : "Save address"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="rounded-xl px-4 py-2.5 text-sm text-white/60 hover:text-white transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <aside className="rounded-3xl border border-white/10 bg-[#141417]/90 p-4 sm:p-6 lg:sticky lg:top-28">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-lg font-bold">Your order</h2>
                  <Link href="/cart" className="text-xs text-white/50 hover:text-white transition">
                    Edit cart
                  </Link>
                </div>

                <ul className="mt-4 space-y-3">
                  {cartPreview.map((item) => (
                    <li key={item.key} className="flex items-center gap-3">
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                        {item.image.startsWith("data:") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Image src={item.image} alt="" fill className="object-cover" sizes="56px" />
                        )}
                        <span className="absolute -right-0 -top-0 flex h-5 min-w-5 items-center justify-center rounded-bl-lg bg-[#FF8B64] px-1 text-[10px] font-bold text-[#0D0D0D]">
                          {item.quantity}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-sm font-medium">{item.name}</span>
                        {item.customizationSummary && (
                          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-white/55">
                            {item.colour && (
                              <span
                                className="h-2.5 w-2.5 rounded-full border border-white/30"
                                style={{ backgroundColor: item.colour }}
                                aria-hidden="true"
                              />
                            )}
                            <span className="truncate">{item.customizationSummary}</span>
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(item.lineTotalUSD)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 border-t border-white/10 pt-4">
                  <label htmlFor="promo" className={labelClass}>
                    Promo code
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      id="promo"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void applyPromo();
                      }}
                      placeholder="Enter code"
                      className="min-w-0 flex-1 rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm uppercase text-white placeholder:normal-case placeholder:text-white/30 outline-none focus:border-[#FF8B64]/60"
                    />
                    <button
                      type="button"
                      onClick={() => void applyPromo()}
                      disabled={promoChecking}
                      className="rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-semibold hover:bg-white/10 transition disabled:opacity-60"
                    >
                      {promoChecking ? "Checking…" : "Apply"}
                    </button>
                  </div>
                  {promoError && <p className="mt-2 text-xs text-red-300">{promoError}</p>}
                  {promoInfo && <p className="mt-2 text-xs text-emerald-300">{promoInfo}</p>}
                </div>

                <dl className="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-sm">
                  <div className="flex justify-between text-white/65">
                    <dt>Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</dt>
                    <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-emerald-300">
                      <dt>Discount</dt>
                      <dd className="tabular-nums">−{formatMoney(promoDiscount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-white/65">
                    <dt>Delivery (Lebanon)</dt>
                    <dd className="tabular-nums">{shipping > 0 ? formatMoney(shipping) : "Free"}</dd>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3 text-white">
                    <dt className="font-semibold">Total</dt>
                    <dd className="text-xl font-extrabold tabular-nums">{formatMoney(total)}</dd>
                  </div>
                </dl>

                {error && (
                  <p role="alert" className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
                    {error}
                  </p>
                )}

                {placeButton("mt-5 hidden w-full lg:flex")}
              </aside>
            </section>

            {/* Mobile place-order bar */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0D0D0D]/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-md lg:hidden">
              <div className="mx-auto flex max-w-[1200px] items-center gap-4">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wider text-white/45">Total</div>
                  <div className="text-lg font-extrabold tabular-nums">{formatMoney(total)}</div>
                </div>
                {placeButton("ml-auto flex-1")}
              </div>
            </div>
          </>
        )}

        <Footer />
      </main>
    </div>
  );
}
