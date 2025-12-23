"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type Sparkle = {
  size: number;
  top: string;
  left: string;
  delay: string;
};

export default function Background() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    setSparkles(
      Array.from({ length: 40 }).map(() => ({
        size: Math.random() * 20 + 4,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`,
      }))
    );
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
              {/* BIG glow behind (not clipped) */}
              <span
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  background: "#FF8B64",
                  animationDelay: s.delay,
                  transform: "scale(1.0)",
                  opacity: 0.2,
                  filter: "blur(10px)",
                  boxShadow: "0 0 30px rgba(255,139,100,0.9)",
                }}
              />

              {/* main sparkle */}
              <span
                className="absolute inset-0 opacity-80 animate-pulse"
                style={{
                  ...sparkleStyle,
                  animationDelay: s.delay,
                }}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}
