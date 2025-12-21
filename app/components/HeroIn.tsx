"use client";

import { useEffect, useRef } from "react";

export default function HeroIn({
  children,
  duration = 750,
  y = -12, // negative = from top
}: {
  children: React.ReactNode;
  duration?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (reduce) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }

    const anim = el.animate(
      [
        { opacity: 0, transform: `translateY(${y}px)` },
        { opacity: 1, transform: "translateY(0px)" },
      ],
      {
        duration,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      }
    );

    anim.onfinish = () => {
      el.style.opacity = "1";
      el.style.transform = "none";
    };
  }, [duration, y]);

  // start hidden + offset immediately (prevents late animation feel)
  return (
    <div ref={ref} className="w-full" style={{ opacity: 0, transform: "translateY(-12px)" }}>
      {children}
    </div>
  );
}
