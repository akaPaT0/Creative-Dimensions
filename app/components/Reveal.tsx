"use client";

import { useEffect, useRef, useState } from "react";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;     // stagger on enter
  threshold?: number;   // how much must be visible to trigger
};

export default function Reveal({
  children,
  className = "",
  delayMs = 0,
  threshold = 0.15,
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out will-change-transform
        ${inView ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-6 blur-[2px]"}
      `}
      style={{
        transitionDelay: inView ? `${delayMs}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
}
