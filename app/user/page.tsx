"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  Camera,
  ChevronRight,
  Heart,
  Loader2,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Plus,
  Printer,
  Sparkles,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";
import AuthModal from "../components/AuthModal";
import ProductCard from "../components/ProductCard";
import TemphomeCustomRequestCta from "../components/TemphomeCustomRequestCta";
import { OrderStatusBadge } from "../components/OrderStatus";
import type { Product } from "../data/products";
import { getProductPath } from "../lib/product-url";
import AvatarCropper from "../components/AvatarCropper";
import { openInvoiceWindow } from "@/app/lib/invoiceWindow";
import { authFetch, useSupabaseAuth } from "@/app/lib/supabase/auth-client";

function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
}

function getProductImage(p: Product) {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (p.image) return p.image;
  return "/products/placeholder.jpg";
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
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

type UserOrderRecord = {
  id: string;
  orderNumber?: string;
  status: string;
  createdAt: string;
  totalUSD: number;
  items: Array<{ productId: string; name: string; quantity: number; lineTotalUSD: number }>;
  invoice?: { invoiceNumber?: string };
};

type AccountTab = "overview" | "orders" | "saved" | "addresses" | "profile";

const TABS: Array<{ key: AccountTab; label: string; icon: typeof Package }> = [
  { key: "overview", label: "Overview", icon: UserRound },
  { key: "orders", label: "Orders", icon: Package },
  { key: "saved", label: "Saved", icon: Heart },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "profile", label: "Profile", icon: Pencil },
];

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

async function readIds(path: string): Promise<string[] | null> {
  const res = await authFetch(path, { method: "GET" });
  if (!res.ok) return null;
  const data = (await res.json()) as { ids?: string[] };
  return Array.isArray(data.ids) ? data.ids.map(String) : [];
}

const card = "rounded-3xl border border-white/10 bg-[#141417]/90 p-4 sm:p-6";
const inputClass =
  "mt-1.5 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#FF8B64]/60";
const labelClass = "text-xs font-semibold uppercase tracking-wider text-white/50";
const primaryButton =
  "rounded-xl bg-[#FF8B64] px-5 py-2.5 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] disabled:opacity-60 transition";
