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
    "flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white/85 hover:bg-white/10 hover:border-white/25 transition flex items-center justify-center gap-2";

  const activeLike = liked ? "border-white/30 bg-white/10 text-white" : "";
  const activeWish = wishlisted ? "border-white/30 bg-white/10 text-white" : "";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <SignedOut>
        <SignInButton mode="modal">
          <button className={btnBase} type="button">
            <Heart size={18} />
            Like
          </button>
        </SignInButton>

        <SignInButton mode="modal">
          <button className={btnBase} type="button">
            <Bookmark size={18} />
            Wishlist
          </button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <button
          type="button"
          className={`${btnBase} ${activeLike}`}
          onClick={() => toggle("likes", liked, setLiked)}
          aria-pressed={liked}
        >
          <Heart size={18} />
          Like
        </button>

        <button
          type="button"
          className={`${btnBase} ${activeWish}`}
          onClick={() => toggle("wishlist", wishlisted, setWishlisted)}
          aria-pressed={wishlisted}
        >
          <Bookmark size={18} />
          Wishlist
        </button>
      </SignedIn>
    </div>
  );
}
