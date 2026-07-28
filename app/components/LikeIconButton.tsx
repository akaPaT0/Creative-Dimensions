"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import AuthModal from "./AuthModal";
import { authFetch, useSupabaseAuth } from "@/app/lib/supabase/auth-client";

type Props = {
  productId: string;
  className?: string;
  positionClass?: string;
};

async function readLikeIds(): Promise<Set<string>> {
  const res = await authFetch("/api/likes", { method: "GET" });
  if (!res.ok) return new Set();
  const data = (await res.json()) as { ids?: string[] };
  return new Set((data.ids ?? []).map(String));
}

export default function LikeIconButton({
  productId,
  className = "",
  positionClass = "bottom-2 right-2",
}: Props) {
  const { isLoaded, isSignedIn } = useSupabaseAuth();
  const [liked, setLiked] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const id = useMemo(() => String(productId), [productId]);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!isLoaded) return;
      if (!isSignedIn) {
        setLiked(false);
        return;
      }

      const likedSet = await readLikeIds();
      if (!alive) return;
      setLiked(likedSet.has(id));
    }

    void load();
    return () => {
      alive = false;
    };
  }, [id, isLoaded, isSignedIn]);

  async function toggle() {
    const current = liked;
    setLiked(!current);

    const res = await authFetch("/api/likes", {
      method: current ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id }),
    });

    if (!res.ok) setLiked(current);
  }

  const base = `absolute ${positionClass} z-10 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/35 text-white/90 backdrop-blur-sm transition`;
  const active = liked ? "bg-[#FF8B64]/90 text-black border-[#FF8B64]/90" : "";

  return (
    <div className={className}>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <span
        role="button"
        tabIndex={0}
        className={`${base} ${isSignedIn ? active : ""}`}
        aria-label={isSignedIn ? (liked ? "Remove like" : "Like") : "Sign in to like"}
        aria-pressed={isSignedIn ? liked : undefined}
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
        <Heart
          size={14}
          fill={liked ? "currentColor" : "none"}
          strokeWidth={liked ? 2.2 : 2}
        />
      </span>
    </div>
  );
}