const ghostButton =
  "rounded-lg border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition";

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.05] ${className}`} />;
}

function AccountPanel() {
  const { user, isLoaded, signOut, refreshUser } = useSupabaseAuth();

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const primaryEmail = user?.email ?? "";

  const [tab, setTab] = useState<AccountTab>("overview");

  const [products, setProducts] = useState<Product[]>([]);
  const [likes, setLikes] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [savedTab, setSavedTab] = useState<"likes" | "wishlist">("likes");

  // Profile form (loaded from /api/profile)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [orders, setOrders] = useState<UserOrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [addressForm, setAddressForm] = useState<AddressFormState>(EMPTY_ADDRESS_FORM);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [addressSuccess, setAddressSuccess] = useState("");
  const [addressSaving, setAddressSaving] = useState(false);

  // Load profile from API
  useEffect(() => {
    if (!isLoaded || !user) return;
    let alive = true;

    async function load() {
      setLoadingProfile(true);
      const res = await authFetch("/api/profile", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as {
        profile?: { firstName?: string; lastName?: string; username?: string; avatarUrl?: string };
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
    return () => {
      alive = false;
    };
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
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !user) return;
    let alive = true;

    async function loadSaved() {
      setLoadingSaved(true);
      const [likesIds, wishlistIds] = await Promise.all([readIds("/api/likes"), readIds("/api/wishlist")]);
      if (!alive) return;
      setLikes(likesIds ?? []);
      setWishlist(wishlistIds ?? []);
      setLoadingSaved(false);
    }

    void loadSaved();
    return () => {
      alive = false;
    };
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
    return () => {
      alive = false;
    };
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
    return () => {
      alive = false;
    };
  }, [isLoaded, user]);

  const greetingName = useMemo(() => {
    if (firstName.trim()) return firstName.trim();
    if (username.trim()) return username.trim();
    return primaryEmail.split("@")[0]?.trim() || "there";
  }, [username, firstName, primaryEmail]);

  const productById = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(String(p.id), p);
    return m;
  }, [products]);

  const savedProducts = useMemo(
    () => (savedTab === "likes" ? likes : wishlist).map((id) => productById.get(id)).filter(Boolean) as Product[],
    [savedTab, likes, wishlist, productById]
  );

  const currentAddress = useMemo(() => addresses.find((x) => x.isDefault) ?? addresses[0] ?? null, [addresses]);
  const latestOrder = orders[0] ?? null;

  /** Save the profile; the navbar and menus refresh to show the new name/photo. */
  async function persistProfile(nextAvatarUrl: string, message: string) {
    setError("");
    setSuccess("");
    const res = await authFetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        avatarUrl: nextAvatarUrl.trim(),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not save changes. Please try again.");
      return false;
    }
    await refreshUser().catch(() => {});
    setSuccess(message);
    return true;
  }

  async function onSaveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      await persistProfile(avatarUrl, "Profile updated.");
    } catch {
      setError("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function choosePhoto(file: File) {
    setError("");
    setSuccess("");
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    setCropFile(file);
  }

  /** Upload the cropped, compressed photo and save it to the profile. */
  async function uploadPhoto(blob: Blob) {
    setCropFile(null);
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.set("file", new File([blob], blob.type === "image/webp" ? "avatar.webp" : "avatar.jpg", { type: blob.type }));
      if (avatarUrl) fd.set("previous", avatarUrl);
      const res = await authFetch("/api/profile/avatar", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || "Couldn't upload that photo.");
        return;
      }
      setAvatarUrl(data.url);
      await persistProfile(data.url, "Photo updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't upload that photo.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function removePhoto() {
    setUploadingPhoto(true);
    try {
      if (await persistProfile("", "Photo removed.")) setAvatarUrl("");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function resetAddressForm() {
    setAddressForm(EMPTY_ADDRESS_FORM);
    setEditingAddressId(null);
    setShowAddressForm(false);
    setAddressError("");
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
    setShowAddressForm(true);
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

      if (!res.ok) {
        setAddressError(data.error || "Could not save address.");
        return;
      }

      const saved = data.address;
      if (saved) {
        setAddresses((prev) => {
          if (editingAddressId) {
            return prev.map((x) => (x.id === saved.id ? saved : saved.isDefault ? { ...x, isDefault: false } : x));
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

  if (!isLoaded || !user) return null;

  const displayAvatar = avatarUrl || (typeof meta.avatar_url === "string" ? meta.avatar_url : "");
  const fullName = [firstName, lastName].filter((x) => x.trim()).join(" ");

  const addressLines = (a: SavedAddress) => (
    <>
      <div className="font-semibold text-white">{a.fullName}</div>
      <div className="text-white/55">{a.phone}</div>
      <div className="mt-1">
        {a.line1}
        {a.line2 ? `, ${a.line2}` : ""}
      </div>
      <div>{[a.city, a.state, a.postalCode].filter(Boolean).join(", ")}</div>
      {a.country && <div>{a.country}</div>}
    </>
  );

  const orderCard = (order: UserOrderRecord) => {
    const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
    return (
      <div key={order.id} className="rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20">
        <Link href={`/orders/${encodeURIComponent(order.id)}`} className="block p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold">{order.orderNumber || order.id}</p>
              <p className="mt-0.5 text-xs text-white/50">
                {formatDate(order.createdAt)} · {count} {count === 1 ? "item" : "items"}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-2 line-clamp-1 text-sm text-white/65">
            {order.items.map((item) => item.name).join(", ")}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="font-extrabold text-[#FF8B64] tabular-nums">{formatMoney(order.totalUSD)}</span>
            <span className="flex items-center gap-1 text-sm font-semibold text-white/65">
              Track <ChevronRight size={15} aria-hidden="true" />
            </span>
          </div>
        </Link>
        <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-2">
          <span className="text-xs text-white/45">Invoice {order.invoice?.invoiceNumber || "pending"}</span>
          <button
            type="button"
            onClick={() => openInvoiceWindow(`/invoice/${encodeURIComponent(order.id)}`)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-white/65 hover:bg-white/[0.06] hover:text-white transition"
          >
            <Printer size={13} aria-hidden="true" /> Print
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#FF8B64]/15 text-2xl font-bold text-[#FF8B64]">
          {displayAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            greetingName.charAt(0).toUpperCase()
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl sm:text-3xl font-extrabold tracking-tight">Hi, {greetingName}</h1>
          <p className="truncate text-sm text-white/50">
            {primaryEmail}
            {user.created_at ? ` · Member since ${formatDate(user.created_at)}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
        >
          <LogOut size={15} aria-hidden="true" /> Sign out
        </button>
      </header>

      {/* Tabs */}
      <nav
        className="mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Account sections"
      >
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-current={tab === key ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === key ? "bg-[#FF8B64] text-[#0D0D0D]" : "text-white/65 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <Icon size={15} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-5">
        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Orders", value: orders.length, loading: loadingOrders, go: "orders" as const, icon: Package },
                { label: "Liked", value: likes.length, loading: loadingSaved, go: "saved" as const, icon: Heart },
                { label: "Saved", value: wishlist.length, loading: loadingSaved, go: "saved" as const, icon: Bookmark },
              ].map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setTab(s.go);
                    if (s.label === "Liked") setSavedTab("likes");
                    if (s.label === "Saved") setSavedTab("wishlist");
                  }}
                  className="rounded-2xl border border-white/10 bg-[#141417]/90 p-4 text-left transition hover:border-white/25"
                >
                  <s.icon size={16} className="text-[#FF8B64]" aria-hidden="true" />
                  <div className="mt-2 text-2xl font-extrabold tabular-nums">{s.loading ? "–" : s.value}</div>
                  <div className="text-xs text-white/50">{s.label}</div>
                </button>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className={card}>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold">Latest order</h2>
                  {orders.length > 0 && (
                    <button type="button" onClick={() => setTab("orders")} className="text-xs font-semibold text-[#FF8B64] hover:text-[#ffa282]">
                      All orders
                    </button>
                  )}
                </div>
                <div className="mt-4">
                  {loadingOrders ? (
                    <Pulse className="h-32" />
                  ) : latestOrder ? (
                    orderCard(latestOrder)
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/15 p-5 text-center">
                      <p className="text-sm text-white/55">No orders yet.</p>
                      <Link href="/shop" className="mt-3 inline-flex text-sm font-semibold text-[#FF8B64] hover:text-[#ffa282]">
                        Browse the shop →
                      </Link>
                    </div>
                  )}
                </div>
              </section>

              <section className={card}>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold">Delivery address</h2>
                  <button type="button" onClick={() => setTab("addresses")} className="text-xs font-semibold text-[#FF8B64] hover:text-[#ffa282]">
                    {addresses.length ? "Manage" : "Add"}
                  </button>
                </div>
                <div className="mt-4 text-sm leading-relaxed text-white/70">
                  {loadingAddresses ? (
                    <Pulse className="h-28" />
                  ) : currentAddress ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">{addressLines(currentAddress)}</div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/15 p-5 text-center text-white/55">
                      Add an address for faster checkout.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <section className="flex flex-col items-start gap-4 rounded-3xl border border-[#FF8B64]/25 bg-[#FF8B64]/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Sparkles size={20} className="mt-0.5 shrink-0 text-[#FF8B64]" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Want something made?</p>
                  <p className="text-sm text-white/60">Send a photo, sketch or idea and get a quote.</p>
                </div>
              </div>
              <TemphomeCustomRequestCta
                buttonLabel="Get a Quote"
                className="w-full shrink-0 rounded-xl bg-[#FF8B64] px-6 py-2.5 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition sm:w-auto"
              />
            </section>
          </div>
        )}

        {/* Orders */}
        {tab === "orders" && (
          <section className={card}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Your orders</h2>
              <Link href="/orders" className="text-xs font-semibold text-[#FF8B64] hover:text-[#ffa282]">
                Open full page
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {loadingOrders ? (
                <>
                  <Pulse className="h-36" />
                  <Pulse className="h-36" />
                </>
              ) : orders.length > 0 ? (
                orders.slice(0, 8).map(orderCard)
              ) : (
                <div className="col-span-full rounded-2xl border border-dashed border-white/15 p-6 text-center">
                  <p className="text-sm text-white/55">When you place an order, it&rsquo;ll show up here.</p>
                  <Link href="/shop" className="mt-3 inline-flex text-sm font-semibold text-[#FF8B64] hover:text-[#ffa282]">
                    Browse the shop →
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Saved */}
        {tab === "saved" && (
          <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Saved products</h2>
              <div className="flex rounded-xl border border-white/10 bg-black/20 p-1 text-sm" role="tablist">
                {(
                  [
                    ["likes", `Liked (${likes.length})`],
                    ["wishlist", `Saved (${wishlist.length})`],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={savedTab === key}
                    onClick={() => setSavedTab(key)}
                    className={`rounded-lg px-3.5 py-1.5 font-semibold transition ${
                      savedTab === key ? "bg-white/12 text-white" : "text-white/55 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              {loadingSaved ? (
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
                  {[0, 1, 2, 3].map((i) => (
                    <Pulse key={i} className="aspect-[3/4]" />
                  ))}
                </div>
              ) : savedProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
                  {savedProducts.map((p) => (
                    <ProductCard
                      key={`${savedTab}-${p.id}`}
                      productId={String(p.id)}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      item={{
                        href: getProductPath(p),
                        title: p.name,
                        price: `$${p.priceUSD}`,
                        image: getProductImage(p),
                        hoverImage: Array.isArray(p.images) ? p.images[1] : undefined,
                        isNew: p.isNew === true,
                        hasVariants: !!p.variants?.length,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center">
                  <p className="text-sm text-white/55">
                    {savedTab === "likes" ? "Tap the ♥ on any product to like it." : "Nothing saved yet."}
                  </p>
                  <Link href="/shop" className="mt-3 inline-flex text-sm font-semibold text-[#FF8B64] hover:text-[#ffa282]">
                    Browse the shop →
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Addresses */}
        {tab === "addresses" && (
          <section className={card}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Delivery addresses</h2>
              {!showAddressForm && (
                <button
                  type="button"
                  onClick={() => {
                    setAddressForm(EMPTY_ADDRESS_FORM);
                    setEditingAddressId(null);
                    setShowAddressForm(true);
                    setAddressSuccess("");
                  }}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#FF8B64] hover:text-[#ffa282]"
                >
                  <Plus size={15} aria-hidden="true" /> Add address
                </button>
              )}
            </div>

            {addressError && <p className="mt-3 text-sm text-red-300">{addressError}</p>}
            {addressSuccess && <p className="mt-3 text-sm text-emerald-300">{addressSuccess}</p>}

            {showAddressForm && (
              <form onSubmit={saveAddress} className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-2">
                <p className="text-sm font-semibold sm:col-span-2">{editingAddressId ? "Edit address" : "New address"}</p>
                {[
                  { field: "label" as const, label: "Label", placeholder: "Home, Work…", required: false, span: "", auto: "off" },
                  { field: "fullName" as const, label: "Full name*", placeholder: "", required: true, span: "", auto: "name" },
                  { field: "phone" as const, label: "Phone*", placeholder: "", required: true, span: "", auto: "tel" },
                  { field: "country" as const, label: "Country*", placeholder: "", required: true, span: "", auto: "country-name" },
                  { field: "line1" as const, label: "Address line 1*", placeholder: "Street, building", required: true, span: "sm:col-span-2", auto: "address-line1" },
                  { field: "line2" as const, label: "Address line 2", placeholder: "Floor, apartment (optional)", required: false, span: "sm:col-span-2", auto: "address-line2" },
                  { field: "city" as const, label: "City*", placeholder: "", required: true, span: "", auto: "address-level2" },
                  { field: "state" as const, label: "State / Province*", placeholder: "", required: true, span: "", auto: "address-level1" },
                  { field: "postalCode" as const, label: "ZIP / Postal code*", placeholder: "", required: true, span: "", auto: "postal-code" },
                ].map(({ field, label, placeholder, required, span, auto }) => (
                  <label key={field} className={`${labelClass} ${span}`}>
                    {label}
                    <input
                      value={addressForm[field]}
                      onChange={(e) => setAddressForm((curr) => ({ ...curr, [field]: e.target.value }))}
                      className={inputClass}
                      placeholder={placeholder}
                      required={required}
                      autoComplete={auto}
                    />
                  </label>
                ))}
                <label className="mt-6 flex items-center gap-2 text-sm text-white/75">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm((curr) => ({ ...curr, isDefault: e.target.checked }))}
                    className="h-4 w-4 accent-[#FF8B64]"
                  />
                  Set as default
                </label>
                <div className="flex gap-2 sm:col-span-2">
                  <button type="submit" disabled={addressSaving} className={primaryButton}>
                    {addressSaving ? "Saving…" : editingAddressId ? "Update address" : "Save address"}
                  </button>
                  <button type="button" onClick={resetAddressForm} className="rounded-xl px-4 py-2.5 text-sm text-white/60 hover:text-white transition">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {loadingAddresses ? (
                <>
                  <Pulse className="h-40" />
                  <Pulse className="h-40" />
                </>
              ) : addresses.length > 0 ? (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`rounded-2xl border p-4 text-sm leading-relaxed text-white/70 ${
                      addr.isDefault ? "border-[#FF8B64]/40 bg-[#FF8B64]/[0.05]" : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white">{addr.label || "Address"}</span>
                      {addr.isDefault && (
                        <span className="flex items-center gap-1 rounded-full bg-[#FF8B64]/15 px-2 py-0.5 text-[11px] font-semibold text-[#FFB59B]">
                          <Star size={11} aria-hidden="true" /> Default
                        </span>
                      )}
                    </div>
                    {addressLines(addr)}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => onStartEditAddress(addr)} className={ghostButton}>
                        Edit
                      </button>
                      {!addr.isDefault && (
                        <button type="button" onClick={() => void setDefaultAddress(addr.id)} className={ghostButton}>
                          Set default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void deleteAddress(addr.id)}
                        aria-label={`Delete ${addr.label || "address"}`}
                        className="ml-auto inline-flex items-center rounded-lg px-2 py-1.5 text-white/40 hover:bg-red-500/10 hover:text-red-300 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                !showAddressForm && (
                  <div className="col-span-full rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-white/55">
                    No addresses yet. Add one for faster checkout.
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* Profile */}
        {tab === "profile" && (
          <form onSubmit={onSaveProfile} className={`${card} max-w-2xl`}>
            <h2 className="text-lg font-bold">Profile</h2>
            <p className="mt-0.5 text-sm text-white/50">How your name appears on your account and orders.</p>

            {cropFile && (
              <AvatarCropper file={cropFile} onCancel={() => setCropFile(null)} onConfirm={(blob) => void uploadPhoto(blob)} />
            )}

            {!loadingProfile && (
              <div className="mt-5 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#FF8B64]/15 text-2xl font-bold text-[#FF8B64]">
                  {displayAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayAvatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    greetingName.charAt(0).toUpperCase()
                  )}
                  {uploadingPhoto && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <Loader2 size={22} className="animate-spin text-white" aria-hidden="true" />
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Profile photo</p>
                  <p className="text-xs text-white/45">Choose a photo, then crop it. It&rsquo;s compressed before upload.</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) choosePhoto(file);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploadingPhoto}
                      onClick={() => photoInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-xl bg-[#FF8B64] px-4 py-2 text-xs font-bold text-[#0D0D0D] hover:bg-[#ffa282] disabled:opacity-60 transition"
                    >
                      <Camera size={14} aria-hidden="true" /> {displayAvatar ? "Change photo" : "Upload photo"}
                    </button>
                    {displayAvatar && (
                      <button
                        type="button"
                        disabled={uploadingPhoto}
                        onClick={() => void removePhoto()}
                        className="rounded-xl px-3 py-2 text-xs text-white/55 hover:text-white disabled:opacity-60 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {loadingProfile ? (
              <div className="mt-5 space-y-3">
                <Pulse className="h-12" />
                <Pulse className="h-12" />
                <Pulse className="h-12" />
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className={labelClass}>
                    First name
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} autoComplete="given-name" />
                  </label>
                  <label className={labelClass}>
                    Last name
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} autoComplete="family-name" />
                  </label>
                  <label className={labelClass}>
                    Username
                    <input value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} autoComplete="username" />
                  </label>
                  <label className={labelClass}>
                    Email
                    <input value={primaryEmail} readOnly className={`${inputClass} cursor-not-allowed text-white/50`} />
                  </label>
                </div>

                {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
                {success && <p className="mt-4 text-sm text-emerald-300">{success}</p>}

                <div className="mt-5 flex items-center gap-3">
                  <button type="submit" disabled={saving} className={primaryButton}>
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  {fullName && <span className="text-xs text-white/40">Shown as {fullName}</span>}
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default function UserPage() {
  const { isLoaded, isSignedIn } = useSupabaseAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="relative min-h-screen text-white">
      <Background />
      <Navbar />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <main className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16">
        {!isLoaded ? (
          <div className="mx-auto max-w-[1100px] space-y-5" aria-busy="true">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 animate-pulse rounded-full bg-white/[0.06]" />
              <div className="space-y-2">
                <div className="h-7 w-48 animate-pulse rounded-xl bg-white/[0.06]" />
                <div className="h-4 w-64 animate-pulse rounded-xl bg-white/[0.05]" />
              </div>
            </div>
            <div className="h-12 animate-pulse rounded-2xl bg-white/[0.04]" />
            <div className="h-64 animate-pulse rounded-3xl bg-white/[0.04]" />
          </div>
        ) : !isSignedIn ? (
          <section className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-[#141417]/90 p-6 text-center sm:p-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FF8B64]/12 text-[#FF8B64]">
              <UserRound size={24} aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Your account</h1>
            <p className="mt-2 text-sm text-white/60">Sign in to track orders, save products and manage addresses.</p>
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="mt-6 w-full rounded-2xl bg-[#FF8B64] px-5 py-3 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition"
            >
              Sign in or create account
            </button>
            <Link href="/shop" className="mt-3 inline-block text-sm text-white/55 hover:text-white transition">
              Back to shop
            </Link>
          </section>
        ) : (
          <AccountPanel />
        )}

        <Footer />
      </main>
    </div>
  );
}
