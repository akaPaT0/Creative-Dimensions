"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type Sparkle = {
  size: number;
  top: string;
  left: string;
  delay: string;
};

function makeSparkles(count: number, sizeMin: number, sizeMax: number): Sparkle[] {
  return Array.from({ length: count }).map(() => ({
    size: Math.random() * (sizeMax - sizeMin) + sizeMin,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
  }));
}

export default function Background() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)"); // Tailwind sm breakpoint

    const apply = () => {
      const desktop = mq.matches;
      setIsDesktop(desktop);

      // Desktop: richer sparkle field
      // Mobile: still sparkly, but not blinding
      setSparkles(desktop ? makeSparkles(40, 4, 22) : makeSparkles(22, 3, 12));
    };

    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#0D0D0D] via-[#111111] to-[#12100B]">
      {/* Sparkles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {sparkles.map((s, i) => {
          const sparkleStyle: CSSProperties = {
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: "#FF8B64",
            clipPath:
              "polygon(50% 0%, 60% 38%, 100% 50%, 60% 62%, 50% 100%, 40% 62%, 0% 50%, 40% 38%)",
          };

          // Tuned: mobile is calmer, desktop is richer
          const glowOpacity = isDesktop ? 0.18 : 0.09;
          const glowBlur = isDesktop ? "10px" : "14px";
          const glowShadow = isDesktop
            ? "0 0 30px rgba(255,139,100,0.75)"
            : "0 0 18px rgba(255,139,100,0.30)";
          const mainOpacity = isDesktop ? 0.75 : 0.38;

          return (
            <span
              key={i}
              className="absolute"
              style={{
                top: s.top,
                left: s.left,
                width: `${s.size}px`,
                height: `${s.size}px`,
              }}
            >
              {/* Glow behind (softened on mobile) */}
              <span
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  background: "#FF8B64",
                  animationDelay: s.delay,
                  transform: "scale(1.0)",
                  opacity: glowOpacity,
                  filter: `blur(${glowBlur})`,
                  boxShadow: glowShadow,
                }}
              />

              {/* Main sparkle */}
              <span
                className="absolute inset-0 animate-pulse"
                style={{
                  ...sparkleStyle,
                  animationDelay: s.delay,
                  opacity: mainOpacity,
                }}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}
