"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";
import { products } from "../data/products";

type StoredCartItem = {
  productId: string;
  quantity: number;
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
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  minSubtotal?: number;
  maxDiscount?: number;
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
  const { isLoaded, isSignedIn } = useUser();

  const [cart, setCart] = useState<StoredCartItem[]>(() => readCart());
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [successOrderNumber, setSuccessOrderNumber] = useState("");

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

  async function loadAddresses() {
    const res = await fetch("/api/addresses");
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
    async function loadPromos() {
      const res = await fetch("/api/promocodes", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as {
        promos?: Array<{
          code?: string;
          type?: PromoRule["type"];
          value?: number;
          minSubtotal?: number;
          maxDiscount?: number;
        }>;
      };
      if (!alive) return;
      if (res.ok && Array.isArray(data.promos)) {
        const next: Record<string, PromoRule> = {};
        for (const promo of data.promos) {
          const code = typeof promo.code === "string" ? promo.code.toUpperCase() : "";
          if (!code) continue;
          const type =
            promo.type === "fixed" || promo.type === "free_shipping"
              ? promo.type
              : "percent";
          next[code] = {
            type,
            value: typeof promo.value === "number" ? Math.max(0, promo.value) : 0,
            minSubtotal:
              typeof promo.minSubtotal === "number"
                ? Math.max(0, promo.minSubtotal)
                : 0,
            maxDiscount:
              typeof promo.maxDiscount === "number"
                ? Math.max(0, promo.maxDiscount)
                : 0,
          };
        }
        setPromoRules(next);
      }
    }
    void loadPromos();
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
  }, [cart]);

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
    setSuccessOrderNumber("");

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
      const res = await fetch("/api/orders", {
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
        order?: { id?: string; orderNumber?: string };
      };
      if (!res.ok) {
        setError(data.error || "Could not place order.");
        return;
      }

      setSuccessOrderNumber(data.order?.orderNumber || data.order?.id || "Order placed");
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
      const res = await fetch("/api/addresses", {
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

  function applyPromo() {
    setPromoError("");
    setPromoInfo("");

    const result = computePromoDiscount(subtotal, subtotal > 0 ? 5 : 0, promoInput, promoRules);
    if (!promoInput.trim()) {
      setAppliedPromoCode("");
      setPromoInfo("Promo code removed.");
      return;
    }

    if (result.error) {
      setAppliedPromoCode("");
      setPromoError(result.error);
      return;
    }

    setAppliedPromoCode(result.normalized);
    setPromoInfo(`Promo ${result.normalized} applied.`);
  }

  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <SignedOut>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-10 text-center">
            <h1 className="text-3xl font-semibold text-white">Checkout</h1>
            <p className="mt-2 text-white/70">Sign in to continue your checkout.</p>
            <div className="mt-6 flex justify-center">
              <SignInButton mode="modal">
                <button className="rounded-xl bg-[#FF8B64] px-5 py-2.5 font-medium text-black hover:opacity-90 transition">
                  Sign in
                </button>
              </SignInButton>
            </div>
          </section>
        </SignedOut>

        <SignedIn>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <h1 className="text-3xl font-semibold text-white">Checkout</h1>
            <p className="mt-2 text-white/70">Confirm address and place your order.</p>
          </section>

          <section className="mt-5 grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <h2 className="text-xl font-semibold text-white">Shipping Address</h2>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowAddressForm((v) => !v)}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10 transition"
                >
                  {showAddressForm ? "Cancel new address" : "Add another address"}
                </button>
              </div>

              {showAddressForm && (
                <div className="mt-3 grid gap-3 rounded-xl border border-white/10 bg-black/20 p-3 sm:grid-cols-2">
                  <label className="text-sm text-white/80">
                    Label
                    <input
                      value={addressForm.label}
                      onChange={(e) => setAddressForm((x) => ({ ...x, label: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                      placeholder="Home, Work..."
                    />
                  </label>
                  <label className="text-sm text-white/80">
                    Full name*
                    <input
                      value={addressForm.fullName}
                      onChange={(e) => setAddressForm((x) => ({ ...x, fullName: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                    />
                  </label>
                  <label className="text-sm text-white/80">
                    Phone*
                    <input
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm((x) => ({ ...x, phone: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                    />
                  </label>
                  <label className="text-sm text-white/80">
                    Country*
                    <input
                      value={addressForm.country}
                      onChange={(e) => setAddressForm((x) => ({ ...x, country: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                    />
                  </label>
                  <label className="text-sm text-white/80 sm:col-span-2">
                    Address line 1*
                    <input
                      value={addressForm.line1}
                      onChange={(e) => setAddressForm((x) => ({ ...x, line1: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                    />
                  </label>
                  <label className="text-sm text-white/80 sm:col-span-2">
                    Address line 2
                    <input
                      value={addressForm.line2}
                      onChange={(e) => setAddressForm((x) => ({ ...x, line2: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                    />
                  </label>
                  <label className="text-sm text-white/80">
                    City*
                    <input
                      value={addressForm.city}
                      onChange={(e) => setAddressForm((x) => ({ ...x, city: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                    />
                  </label>
                  <label className="text-sm text-white/80">
                    State*
                    <input
                      value={addressForm.state}
                      onChange={(e) => setAddressForm((x) => ({ ...x, state: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                    />
                  </label>
                  <label className="text-sm text-white/80">
                    ZIP / Postal*
                    <input
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm((x) => ({ ...x, postalCode: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                    />
                  </label>
                  <label className="text-sm text-white/80 flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm((x) => ({ ...x, isDefault: e.target.checked }))}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#FF8B64]"
                    />
                    Set as default
                  </label>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => void addAddress()}
                      disabled={addingAddress}
                      className="rounded-xl bg-[#FF8B64] px-4 py-2 font-medium text-black hover:opacity-90 disabled:opacity-60 transition"
                    >
                      {addingAddress ? "Saving..." : "Save address"}
                    </button>
                  </div>
                </div>
              )}

              {loadingAddresses ? (
                <p className="mt-3 text-white/70">Loading addresses...</p>
              ) : addresses.length === 0 ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-4 text-white/75">
                  No saved address found.
                  <Link href="/user" className="ml-2 text-[#FF8B64] hover:opacity-80">
                    Add one in My Account
                  </Link>
                  .
                </div>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => setAddressId(addr.id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        addressId === addr.id
                          ? "border-[#FF8B64]/60 bg-[#FF8B64]/10"
                          : "border-white/10 bg-black/20 hover:bg-black/30"
                      }`}
                    >
                      <div className="text-white font-medium">
                        {addr.label || "Address"}
                      </div>
                      <div className="mt-1 text-sm text-white/85">{addr.fullName}</div>
                      <div className="text-sm text-white/70">{addr.phone}</div>
                      <div className="mt-1 text-sm text-white/70">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ""}
                      </div>
                      <div className="text-sm text-white/70">
                        {addr.city}, {addr.state} {addr.postalCode}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
              {successOrderNumber && (
                <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-emerald-100">
                  Order placed successfully: <span className="font-semibold">{successOrderNumber}</span>
                </div>
              )}
            </div>

            <aside className="lg:col-span-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <h2 className="text-xl font-semibold text-white">Summary</h2>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-sm text-white/75">Promo code</div>
                <div className="mt-2 flex gap-2">
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Enter code"
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#FF8B64]"
                  />
                  <button
                    type="button"
                    onClick={applyPromo}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition"
                  >
                    Apply
                  </button>
                </div>
                {promoError && <p className="mt-2 text-xs text-red-300">{promoError}</p>}
                {promoInfo && <p className="mt-2 text-xs text-emerald-300">{promoInfo}</p>}
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between text-white/75">
                  <span>Items</span>
                  <span>{itemCount}</span>
                </div>
                <div className="flex items-center justify-between text-white/75">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-white/75">
                  <span>Discount</span>
                  <span>-{formatMoney(promoDiscount)}</span>
                </div>
                <div className="flex items-center justify-between text-white/75">
                  <span>Shipping (Lebanon)</span>
                  <span>{formatMoney(shipping)}</span>
                </div>
                <div className="h-px bg-white/10 my-2" />
                <div className="flex items-center justify-between text-white">
                  <span className="font-medium">Total</span>
                  <span className="text-lg font-semibold">{formatMoney(total)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void placeOrder()}
                disabled={placing || cart.length === 0}
                className="mt-5 w-full rounded-xl bg-[#FF8B64] px-5 py-2.5 font-medium text-black hover:opacity-90 disabled:opacity-60 transition"
              >
                {placing ? "Placing order..." : "Place order"}
              </button>

              <Link
                href="/cart"
                className="mt-2 block w-full rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-center text-white/90 hover:bg-white/10 transition"
              >
                Back to cart
              </Link>
            </aside>
          </section>
        </SignedIn>

        <Footer />
      </main>
    </div>
  );
}
