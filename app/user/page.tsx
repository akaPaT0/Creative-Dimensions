"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bookmark, Heart } from "lucide-react";
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
  const [wishlistApiPath, setWishlistApiPath] = useState("/api/wishlist");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
        <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Saved Products</h2>
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
          </div>

          {loadingSaved ? (
            <p className="mt-4 text-white/70">Loading saved products...</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(savedTab === "wishlist" ? wishlistProducts : likedProducts).map(
                (p) => (
                  <div
                    key={`${savedTab}-${p.id}`}
                    className="rounded-xl border border-white/10 bg-black/20 p-3"
                  >
                    <div className="flex gap-3">
                      <Link
                        href={getProductHref(p)}
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5"
                      >
                        <Image
                          src={getProductImage(p)}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={getProductHref(p)}
                          className="line-clamp-1 text-white font-medium hover:opacity-85 transition"
                        >
                          {p.name}
                        </Link>
                        <div className="mt-1 text-sm text-white/65">
                          {labelCategory(p.category)}
                        </div>
                        <div className="mt-1 text-sm text-white/90">
                          {formatPrice(p)}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateSaved("likes", p.id)}
                            aria-label={likes.includes(p.id) ? "Unlike" : "Like"}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-xs text-white/85 hover:bg-white/10 transition sm:h-auto sm:w-auto sm:px-2.5 sm:py-1"
                          >
                            <Heart size={14} className="sm:hidden" />
                            <span className="hidden sm:inline">
                              {likes.includes(p.id) ? "Unlike" : "Like"}
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
                              {wishlist.includes(p.id)
                                ? "Remove wishlist"
                                : "Add wishlist"}
                            </span>
                          </button>
                        </div>
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
        </div>

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
