"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";

type Props = {
  productId: string;
  className?: string;
};

async function readLikeIds(): Promise<Set<string>> {
  const res = await fetch("/api/likes", { method: "GET" });
  if (!res.ok) return new Set();
  const data = (await res.json()) as { ids?: string[] };
  return new Set((data.ids ?? []).map(String));
}

export default function LikeIconButton({ productId, className = "" }: Props) {
  const { isLoaded, isSignedIn } = useUser();
  const [liked, setLiked] = useState(false);

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

    load();
    return () => {
      alive = false;
    };
  }, [id, isLoaded, isSignedIn]);

  async function toggle() {
    const current = liked;
    setLiked(!current);

    const res = await fetch("/api/likes", {
      method: current ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id }),
    });

    if (!res.ok) setLiked(current);
  }

  const base =
    "absolute bottom-2 right-2 z-10 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/35 text-white/90 backdrop-blur-sm transition";
  const active = liked ? "bg-[#FF8B64]/90 text-black border-[#FF8B64]/90" : "";

  return (
    <div className={className}>
      <SignedOut>
        <SignInButton mode="modal">
          <span
            role="button"
            tabIndex={0}
            className={base}
            aria-label="Sign in to like"
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
            <Heart size={14} />
          </span>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <span
          role="button"
          tabIndex={0}
          className={`${base} ${active}`}
          aria-label={liked ? "Remove like" : "Like"}
          aria-pressed={liked}
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
          <Heart
            size={14}
            fill={liked ? "currentColor" : "none"}
            strokeWidth={liked ? 2.2 : 2}
          />
        </span>
      </SignedIn>
    </div>
  );
}
