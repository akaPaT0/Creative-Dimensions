"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";

type Props = {
  productId: string;
  className?: string;
  positionClass?: string;
};

export default function WishlistIconButton({
  productId,
  className = "",
  positionClass = "bottom-2 right-2",
}: Props) {
  const { isLoaded, isSignedIn } = useUser();
  const [wishlisted, setWishlisted] = useState(false);
  const [endpoint, setEndpoint] = useState("/api/wishlist");

  const id = useMemo(() => String(productId), [productId]);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!isLoaded) return;
      if (!isSignedIn) {
        setWishlisted(false);
        return;
      }

      const primary = await fetch("/api/wishlist", { method: "GET" });
      if (primary.ok) {
        const data = (await primary.json()) as { ids?: string[] };
        if (!alive) return;
        setEndpoint("/api/wishlist");
        setWishlisted(new Set((data.ids ?? []).map(String)).has(id));
        return;
      }

      const legacy = await fetch("/api/whishlist", { method: "GET" });
      if (!legacy.ok) return;
      const data = (await legacy.json()) as { ids?: string[] };
      if (!alive) return;
      setEndpoint("/api/whishlist");
      setWishlisted(new Set((data.ids ?? []).map(String)).has(id));
    }

    load();
    return () => {
      alive = false;
    };
  }, [id, isLoaded, isSignedIn]);

  async function toggle() {
    const current = wishlisted;
    setWishlisted(!current);

    const res = await fetch(endpoint, {
      method: current ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id }),
    });

    if (!res.ok) setWishlisted(current);
  }

  const base =
    `absolute ${positionClass} z-10 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/35 text-white/90 backdrop-blur-sm transition`;
  const active = wishlisted
    ? "bg-[#3BC7C4]/90 text-black border-[#3BC7C4]/90"
    : "";

  return (
    <div className={className}>
      <SignedOut>
        <SignInButton mode="modal">
          <span
            role="button"
            tabIndex={0}
            className={base}
            aria-label="Sign in to wishlist"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Bookmark size={14} />
          </span>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <span
          role="button"
          tabIndex={0}
          className={`${base} ${active}`}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void toggle();
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            e.stopPropagation();
            void toggle();
          }}
        >
          <Bookmark
            size={14}
            fill={wishlisted ? "currentColor" : "none"}
            strokeWidth={wishlisted ? 2.2 : 2}
          />
        </span>
      </SignedIn>
    </div>
  );
}
