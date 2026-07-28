"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, Heart } from "lucide-react";
import AuthModal from "./AuthModal";
import { authFetch, useSupabaseAuth } from "@/app/lib/supabase/auth-client";

type Props = {
  productId: string;
  className?: string;
};

async function readIds(path: string): Promise<Set<string>> {
  const res = await authFetch(path, { method: "GET" });
  if (!res.ok) return new Set();
  const data = (await res.json()) as { ids?: string[] };
  return new Set((data.ids ?? []).map(String));
}

export default function LikeWishlistRow({ productId, className = "" }: Props) {
  const { isLoaded, isSignedIn } = useSupabaseAuth();
  const [liked, setLiked] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const id = useMemo(() => String(productId), [productId]);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!isLoaded) return;

      if (!isSignedIn) {
        setLoading(false);
        setLiked(false);
        setWishlisted(false);
        return;
      }

      setLoading(true);
      const [likesSet, wishlistSet] = await Promise.all([
        readIds("/api/likes"),
        readIds("/api/wishlist"),
      ]);

      if (!alive) return;
      setLiked(likesSet.has(id));
      setWishlisted(wishlistSet.has(id));
      setLoading(false);
    }

    void load();
    return () => {
      alive = false;
    };
  }, [id, isLoaded, isSignedIn]);

  async function toggle(
    kind: "likes" | "wishlist",
    current: boolean,
    set: (value: boolean) => void
  ) {
    if (!isSignedIn) {
      setAuthOpen(true);
      return;
    }
    if (loading) return;

    set(!current);
    const res = await authFetch(`/api/${kind}`, {
      method: current ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id }),
    });

    if (!res.ok) set(current);
  }

  const btnBase =
    "h-10 w-10 rounded-xl border border-white/15 bg-white/5 text-white/85 hover:bg-white/10 hover:border-white/25 transition inline-flex items-center justify-center";

  return (
    <div className={`w-full flex items-center justify-end gap-2 ${className}`}>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <button
        type="button"
        className={`${btnBase} ${liked ? "border-white/30 bg-white/10 text-white" : ""}`}
        onClick={() => toggle("likes", liked, setLiked)}
        aria-pressed={isSignedIn ? liked : undefined}
        aria-label={isSignedIn ? (liked ? "Remove like" : "Like") : "Sign in to like"}
      >
        <Heart
          size={18}
          fill={liked ? "currentColor" : "none"}
          strokeWidth={liked ? 2.2 : 2}
        />
      </button>

      <button
        type="button"
        className={`${btnBase} ${
          wishlisted ? "border-white/30 bg-white/10 text-white" : ""
        }`}
        onClick={() => toggle("wishlist", wishlisted, setWishlisted)}
        aria-pressed={isSignedIn ? wishlisted : undefined}
        aria-label={
          isSignedIn
            ? wishlisted
              ? "Remove from wishlist"
              : "Add to wishlist"
            : "Sign in to wishlist"
        }
      >
        <Bookmark
          size={18}
          fill={wishlisted ? "currentColor" : "none"}
          strokeWidth={wishlisted ? 2.2 : 2}
        />
      </button>
    </div>
  );
}
