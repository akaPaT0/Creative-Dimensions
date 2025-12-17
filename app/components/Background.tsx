export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#0D0D0D] via-[#111111] to-[#12100B]">
      
      {/* Sparkles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => {
          const size = Math.random() * 20 + 4;

          return (
            <span
              key={i}
              className="absolute opacity-80 animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                width: `${size}px`,
                height: `${size}px`,
                background: "#FF8B64",
                clipPath:
                  "polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)",
              }}
            />
          );
        })}
      </div>

    </div>
  );
}
