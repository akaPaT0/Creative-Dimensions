"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, ChevronDown, ChevronUp, Heart, Printer } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";
import AuthModal from "../components/AuthModal";
import type { Product } from "../data/products";
import { openInvoiceWindow } from "@/app/lib/invoiceWindow";
import { authFetch, useSupabaseAuth } from "@/app/lib/supabase/auth-client";

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function getProductImage(p: Product) {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (p.image) return p.image;
  return "/products/placeholder.jpg";
}

function getProductHref(p: Product) {
  return `/shop/${p.category}/${p.slug}`;
}

function labelCategory(raw: string) {
  return raw
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
}

function formatPrice(p: Product) {
  return `$${p.priceUSD}`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

type SavedAddress = {
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
  createdAt: string;
  updatedAt: string;
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

type SavedDisplayItem = {
  id: string;
  href: string;
  image: string;
};

type UserOrderRecord = {
  id: string;
  orderNumber?: string;
  status: string;
  createdAt: string;
  totalUSD: number;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPriceUSD?: number;
    lineTotalUSD: number;
  }>;
  invoice?: {
    invoiceNumber?: string;
    issuedAt?: string;
    paymentStatus?: string;
  };
  trackingHistory?: Array<{
    status?: string;
    at?: string;
  }>;
};

type AccountTab =
  | "saved"
  | "snapshot"
  | "account"
  | "details"
  | "orders"
  | "addresses"
  | "recommended";

const EMPTY_ADDRESS_FORM: AddressFormState = {
  label: "",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
  isDefault: false,
};

async function readIds(path: string): Promise<string[] | null> {
  const res = await authFetch(path, { method: "GET" });
  if (!res.ok) return null;
  const data = (await res.json()) as { ids?: string[] };
  return Array.isArray(data.ids) ? data.ids.map(String) : [];
}

function AccountPanel() {
  const { user, isLoaded } = useSupabaseAuth();

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const primaryEmail = user?.email ?? "N/A";

  const [products, setProducts] = useState<Product[]>([]);
  const [likes, setLikes] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [savedTab, setSavedTab] = useState<"wishlist" | "likes">("wishlist");
  const [savedMinimized, setSavedMinimized] = useState(false);

  // Profile form (loaded from /api/profile)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [orders, setOrders] = useState<UserOrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [addressForm, setAddressForm] = useState<AddressFormState>(EMPTY_ADDRESS_FORM);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressError, setAddressError] = useState("");
  const [addressSuccess, setAddressSuccess] = useState("");
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressesMinimized, setAddressesMinimized] = useState(true);
  const [accountTab, setAccountTab] = useState<AccountTab>("account");
  const [showFloatingSavedToggle, setShowFloatingSavedToggle] = useState(false);
  const savedSectionRef = useRef<HTMLElement | null>(null);

  // Load profile from API
  useEffect(() => {
    if (!isLoaded || !user) return;
    let alive = true;

    async function load() {
      setLoadingProfile(true);
      const res = await authFetch("/api/profile", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as {
        profile?: {
          firstName?: string;
          lastName?: string;
          username?: string;
          avatarUrl?: string;
        };
      };
      if (!alive) return;
      const p = data.profile;
      setFirstName(p?.firstName ?? (typeof meta.first_name === "string" ? meta.first_name : ""));
      setLastName(p?.lastName ?? (typeof meta.last_name === "string" ? meta.last_name : ""));
      setUsername(p?.username ?? (typeof meta.username === "string" ? meta.username : ""));
      setAvatarUrl(p?.avatarUrl ?? (typeof meta.avatar_url === "string" ? meta.avatar_url : ""));
      setLoadingProfile(false);
    }

    void load();
    return () => { alive = false; };
  }, [isLoaded, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let alive = true;
    async function loadProducts() {
      const res = await fetch("/api/products", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { products?: Product[] };
      if (!alive) return;
      if (res.ok && Array.isArray(data.products)) setProducts(data.products);
    }
    void loadProducts();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!isLoaded || !user) return;
    let alive = true;

    async function loadSaved() {
      setLoadingSaved(true);
      const [likesIds, wishlistIds] = await Promise.all([
        readIds("/api/likes"),
        readIds("/api/wishlist"),
      ]);
      if (!alive) return;
      setLikes(likesIds ?? []);
      setWishlist(wishlistIds ?? []);
      setLoadingSaved(false);
    }

    void loadSaved();
    return () => { alive = false; };
  }, [isLoaded, user]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    let alive = true;

    async function loadOrders() {
      setLoadingOrders(true);
      try {
        const res = await authFetch("/api/orders", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as { orders?: UserOrderRecord[] };
        if (!alive) return;
        setOrders(res.ok && Array.isArray(data.orders) ? data.orders : []);
      } finally {
        if (alive) setLoadingOrders(false);
      }
    }

    void loadOrders();
    return () => { alive = false; };
  }, [isLoaded, user]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    let alive = true;

    async function loadAddresses() {
      setLoadingAddresses(true);
      try {
        const res = await authFetch("/api/addresses", { method: "GET" });
        const data = (await res.json().catch(() => ({}))) as { addresses?: SavedAddress[] };
        if (!alive) return;
        setAddresses(res.ok && Array.isArray(data.addresses) ? data.addresses : []);
      } finally {
        if (alive) setLoadingAddresses(false);
      }
    }

    void loadAddresses();
    return () => { alive = false; };
  }, [isLoaded, user]);

  useEffect(() => {
    function updateVisibility() {
      const section = savedSectionRef.current;
      if (!section) { setShowFloatingSavedToggle(false); return; }
      const rect = section.getBoundingClientRect();
      setShowFloatingSavedToggle(rect.top < window.innerHeight && rect.bottom > 0);
    }
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, []);

  const accountGreetingName = useMemo(() => {
    if (username.trim()) return username.trim();
    if (firstName.trim()) return firstName.trim();
    const handle = primaryEmail.split("@")[0]?.trim();
    return handle || "there";
  }, [username, firstName, primaryEmail]);

  const productById = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(String(p.id), p);
    return m;
  }, [products]);

  const likedSavedItems = useMemo<SavedDisplayItem[]>(
    () => likes.map((id) => {
      const p = productById.get(id);
      return { id, href: p ? getProductHref(p) : "/shop", image: p ? getProductImage(p) : "/products/placeholder.jpg" };
    }),
    [likes, productById]
  );

  const wishlistSavedItems = useMemo<SavedDisplayItem[]>(
    () => wishlist.map((id) => {
      const p = productById.get(id);
      return { id, href: p ? getProductHref(p) : "/shop", image: p ? getProductImage(p) : "/products/placeholder.jpg" };
    }),
    [wishlist, productById]
  );

  const likedProducts = useMemo(
    () => likes.map((id) => productById.get(id)).filter(Boolean) as Product[],
    [likes, productById]
  );

  const wishlistProducts = useMemo(
    () => wishlist.map((id) => productById.get(id)).filter(Boolean) as Product[],
    [wishlist, productById]
  );

  const allSavedSet = useMemo(() => new Set<string>([...likes, ...wishlist]), [likes, wishlist]);
  const recommended = useMemo(() => products.filter((p) => !allSavedSet.has(p.id)).slice(0, 6), [allSavedSet, products]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of [...wishlistProducts, ...likedProducts]) {
      counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [likedProducts, wishlistProducts]);

  const currentAddress = useMemo(
    () => addresses.find((x) => x.isDefault) ?? addresses[0] ?? null,
    [addresses]
  );

  const { signOut } = useSupabaseAuth();

  async function onSaveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await authFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), username: username.trim(), avatarUrl: avatarUrl.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not save changes. Please try again.");
        return;
      }
      setSuccess("Profile updated.");
    } catch {
      setError("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function updateSaved(kind: "likes" | "wishlist", productId: string) {
    const isLikes = kind === "likes";
    const current = isLikes ? likes : wishlist;
    const has = current.includes(productId);
    const next = has ? current.filter((id) => id !== productId) : [...current, productId];
    if (isLikes) setLikes(next); else setWishlist(next);

    const res = await authFetch(`/api/${kind}`, {
      method: has ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (!res.ok) {
      if (isLikes) setLikes(current); else setWishlist(current);
    }
  }

  function resetAddressForm() {
    setAddressForm(EMPTY_ADDRESS_FORM);
    setEditingAddressId(null);
    setAddressError("");
    setAddressSuccess("");
  }

  function onStartEditAddress(address: SavedAddress) {
    setAddressForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setEditingAddressId(address.id);
    setAddressError("");
    setAddressSuccess("");
  }

  async function saveAddress(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddressSaving(true);
    setAddressError("");
    setAddressSuccess("");

    const payload = { ...addressForm, id: editingAddressId ?? undefined };

    try {
      const res = await authFetch("/api/addresses", {
        method: editingAddressId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; address?: SavedAddress };

      if (!res.ok) { setAddressError(data.error || "Could not save address."); return; }

      const saved = data.address;
      if (saved) {
        setAddresses((prev) => {
          if (editingAddressId) {
            return prev.map((x) =>
              x.id === saved.id ? saved : saved.isDefault ? { ...x, isDefault: false } : x
            );
          }
          const next = saved.isDefault ? prev.map((x) => ({ ...x, isDefault: false })) : prev;
          return [...next, saved];
        });
      }

      setAddressSuccess(editingAddressId ? "Address updated." : "Address added.");
      resetAddressForm();
    } catch {
      setAddressError("Could not save address.");
    } finally {
      setAddressSaving(false);
    }
  }

  async function deleteAddress(id: string) {
    setAddressError("");
    setAddressSuccess("");
    const prev = addresses;
    setAddresses((curr) => curr.filter((x) => x.id !== id));
    try {
      const res = await authFetch("/api/addresses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        setAddresses(prev);
        setAddressError("Could not delete address.");
        return;
      }
      if (editingAddressId === id) resetAddressForm();
      setAddressSuccess("Address removed.");
    } catch {
      setAddresses(prev);
      setAddressError("Could not delete address.");
    }
  }

  async function setDefaultAddress(id: string) {
    const current = addresses.find((x) => x.id === id);
    if (!current) return;
    setAddressError("");
    setAddressSuccess("");
    const prev = addresses;
    setAddresses((curr) => curr.map((x) => ({ ...x, isDefault: x.id === id })));

    try {
      const res = await authFetch("/api/addresses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...current, isDefault: true }),
      });
      if (!res.ok) {
        setAddresses(prev);
        setAddressError("Could not set default address.");
        return;
      }
      setAddressSuccess("Default address updated.");
    } catch {
      setAddresses(prev);
      setAddressError("Could not set default address.");
    }
  }

  if (!isLoaded) {
    return (
      <section className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
        Loading account...
      </section>
    );
  }

  if (!user) return null;

  const displayAvatar = avatarUrl || (typeof meta.avatar_url === "string" ? meta.avatar_url : "");

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      {/* Welcome header */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <h1 className="text-[1.65rem] sm:text-3xl font-semibold text-white leading-tight">
          <span className="block">Welcome</span>
          <span className="mt-1 block break-words">{accountGreetingName}</span>
        </h1>
        <p className="mt-2 text-white/70">
          Your personal dashboard for saved items, addresses, and account settings.
        </p>
      </div>

      {/* Mobile tab bar */}
      <div className="lg:hidden rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex gap-2 overflow-x-auto">
          {(
            [
              ["saved", "Saved"],
              ["snapshot", "Snapshot"],
              ["account", "Account"],
              ["details", "Details"],
              ["orders", "Orders"],
              ["addresses", "Addresses"],
              ["recommended", "Recommended"],
            ] as Array<[AccountTab, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setAccountTab(key)}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm transition ${
                accountTab === key
                  ? "border-[#FF8B64] bg-[#FF8B64] text-black"
                  : "border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* ── Saved Products ── */}
        <section
          ref={savedSectionRef}
          className={`${accountTab === "saved" ? "block" : "hidden"} lg:col-span-8 lg:block rounded-2xl border border-white/10 bg-white/5 p-5`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Saved Products</h2>
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-white/15 bg-black/20 p-1 text-sm">
                <button
                  type="button"
                  onClick={() => setSavedTab("wishlist")}
                  className={`rounded-lg px-3 py-1.5 transition ${savedTab === "wishlist" ? "bg-white/15 text-white" : "text-white/70 hover:text-white"}`}
                >
                  Wishlist ({wishlist.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSavedTab("likes")}
                  className={`rounded-lg px-3 py-1.5 transition ${savedTab === "likes" ? "bg-white/15 text-white" : "text-white/70 hover:text-white"}`}
                >
                  Likes ({likes.length})
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSavedMinimized((v) => !v)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/85 hover:bg-white/10 transition"
              >
                {savedMinimized ? "Expand" : "Minimize"}
              </button>
            </div>
          </div>

          {savedMinimized ? (
            <p className="mt-4 text-sm text-white/65">
              Section minimized. {wishlist.length + likes.length} saved item(s).
            </p>
          ) : loadingSaved ? (
            <p className="mt-4 text-white/70">Loading saved products...</p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {(savedTab === "wishlist" ? wishlistSavedItems : likedSavedItems).map((item) => (
                <div key={`${savedTab}-${item.id}`} className="rounded-xl border border-white/10 bg-black/20 p-2">
                  <Link
                    href={item.href}
                    className="relative block aspect-square w-full overflow-hidden rounded-lg border border-white/10 bg-white/5"
                  >
                    <Image
                      src={item.image}
                      alt={`${savedTab} item`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 34vw, 25vw"
                    />
                  </Link>
                  <div className="mt-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateSaved("likes", item.id)}
                      aria-label={likes.includes(item.id) ? "Unlike" : "Like"}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/85 hover:bg-white/10 transition"
                    >
                      <Heart size={14} fill={likes.includes(item.id) ? "currentColor" : "none"} />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSaved("wishlist", item.id)}
                      aria-label={wishlist.includes(item.id) ? "Remove from wishlist" : "Add to wishlist"}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/85 hover:bg-white/10 transition"
                    >
                      <Bookmark size={14} fill={wishlist.includes(item.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              ))}
              {(savedTab === "wishlist" ? wishlistSavedItems : likedSavedItems).length === 0 && (
                <div className="col-span-full rounded-xl border border-white/10 bg-black/20 p-4 text-white/70">
                  No items here yet. Browse the shop and start saving products.
                </div>
              )}
            </div>
          )}
        </section>

        {/* Floating minimize/expand toggle */}
        {showFloatingSavedToggle && (accountTab === "saved") && (
          <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
            <button
              type="button"
              onClick={() => setSavedMinimized((v) => !v)}
              aria-label={savedMinimized ? "Expand saved products" : "Minimize saved products"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#0D0D0D]/80 text-white/90 backdrop-blur-md hover:bg-[#0D0D0D] transition"
            >
              {savedMinimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        )}

        {/* ── Shop Snapshot ── */}
        <div className={`${accountTab === "snapshot" ? "block" : "hidden"} lg:col-span-4 lg:block rounded-2xl border border-white/10 bg-white/5 p-5`}>
          <h2 className="text-xl font-semibold text-white">Shop Snapshot</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs text-white/60">Wishlist</div>
              <div className="mt-1 text-2xl font-semibold text-white">{wishlist.length}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs text-white/60">Likes</div>
              <div className="mt-1 text-2xl font-semibold text-white">{likes.length}</div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-sm text-white/70">Top categories</div>
            <div className="mt-2 space-y-2 text-sm">
              {categoryCounts.length > 0 ? (
                categoryCounts.map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between text-white/90">
                    <span>{labelCategory(cat)}</span>
                    <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs">{count}</span>
                  </div>
                ))
              ) : (
                <div className="text-white/60">No saved category data yet.</div>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            <Link href="/orders" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition">Track orders</Link>
            <Link href="/cart" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition">View cart</Link>
            <Link href="/shop" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition">Continue shopping</Link>
            <Link href="/shop/new-arrivals" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition">Explore new arrivals</Link>
            <Link href="/contact" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition">Contact support</Link>
          </div>
        </div>

        {/* ── Account Card ── */}
        <div className={`${accountTab === "account" ? "block" : "hidden"} lg:col-span-4 lg:block rounded-2xl border border-white/10 bg-white/5 p-5`}>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-white/15 bg-white/5 flex items-center justify-center">
              {displayAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayAvatar} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl text-white/30 font-semibold">
                  {(firstName || primaryEmail)[0]?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-white">
                {firstName && lastName ? `${firstName} ${lastName}` : firstName || username || "Account"}
              </div>
              <div className="truncate text-sm text-white/70">{primaryEmail}</div>
            </div>
          </div>

          <div className="mt-5 space-y-2 text-sm">
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <span className="text-white/60">Joined:</span>{" "}
              <span className="text-white/90">{formatDate(user.created_at)}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <span className="text-white/60">Last sign in:</span>{" "}
              <span className="text-white/90">{formatDate(user.last_sign_in_at)}</span>
            </div>
          </div>

          <div className="mt-5 grid gap-2">
            <Link href="/orders" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-left text-white/90 hover:bg-white/10 transition">Track orders</Link>
            <Link href="/cart" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-left text-white/90 hover:bg-white/10 transition">Cart</Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-left text-white/80 hover:bg-white/10 transition"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* ── Profile Details ── */}
        <form
          onSubmit={onSaveProfile}
          className={`${accountTab === "details" ? "block" : "hidden"} lg:col-span-8 lg:block rounded-2xl border border-white/10 bg-white/5 p-5`}
        >
          <h2 className="text-xl font-semibold text-white">Profile Details</h2>
          <p className="mt-1 text-sm text-white/65">Update your name, username, and avatar.</p>

          {loadingProfile ? (
            <p className="mt-4 text-white/60">Loading profile...</p>
          ) : (
            <>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-white/80">
                  First name
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                    placeholder="First name"
                  />
                </label>
                <label className="text-sm text-white/80">
                  Last name
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                    placeholder="Last name"
                  />
                </label>
              </div>

              <label className="mt-4 block text-sm text-white/80">
                Username
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                  placeholder="Username"
                />
              </label>

              <label className="mt-4 block text-sm text-white/80">
                Avatar URL
                <input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                  placeholder="https://..."
                />
              </label>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
                <span className="text-white/60">Email:</span>{" "}
                <span className="text-white/90">{primaryEmail}</span>
              </div>

              {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
              {success && <p className="mt-4 text-sm text-emerald-300">{success}</p>}

              <button
                type="submit"
                disabled={saving}
                className="mt-5 rounded-xl bg-[#FF8B64] px-5 py-2.5 font-medium text-black hover:opacity-90 disabled:opacity-60 transition"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </>
          )}
        </form>

        {/* ── Orders ── */}
        <section className={`${accountTab === "orders" ? "block" : "hidden"} lg:col-span-12 lg:block rounded-2xl border border-white/10 bg-white/5 p-5`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Order Tracking</h2>
              <p className="mt-1 text-sm text-white/65">See order progress and open invoice details.</p>
            </div>
            <Link href="/orders" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition">
              View all orders
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {loadingOrders ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-white/70">Loading orders...</div>
            ) : orders.length > 0 ? (
              orders.slice(0, 6).map((order) => (
                <article key={order.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-white">{order.orderNumber || order.id}</div>
                      <div className="text-xs text-white/60">{formatDate(order.createdAt)}</div>
                    </div>
                    <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs text-white/85 capitalize">{order.status}</span>
                  </div>
                  <div className="mt-2 text-xs text-white/75">
                    <span>Invoice: {order.invoice?.invoiceNumber || "Pending"}</span>
                    <button
                      type="button"
                      aria-label="Print invoice"
                      onClick={() => openInvoiceWindow(`/invoice/${encodeURIComponent(order.id)}`)}
                      className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 transition"
                    >
                      <Printer size={12} />
                    </button>
                    <span className="ml-2">| Total: {formatMoney(order.totalUSD)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/orders/${order.id}`} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 transition">Track order</Link>
                    <Link href={`/orders/${order.id}`} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 transition">View invoice</Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-white/70">No orders yet.</div>
            )}
          </div>
        </section>

        {/* ── Addresses ── */}
        <section className={`${accountTab === "addresses" ? "block" : "hidden"} lg:col-span-12 lg:block rounded-2xl border border-white/10 bg-white/5 p-5`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Saved Addresses</h2>
              <p className="mt-1 text-sm text-white/65">Add multiple shipping addresses and choose a default for faster checkout.</p>
            </div>
            <div className="flex items-center gap-2">
              {!addressesMinimized && editingAddressId && (
                <button type="button" onClick={resetAddressForm} className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10 transition">Cancel edit</button>
              )}
              <button
                type="button"
                onClick={() => setAddressesMinimized((v) => !v)}
                className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10 transition"
              >
                {addressesMinimized ? (<>Expand <ChevronDown size={14} /></>) : (<>Collapse <ChevronUp size={14} /></>)}
              </button>
            </div>
          </div>

          {addressesMinimized ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/60">Current shipping address</p>
              {loadingAddresses ? (
                <p className="mt-2 text-sm text-white/75">Loading current address...</p>
              ) : currentAddress ? (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{currentAddress.label || "Address"}</p>
                    {currentAddress.isDefault && (
                      <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">Default</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-white/90">{currentAddress.fullName}</p>
                  <p className="text-sm text-white/75">{currentAddress.phone}</p>
                  <p className="mt-1 text-sm text-white/80">{currentAddress.line1}{currentAddress.line2 ? `, ${currentAddress.line2}` : ""}</p>
                  <p className="text-sm text-white/80">{currentAddress.city}, {currentAddress.state} {currentAddress.postalCode}</p>
                  <p className="text-sm text-white/80">{currentAddress.country}</p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-white/75">No address saved yet. Expand to add one.</p>
              )}
            </div>
          ) : (
            <>
              <form onSubmit={saveAddress} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { field: "label" as const, label: "Label", placeholder: "Home, Work...", required: false, span: "" },
                  { field: "fullName" as const, label: "Full name*", placeholder: "Receiver full name", required: true, span: "" },
                  { field: "phone" as const, label: "Phone*", placeholder: "+1...", required: true, span: "" },
                  { field: "line1" as const, label: "Address line 1*", placeholder: "Street and number", required: true, span: "sm:col-span-2 lg:col-span-3" },
                  { field: "line2" as const, label: "Address line 2", placeholder: "Apartment, suite, building (optional)", required: false, span: "sm:col-span-2 lg:col-span-3" },
                  { field: "city" as const, label: "City*", placeholder: "", required: true, span: "" },
                  { field: "state" as const, label: "State / Province*", placeholder: "", required: true, span: "" },
                  { field: "postalCode" as const, label: "ZIP / Postal code*", placeholder: "", required: true, span: "" },
                  { field: "country" as const, label: "Country*", placeholder: "US", required: true, span: "" },
                ].map(({ field, label, placeholder, required, span }) => (
                  <label key={field} className={`text-sm text-white/80 ${span}`}>
                    {label}
                    <input
                      value={addressForm[field]}
                      onChange={(e) => setAddressForm((curr) => ({ ...curr, [field]: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                      placeholder={placeholder}
                      required={required}
                    />
                  </label>
                ))}

                <label className="text-sm text-white/80 flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm((curr) => ({ ...curr, isDefault: e.target.checked }))}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#FF8B64]"
                  />
                  Set as default shipping address
                </label>

                <div className="sm:col-span-2 lg:col-span-3">
                  <button
                    type="submit"
                    disabled={addressSaving}
                    className="rounded-xl bg-[#FF8B64] px-5 py-2.5 font-medium text-black hover:opacity-90 disabled:opacity-60 transition"
                  >
                    {addressSaving ? "Saving..." : editingAddressId ? "Update address" : "Add address"}
                  </button>
                </div>
              </form>

              {addressError && <p className="mt-4 text-sm text-red-300">{addressError}</p>}
              {addressSuccess && <p className="mt-4 text-sm text-emerald-300">{addressSuccess}</p>}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {loadingAddresses ? (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-white/70">Loading addresses...</div>
                ) : addresses.length > 0 ? (
                  addresses.map((addr) => (
                    <div key={addr.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{addr.label || "Address"}</p>
                        {addr.isDefault && (
                          <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">Default</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-white/90">{addr.fullName}</p>
                      <p className="text-sm text-white/75">{addr.phone}</p>
                      <p className="mt-2 text-sm text-white/80">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                      <p className="text-sm text-white/80">{addr.city}, {addr.state} {addr.postalCode}</p>
                      <p className="text-sm text-white/80">{addr.country}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => onStartEditAddress(addr)} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 transition">Edit</button>
                        {!addr.isDefault && (
                          <button type="button" onClick={() => void setDefaultAddress(addr.id)} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 transition">Set default</button>
                        )}
                        <button type="button" onClick={() => void deleteAddress(addr.id)} className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-100 hover:bg-red-500/20 transition">Delete</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-white/70">No saved addresses yet.</div>
                )}
              </div>
            </>
          )}
        </section>

        {/* ── Recommended ── */}
        <div className={`${accountTab === "recommended" ? "block" : "hidden"} lg:col-span-12 lg:block rounded-2xl border border-white/10 bg-white/5 p-5`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Recommended For You</h2>
            <Link href="/shop" className="text-sm text-white/75 hover:text-white transition">View all</Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((p) => (
              <div key={`rec-${p.id}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <Link href={getProductHref(p)} className="relative block aspect-[4/3] w-full overflow-hidden rounded-lg border border-white/10 bg-white/5">
                  <Image src={getProductImage(p)} alt={p.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                </Link>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={getProductHref(p)} className="line-clamp-1 text-sm font-medium text-white hover:opacity-85 transition">{p.name}</Link>
                    <div className="mt-1 text-xs text-white/60">{labelCategory(p.category)}</div>
                  </div>
                  <div className="text-sm text-white/90">{formatPrice(p)}</div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => updateSaved("likes", p.id)} aria-label={likes.includes(p.id) ? "Unlike" : "Like"} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-xs text-white/85 hover:bg-white/10 transition sm:h-auto sm:w-auto sm:px-2.5 sm:py-1">
                    <Heart size={14} className="sm:hidden" fill={likes.includes(p.id) ? "currentColor" : "none"} />
                    <span className="hidden sm:inline">{likes.includes(p.id) ? "Liked" : "Like"}</span>
                  </button>
                  <button type="button" onClick={() => updateSaved("wishlist", p.id)} aria-label={wishlist.includes(p.id) ? "Remove from wishlist" : "Add to wishlist"} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-xs text-white/85 hover:bg-white/10 transition sm:h-auto sm:w-auto sm:px-2.5 sm:py-1">
                    <Bookmark size={14} className="sm:hidden" fill={wishlist.includes(p.id) ? "currentColor" : "none"} />
                    <span className="hidden sm:inline">{wishlist.includes(p.id) ? "Saved" : "Save"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function UserPage() {
  const { isLoaded, isSignedIn } = useSupabaseAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {!isLoaded ? (
          <section className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            Loading...
          </section>
        ) : !isSignedIn ? (
          <section className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-10 text-center">
            <h1 className="text-3xl font-semibold text-white">My Account</h1>
            <p className="mt-3 text-white/70">Sign in to view and manage your account.</p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="w-full sm:w-auto rounded-xl bg-[#FF8B64] px-5 py-2.5 font-medium text-black hover:opacity-90 transition"
              >
                Sign in
              </button>
              <Link href="/shop" className="w-full sm:w-auto rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-white/90 hover:bg-white/10 transition">
                Back to shop
              </Link>
            </div>
          </section>
        ) : (
          <AccountPanel />
        )}

        <Footer />
      </main>
    </div>
  );
}
