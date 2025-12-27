"use client";

import React, { useEffect, useRef, useState } from "react";

/** Shared IntersectionObserver (fast) */
type Handler = (entry: IntersectionObserverEntry) => void;
const handlers = new WeakMap<Element, Handler>();
let io: IntersectionObserver | null = null;

function getIO() {
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const h = handlers.get(entry.target);
          if (h) h(entry);
        }
      },
      {
        threshold: [0, 0.15],
        rootMargin: "120px 0px 120px 0px",
      }
    );
  }
  return io;
}

type Props = {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
};

export default function Reveal({ children, delayMs = 0, className = "" }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  // IMPORTANT: defaults must match server render
  const [reduce, setReduce] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    // Read window only after mount (prevents hydration mismatch)
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqMobile = window.matchMedia("(max-width: 640px)");

    const sync = () => {
      setReduce(mqReduce.matches);
      setMobile(mqMobile.matches);
    };

    sync();
    mqReduce.addEventListener?.("change", sync);
    mqMobile.addEventListener?.("change", sync);

    return () => {
      mqReduce.removeEventListener?.("change", sync);
      mqMobile.removeEventListener?.("change", sync);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduce) {
      setShown(true);
      return;
    }

    const observer = getIO();

    handlers.set(el, (entry) => {
      const r = entry.intersectionRatio;

      // Enter: show
      if (r >= 0.15) requestAnimationFrame(() => setShown(true));

      // Exit: hide again so it replays next time
      if (r <= 0.01 && !entry.isIntersecting) setShown(false);
    });

    observer.observe(el);

    return () => {
      handlers.delete(el);
      observer.unobserve(el);
    };
  }, [reduce]);

  return (
    <div
      ref={ref}
      style={
        {
          ["--reveal-delay" as any]: `${delayMs}ms`,
          // These can change AFTER hydration safely
          ["--reveal-dy" as any]: mobile ? "6px" : "12px",
          ["--reveal-dur" as any]: mobile ? "260ms" : "520ms",
        } as React.CSSProperties
      }
      className={[
        "transform-gpu will-change-transform will-change-opacity",
        "[contain:paint]",
        shown ? "reveal-in" : "reveal-hidden",
        className,
      ].join(" ")}
    >
      {children}

      <style jsx>{`
        .reveal-hidden {
          opacity: 0;
          transform: translate3d(0, var(--reveal-dy, 12px), 0);
        }
        .reveal-in {
          animation: revealIn var(--reveal-dur, 520ms) ease-out both;
          animation-delay: var(--reveal-delay, 0ms);
        }
        @keyframes revealIn {
          from {
            opacity: 0;
            transform: translate3d(0, var(--reveal-dy, 12px), 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>
    </div>
  );
}
