"use client";

import { useEffect, useState } from "react";

type Sparkle = {
  size: number;
  top: string;
  left: string;
  delay: string;
  duration: string;
};

function makeSparkles(count: number, sizeMin: number, sizeMax: number): Sparkle[] {
  return Array.from({ length: count }).map(() => ({
    size: Math.round(Math.random() * (sizeMax - sizeMin) + sizeMin),
    top: `${Math.round(Math.random() * 96)}%`,
    left: `${Math.round(Math.random() * 96)}%`,
    delay: `${(Math.random() * 4).toFixed(1)}s`,
    duration: `${(2.5 + Math.random() * 2.5).toFixed(1)}s`,
  }));
}

export default function Background() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");

    const apply = () => {
      const desktop = mq.matches;
      // 12 on mobile (silky 60/120fps), 24 on desktop
      setSparkles(desktop ? makeSparkles(24, 6, 20) : makeSparkles(12, 4, 14));
    };

    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#0D0D0D] via-[#111111] to-[#12100B] pointer-events-none"
      style={{ transform: "translateZ(0)", willChange: "transform" }}
      aria-hidden="true"
    >
      {/* Subtle ambient luxury warmth mesh (hardware-accelerated radial gradient) */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at top, rgba(255,139,100,0.15) 0%, transparent 70%)",
        }}
      />

      {/* GPU-composited Sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {sparkles.map((s, i) => (
          <span
            key={i}
            className="absolute animate-pulse"
            style={{
              top: s.top,
              left: s.left,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: s.delay,
              animationDuration: s.duration,
              willChange: "opacity",
            }}
          >
            {/* Soft radial glow (GPU shader, zero CPU repaints) */}
            <span
              className="absolute -inset-1 rounded-full opacity-60 pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(255,139,100,0.6) 0%, rgba(255,139,100,0) 70%)",
              }}
            />

            {/* Crisp 4-point diamond star (Hardware SVG) */}
            <svg
              viewBox="0 0 24 24"
              className="relative w-full h-full drop-shadow-[0_0_4px_rgba(255,139,100,0.5)]"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 0L14.2 9.8L24 12L14.2 14.2L12 24L9.8 14.2L0 12L9.8 9.8L12 0Z"
                fill="#FF8B64"
                fillOpacity="0.85"
              />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}
