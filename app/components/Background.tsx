export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#0D0D0D] via-[#111111] to-[#12100B]">
      {/* Sparkles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => {
          const size = Math.random() * 20 + 4;

          const top = `${Math.random() * 100}%`;
          const left = `${Math.random() * 100}%`;
          const delay = `${Math.random() * 5}s`;

          // slightly more vertical than before
          const sparkleStyle: React.CSSProperties = {
            width: `${size}px`,
            height: `${size}px`,
            background: "#FF8B64",
            clipPath:
              "polygon(50% 0%, 60% 38%, 100% 50%, 60% 62%, 50% 100%, 40% 62%, 0% 50%, 40% 38%)",
          };

          return (
            <span
              key={i}
              className="absolute"
              style={{ top, left, width: `${size}px`, height: `${size}px` }}
            >
              {/* BIG glow behind (not clipped) */}
              <span
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  background: "#FF8B64",
                  animationDelay: delay,
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
                  animationDelay: delay,
                }}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}
