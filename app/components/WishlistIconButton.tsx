"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark } from "lucide-react";
import AuthModal from "./AuthModal";
import { authFetch, useSupabaseAuth } from "@/app/lib/supabase/auth-client";

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
  const { isLoaded, isSignedIn } = useSupabaseAuth();
  const [wishlisted, setWishlisted] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const id = useMemo(() => String(productId), [productId]);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!isLoaded) return;
      if (!isSignedIn) {
        setWishlisted(false);
        return;
      }

      const res = await authFetch("/api/wishlist", { method: "GET" });
      if (!res.ok) return;
      const data = (await res.json()) as { ids?: string[] };
      if (!alive) return;
      setWishlisted(new Set((data.ids ?? []).map(String)).has(id));
    }

    void load();
    return () => {
      alive = false;
    };
  }, [id, isLoaded, isSignedIn]);

  async function toggle() {
    const current = wishlisted;
    setWishlisted(!current);

    const res = await authFetch("/api/wishlist", {
      method: current ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id }),
    });

    if (!res.ok) setWishlisted(current);
  }

  const base = `absolute ${positionClass} z-10 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/35 text-white/90 backdrop-blur-sm transition`;
  const active = wishlisted
    ? "bg-[#3BC7C4]/90 text-black border-[#3BC7C4]/90"
    : "";

  return (
    <div className={className}>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <span
        role="button"
        tabIndex={0}
        className={`${base} ${isSignedIn ? active : ""}`}
        aria-label={
          isSignedIn
            ? wishlisted
              ? "Remove from wishlist"
              : "Add to wishlist"
            : "Sign in to wishlist"
        }
        aria-pressed={isSignedIn ? wishlisted : undefined}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!isSignedIn) {
            setAuthOpen(true);
            return;
          }
          void toggle();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          if (!isSignedIn) {
            setAuthOpen(true);
            return;
          }
          void toggle();
        }}
      >
        <Bookmark
          size={14}
          fill={wishlisted ? "currentColor" : "none"}
          strokeWidth={wishlisted ? 2.2 : 2}
        />
      </span>
    </div>
  );
}
