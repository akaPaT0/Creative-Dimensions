"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, Bookmark } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";

type Props = {
  productId: string;
  className?: string;
};

async function readIds(path: string): Promise<Set<string>> {
  const res = await fetch(path, { method: "GET" });
  if (!res.ok) return new Set();
  const data = (await res.json()) as { ids?: string[] };
  return new Set((data.ids ?? []).map(String));
}

export default function LikeWishlistRow({ productId, className = "" }: Props) {
  const { isLoaded, isSignedIn } = useUser();

  const [liked, setLiked] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);

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

    load();
    return () => {
      alive = false;
    };
  }, [id, isLoaded, isSignedIn]);

  async function toggle(
    kind: "likes" | "wishlist",
    current: boolean,
    set: (v: boolean) => void
  ) {
    if (loading) return;

    set(!current); // optimistic

    const res = await fetch(`/api/${kind}`, {
      method: current ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id }),
    });

    if (!res.ok) set(current); // rollback
  }

  // slimmer + cleaner row
  const btnBase =
    "h-10 w-10 rounded-xl border border-white/15 bg-white/5 text-white/85 hover:bg-white/10 hover:border-white/25 transition inline-flex items-center justify-center";

  const activeLike = liked ? "border-white/30 bg-white/10 text-white" : "";
  const activeWish = wishlisted ? "border-white/30 bg-white/10 text-white" : "";

  return (
    <div className={`w-full flex items-center justify-end gap-2 ${className}`}>
      <SignedOut>
        <SignInButton mode="modal">
          <button className={btnBase} type="button" aria-label="Sign in to like">
            <Heart size={18} />
          </button>
        </SignInButton>

        <SignInButton mode="modal">
          <button className={btnBase} type="button" aria-label="Sign in to wishlist">
            <Bookmark size={18} />
          </button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <button
          type="button"
          className={`${btnBase} ${activeLike}`}
          onClick={() => toggle("likes", liked, setLiked)}
          aria-pressed={liked}
          aria-label={liked ? "Remove like" : "Like"}
        >
          <Heart
            size={18}
            fill={liked ? "currentColor" : "none"}
            strokeWidth={liked ? 2.2 : 2}
          />
        </button>

        <button
          type="button"
          className={`${btnBase} ${activeWish}`}
          onClick={() => toggle("wishlist", wishlisted, setWishlisted)}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Bookmark size={18} />
        </button>
      </SignedIn>
    </div>
  );
}
