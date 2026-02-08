"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, ChevronDown, ChevronUp, Heart } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useClerk,
  useUser,
} from "@clerk/nextjs";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";
import { products, type Product } from "../data/products";

function formatDate(value?: Date | null) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getErrorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "errors" in error) {
    const maybeErrors = (error as { errors?: Array<{ longMessage?: string }> })
      .errors;
    if (Array.isArray(maybeErrors) && maybeErrors[0]?.longMessage) {
      return maybeErrors[0].longMessage;
    }
  }
  return "Could not save changes. Please try again.";
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
  const res = await fetch(path, { method: "GET" });
  if (!res.ok) return null;
  const data = (await res.json()) as { ids?: string[] };
  return Array.isArray(data.ids) ? data.ids.map(String) : [];
}

function AccountPanel() {
  const { user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();

  const [likes, setLikes] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [savedTab, setSavedTab] = useState<"wishlist" | "likes">("wishlist");
  const [savedMinimized, setSavedMinimized] = useState(false);
  const [wishlistApiPath, setWishlistApiPath] = useState("/api/wishlist");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressForm, setAddressForm] = useState<AddressFormState>(
    EMPTY_ADDRESS_FORM
  );
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressError, setAddressError] = useState("");
  const [addressSuccess, setAddressSuccess] = useState("");
  const [addressSaving, setAddressSaving] = useState(false);
  const [showFloatingSavedToggle, setShowFloatingSavedToggle] = useState(false);
  const savedSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setUsername(user.username ?? "");
  }, [user]);

  useEffect(() => {
    let alive = true;

    async function loadSaved() {
      if (!isLoaded || !user) return;
      setLoadingSaved(true);

      const likesIds = await readIds("/api/likes");

      const wishlistPrimary = await readIds("/api/wishlist");
      if (wishlistPrimary !== null) {
        if (!alive) return;
        setWishlistApiPath("/api/wishlist");
        setWishlist(wishlistPrimary);
      } else {
        const wishlistLegacy = await readIds("/api/whishlist");
        if (!alive) return;
        setWishlistApiPath("/api/whishlist");
        setWishlist(wishlistLegacy ?? []);
      }

      if (!alive) return;
      setLikes(likesIds ?? []);
      setLoadingSaved(false);
    }

    loadSaved();
    return () => {
      alive = false;
    };
  }, [isLoaded, user]);

  useEffect(() => {
    function updateFloatingToggleVisibility() {
      const section = savedSectionRef.current;
      if (!section) {
        setShowFloatingSavedToggle(false);
        return;
      }

      const rect = section.getBoundingClientRect();
      const isOnScreen = rect.top < window.innerHeight && rect.bottom > 0;
      setShowFloatingSavedToggle(isOnScreen);
    }

    updateFloatingToggleVisibility();
    window.addEventListener("scroll", updateFloatingToggleVisibility, {
      passive: true,
    });
    window.addEventListener("resize", updateFloatingToggleVisibility);
    return () => {
      window.removeEventListener("scroll", updateFloatingToggleVisibility);
      window.removeEventListener("resize", updateFloatingToggleVisibility);
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadAddresses() {
      if (!isLoaded || !user) return;
      setLoadingAddresses(true);
      try {
        const res = await fetch("/api/addresses", { method: "GET" });
        const data = (await res.json().catch(() => ({}))) as {
          addresses?: SavedAddress[];
        };
        if (!alive) return;
        if (res.ok && Array.isArray(data.addresses)) {
          setAddresses(data.addresses);
        } else {
          setAddresses([]);
        }
      } finally {
        if (alive) setLoadingAddresses(false);
      }
    }

    void loadAddresses();
    return () => {
      alive = false;
    };
  }, [isLoaded, user]);

  const primaryEmail = useMemo(
    () =>
      user?.emailAddresses.find(
        (email) => email.id === user.primaryEmailAddressId
      )?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? "N/A",
    [user]
  );

  const productById = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(String(p.id), p);
    return m;
  }, []);

  const likedProducts = useMemo(
    () => likes.map((id) => productById.get(id)).filter(Boolean) as Product[],
    [likes, productById]
  );

  const wishlistProducts = useMemo(
    () => wishlist.map((id) => productById.get(id)).filter(Boolean) as Product[],
    [wishlist, productById]
  );

  const allSavedSet = useMemo(
    () => new Set<string>([...likes, ...wishlist]),
    [likes, wishlist]
  );

  const recommended = useMemo(
    () => products.filter((p) => !allSavedSet.has(p.id)).slice(0, 6),
    [allSavedSet]
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of [...wishlistProducts, ...likedProducts]) {
      counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [likedProducts, wishlistProducts]);

  async function onSaveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await user.update({
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        username: username.trim() || null,
      });
      await user.reload();
      setSuccess("Profile updated.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function updateSaved(kind: "likes" | "wishlist", productId: string) {
    const isLikes = kind === "likes";
    const current = isLikes ? likes : wishlist;
    const has = current.includes(productId);
    const endpoint = isLikes ? "/api/likes" : wishlistApiPath;

    const next = has
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    if (isLikes) setLikes(next);
    else setWishlist(next);

    const res = await fetch(endpoint, {
      method: has ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });

    if (!res.ok) {
      if (isLikes) setLikes(current);
      else setWishlist(current);
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

    const payload = {
      ...addressForm,
      id: editingAddressId ?? undefined,
    };

    try {
      const res = await fetch("/api/addresses", {
        method: editingAddressId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        address?: SavedAddress;
      };

      if (!res.ok) {
        setAddressError(data.error || "Could not save address.");
        return;
      }

      if (data.address) {
        setAddresses((prev) => {
          if (editingAddressId) {
            const next = prev.map((x) =>
              x.id === data.address?.id
                ? (data.address as SavedAddress)
                : data.address?.isDefault
                  ? { ...x, isDefault: false }
                  : x
            );
            return next;
          }
          const next = data.address.isDefault
            ? prev.map((x) => ({ ...x, isDefault: false }))
            : prev;
          return [...next, data.address];
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
      const res = await fetch("/api/addresses", {
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
    setAddresses((curr) =>
      curr.map((x) => ({ ...x, isDefault: x.id === id }))
    );

    try {
      const res = await fetch("/api/addresses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: current.id,
          label: current.label,
          fullName: current.fullName,
          phone: current.phone,
          line1: current.line1,
          line2: current.line2,
          city: current.city,
          state: current.state,
          postalCode: current.postalCode,
          country: current.country,
          isDefault: true,
        }),
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

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <h1 className="text-3xl font-semibold text-white">My Account</h1>
        <p className="mt-2 text-white/70">
          Shop dashboard with your saved items, quick actions, and account
          controls. Clerk runs auth and user data in the background.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <section
          ref={savedSectionRef}
          className="lg:col-span-8 rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">
              Saved Products
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-white/15 bg-black/20 p-1 text-sm">
                <button
                  type="button"
                  onClick={() => setSavedTab("wishlist")}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    savedTab === "wishlist"
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Wishlist ({wishlist.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSavedTab("likes")}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    savedTab === "likes"
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:text-white"
                  }`}
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
              {(savedTab === "wishlist" ? wishlistProducts : likedProducts).map(
                (p) => (
                  <div
                    key={`${savedTab}-${p.id}`}
                    className="rounded-xl border border-white/10 bg-black/20 p-2"
                  >
                    <div>
                      <Link
                        href={getProductHref(p)}
                        className="relative block aspect-square w-full overflow-hidden rounded-lg border border-white/10 bg-white/5"
                      >
                        <Image
                          src={getProductImage(p)}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 34vw, 25vw"
                        />
                      </Link>
                      <div className="mt-2 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateSaved("likes", p.id)}
                          aria-label={likes.includes(p.id) ? "Unlike" : "Like"}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/85 hover:bg-white/10 transition"
                        >
                          <Heart size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSaved("wishlist", p.id)}
                          aria-label={
                            wishlist.includes(p.id)
                              ? "Remove from wishlist"
                              : "Add to wishlist"
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/85 hover:bg-white/10 transition"
                        >
                          <Bookmark size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
              {(savedTab === "wishlist" ? wishlistProducts : likedProducts)
                .length === 0 && (
                <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-white/70">
                  No items here yet. Browse the shop and start saving products.
                </div>
              )}
            </div>
          )}

        </section>

        {showFloatingSavedToggle && (
          <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
            <button
              type="button"
              onClick={() => setSavedMinimized((v) => !v)}
              aria-label={
                savedMinimized ? "Expand saved products" : "Minimize saved products"
              }
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#0D0D0D]/80 text-white/90 backdrop-blur-md hover:bg-[#0D0D0D] transition"
            >
              {savedMinimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        )}

        <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold text-white">Shop Snapshot</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs text-white/60">Wishlist</div>
              <div className="mt-1 text-2xl font-semibold text-white">
                {wishlist.length}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs text-white/60">Likes</div>
              <div className="mt-1 text-2xl font-semibold text-white">
                {likes.length}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-sm text-white/70">Top categories</div>
            <div className="mt-2 space-y-2 text-sm">
              {categoryCounts.length > 0 ? (
                categoryCounts.map(([cat, count]) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between text-white/90"
                  >
                    <span>{labelCategory(cat)}</span>
                    <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs">
                      {count}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-white/60">No saved category data yet.</div>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            <Link
              href="/shop"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition"
            >
              Continue shopping
            </Link>
            <Link
              href="/shop/new-arrivals"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition"
            >
              Explore new arrivals
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition"
            >
              Contact support
            </Link>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-white/15 bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.imageUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-white">
                {user.fullName || user.username || "Account"}
              </div>
              <div className="truncate text-sm text-white/70">{primaryEmail}</div>
            </div>
          </div>

          <div className="mt-5 space-y-2 text-sm">
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <span className="text-white/60">Created:</span>{" "}
              <span className="text-white/90">{formatDate(user.createdAt)}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <span className="text-white/60">Last sign in:</span>{" "}
              <span className="text-white/90">
                {formatDate(user.lastSignInAt)}
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-2">
            <button
              type="button"
              onClick={() => openUserProfile()}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-left text-white/90 hover:bg-white/10 transition"
            >
              Advanced account settings
            </button>
            <button
              type="button"
              onClick={() => signOut({ redirectUrl: "/" })}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-left text-white/80 hover:bg-white/10 transition"
            >
              Sign out
            </button>
          </div>
        </div>

        <form
          onSubmit={onSaveProfile}
          className="lg:col-span-8 rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <h2 className="text-xl font-semibold text-white">Profile Details</h2>
          <p className="mt-1 text-sm text-white/65">
            This saves directly to your Clerk user record.
          </p>

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

          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-sm text-white/60">Email addresses</div>
            <div className="mt-2 space-y-2">
              {user.emailAddresses.map((email) => (
                <div
                  key={email.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                >
                  <span className="truncate text-white/90">{email.emailAddress}</span>
                  <span className="shrink-0 rounded-full border border-white/20 px-2 py-0.5 text-xs text-white/70">
                    {email.verification.status === "verified"
                      ? "Verified"
                      : "Pending"}
                  </span>
                </div>
              ))}
            </div>
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
        </form>

        <section className="lg:col-span-12 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Saved Addresses</h2>
              <p className="mt-1 text-sm text-white/65">
                Add multiple shipping addresses and choose a default for faster checkout.
              </p>
            </div>
            {editingAddressId && (
              <button
                type="button"
                onClick={resetAddressForm}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10 transition"
              >
                Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={saveAddress} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm text-white/80">
              Label
              <input
                value={addressForm.label}
                onChange={(e) =>
                  setAddressForm((curr) => ({ ...curr, label: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                placeholder="Home, Work..."
              />
            </label>
            <label className="text-sm text-white/80">
              Full name*
              <input
                value={addressForm.fullName}
                onChange={(e) =>
                  setAddressForm((curr) => ({ ...curr, fullName: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                placeholder="Receiver full name"
                required
              />
            </label>
            <label className="text-sm text-white/80">
              Phone*
              <input
                value={addressForm.phone}
                onChange={(e) =>
                  setAddressForm((curr) => ({ ...curr, phone: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                placeholder="+1..."
                required
              />
            </label>
            <label className="text-sm text-white/80 sm:col-span-2 lg:col-span-3">
              Address line 1*
              <input
                value={addressForm.line1}
                onChange={(e) =>
                  setAddressForm((curr) => ({ ...curr, line1: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                placeholder="Street and number"
                required
              />
            </label>
            <label className="text-sm text-white/80 sm:col-span-2 lg:col-span-3">
              Address line 2
              <input
                value={addressForm.line2}
                onChange={(e) =>
                  setAddressForm((curr) => ({ ...curr, line2: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                placeholder="Apartment, suite, building (optional)"
              />
            </label>
            <label className="text-sm text-white/80">
              City*
              <input
                value={addressForm.city}
                onChange={(e) =>
                  setAddressForm((curr) => ({ ...curr, city: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                required
              />
            </label>
            <label className="text-sm text-white/80">
              State / Province*
              <input
                value={addressForm.state}
                onChange={(e) =>
                  setAddressForm((curr) => ({ ...curr, state: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                required
              />
            </label>
            <label className="text-sm text-white/80">
              ZIP / Postal code*
              <input
                value={addressForm.postalCode}
                onChange={(e) =>
                  setAddressForm((curr) => ({ ...curr, postalCode: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                required
              />
            </label>
            <label className="text-sm text-white/80">
              Country*
              <input
                value={addressForm.country}
                onChange={(e) =>
                  setAddressForm((curr) => ({ ...curr, country: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FF8B64]"
                placeholder="US"
                required
              />
            </label>
            <label className="text-sm text-white/80 flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={addressForm.isDefault}
                onChange={(e) =>
                  setAddressForm((curr) => ({ ...curr, isDefault: e.target.checked }))
                }
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#FF8B64]"
              />
              Set as default shipping address
            </label>

            <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2">
              <button
                type="submit"
                disabled={addressSaving}
                className="rounded-xl bg-[#FF8B64] px-5 py-2.5 font-medium text-black hover:opacity-90 disabled:opacity-60 transition"
              >
                {addressSaving
                  ? "Saving..."
                  : editingAddressId
                    ? "Update address"
                    : "Add address"}
              </button>
            </div>
          </form>

          {addressError && <p className="mt-4 text-sm text-red-300">{addressError}</p>}
          {addressSuccess && (
            <p className="mt-4 text-sm text-emerald-300">{addressSuccess}</p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {loadingAddresses ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-white/70">
                Loading addresses...
              </div>
            ) : addresses.length > 0 ? (
              addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="rounded-xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">
                          {addr.label || "Address"}
                        </p>
                        {addr.isDefault && (
                          <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-white/90">{addr.fullName}</p>
                      <p className="text-sm text-white/75">{addr.phone}</p>
                      <p className="mt-2 text-sm text-white/80">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ""}
                      </p>
                      <p className="text-sm text-white/80">
                        {addr.city}, {addr.state} {addr.postalCode}
                      </p>
                      <p className="text-sm text-white/80">{addr.country}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onStartEditAddress(addr)}
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 transition"
                    >
                      Edit
                    </button>
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => void setDefaultAddress(addr.id)}
                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 transition"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void deleteAddress(addr.id)}
                      className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-100 hover:bg-red-500/20 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-white/70">
                No saved addresses yet.
              </div>
            )}
          </div>
        </section>

        <div className="lg:col-span-12 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">
              Recommended For You
            </h2>
            <Link
              href="/shop"
              className="text-sm text-white/75 hover:text-white transition"
            >
              View all
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((p) => (
              <div
                key={`rec-${p.id}`}
                className="rounded-xl border border-white/10 bg-black/20 p-3"
              >
                <Link
                  href={getProductHref(p)}
                  className="relative block aspect-[4/3] w-full overflow-hidden rounded-lg border border-white/10 bg-white/5"
                >
                  <Image
                    src={getProductImage(p)}
                    alt={p.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </Link>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={getProductHref(p)}
                      className="line-clamp-1 text-sm font-medium text-white hover:opacity-85 transition"
                    >
                      {p.name}
                    </Link>
                    <div className="mt-1 text-xs text-white/60">
                      {labelCategory(p.category)}
                    </div>
                  </div>
                  <div className="text-sm text-white/90">{formatPrice(p)}</div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateSaved("likes", p.id)}
                    aria-label={likes.includes(p.id) ? "Unlike" : "Like"}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-xs text-white/85 hover:bg-white/10 transition sm:h-auto sm:w-auto sm:px-2.5 sm:py-1"
                  >
                    <Heart size={14} className="sm:hidden" />
                    <span className="hidden sm:inline">
                      {likes.includes(p.id) ? "Liked" : "Like"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSaved("wishlist", p.id)}
                    aria-label={
                      wishlist.includes(p.id)
                        ? "Remove from wishlist"
                        : "Add to wishlist"
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-xs text-white/85 hover:bg-white/10 transition sm:h-auto sm:w-auto sm:px-2.5 sm:py-1"
                  >
                    <Bookmark size={14} className="sm:hidden" />
                    <span className="hidden sm:inline">
                      {wishlist.includes(p.id) ? "Saved" : "Save"}
                    </span>
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
  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <SignedOut>
          <section className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-10 text-center">
            <h1 className="text-3xl font-semibold text-white">My Account</h1>
            <p className="mt-3 text-white/70">
              Sign in to view and manage your account.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <SignInButton mode="modal">
                <button className="w-full sm:w-auto rounded-xl bg-[#FF8B64] px-5 py-2.5 font-medium text-black hover:opacity-90 transition">
                  Sign in
                </button>
              </SignInButton>

              <Link
                href="/shop"
                className="w-full sm:w-auto rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-white/90 hover:bg-white/10 transition"
              >
                Back to shop
              </Link>
            </div>
          </section>
        </SignedOut>

        <SignedIn>
          <AccountPanel />
        </SignedIn>

        <Footer />
      </main>
    </div>
  );
}
