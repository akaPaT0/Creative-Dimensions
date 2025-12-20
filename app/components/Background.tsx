"use client";

import { useEffect, useState } from "react";

type Sparkle = {
  id: number;
  top: string;
  left: string;
  delay: string;
  size: string;
};

function generateSparkles(count = 40): Sparkle[] {
  return Array.from({ length: count }).map((_, i) => {
    const size = Math.random() * 20 + 4;

    return {
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      size: `${size}px`,
    };
  });
}

export default function Background() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  // Runs only in the browser, so every hard refresh gets a new layout.
  useEffect(() => {
    setSparkles(generateSparkles(40));
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#0D0D0D] via-[#111111] to-[#12100B]">
      {/* Sparkles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {sparkles.map((sp) => (
          <span
            key={sp.id}
            className="absolute opacity-80 animate-pulse"
            style={{
              top: sp.top,
              left: sp.left,
              animationDelay: sp.delay,
              width: sp.size,
              height: sp.size,
              background: "#FF8B64",
              clipPath:
                "polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
