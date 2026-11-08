"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Heart, ShoppingCart } from "lucide-react";
import AuthModal from "./AuthModal";
import { addToCart } from "./AddToCartButton";
import { authFetch, useSupabaseAuth } from "@/app/lib/supabase/auth-client";

/** Like and quick add-to-cart buttons for the product page header. */
export default function LikeCartRow({ productId, className = "" }: { productId: string; className?: string }) {
  const { isLoaded, isSignedIn } = useSupabaseAuth();
  const id = useMemo(() => String(productId), [productId]);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!isLoaded) return;
      if (!isSignedIn) {
        setLiked(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await authFetch("/api/likes", { method: "GET" });
      const data = res.ok ? ((await res.json()) as { ids?: string[] }) : {};
      if (!alive) return;
      setLiked(new Set((data.ids ?? []).map(String)).has(id));
      setLoading(false);
    }
    void load();
    return () => {
      alive = false;
    };
  }, [id, isLoaded, isSignedIn]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  async function toggleLike() {
    if (!isSignedIn) {
      setAuthOpen(true);
      return;
    }
    if (loading) return;
    const current = liked;
    setLiked(!current);
    const res = await authFetch("/api/likes", {
      method: current ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id }),
    });
    if (!res.ok) setLiked(current);
  }

  function add() {
    addToCart(id);
    setAdded(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1400);
  }

  const btn =
    "h-10 w-10 rounded-xl border inline-flex items-center justify-center transition";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <button
        type="button"
        onClick={toggleLike}
        aria-pressed={isSignedIn ? liked : undefined}
        aria-label={isSignedIn ? (liked ? "Remove like" : "Like") : "Sign in to like"}
        className={`${btn} ${
          liked
            ? "border-[#FF8B64]/90 bg-[#FF8B64]/90 text-[#0D0D0D]"
            : "border-white/15 bg-white/5 text-white/85 hover:bg-white/10 hover:border-white/25"
        }`}
      >
        <Heart size={18} fill={liked ? "currentColor" : "none"} strokeWidth={liked ? 2.2 : 2} />
      </button>
      <button
        type="button"
        onClick={add}
        aria-label={added ? "Added to cart" : "Add to cart"}
        className={`${btn} ${
          added
            ? "border-[#FF8B64] bg-[#FF8B64] text-[#0D0D0D]"
            : "border-white/15 bg-white/5 text-white/85 hover:border-[#FF8B64] hover:bg-[#FF8B64] hover:text-[#0D0D0D]"
        }`}
      >
        {added ? <Check size={18} strokeWidth={2.6} /> : <ShoppingCart size={18} />}
      </button>
    </div>
  );
}
