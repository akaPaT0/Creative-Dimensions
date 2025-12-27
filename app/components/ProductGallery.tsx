"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

export default function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const cleanImages = useMemo(() => {
    const uniq = Array.from(new Set(images.filter(Boolean)));
    return uniq.length ? uniq : ["/products/placeholder.jpg"];
  }, [images]);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  const scrollToIndex = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(i, cleanImages.length - 1));
    const child = el.children.item(clamped) as HTMLElement | null;
    if (!child) return;
    child.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = el.clientWidth || 1;
        const idx = Math.round(el.scrollLeft / w);
        setActive(Math.max(0, Math.min(idx, cleanImages.length - 1)));
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [cleanImages.length]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-3">
      {/* Main swipe area */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/20">
        <div
          ref={scrollerRef}
          className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {cleanImages.map((src) => (
            <div key={src} className="relative min-w-full snap-start aspect-square">

              <Image
                src={src}
                alt={name}
                fill
                className="object-contain p-3"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={false}
              />
              {/* subtle glow */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
            </div>
          ))}
        </div>

        {/* Prev/Next buttons (nice on desktop, still works on mobile) */}
        {cleanImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollToIndex(active - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-white/90 backdrop-blur hover:bg-black/45 transition disabled:opacity-40"
              disabled={active === 0}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex(active + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-white/90 backdrop-blur hover:bg-black/45 transition disabled:opacity-40"
              disabled={active === cleanImages.length - 1}
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}

        {/* Dots */}
        {cleanImages.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
            {cleanImages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToIndex(i)}
                className={[
                  "h-2.5 w-2.5 rounded-full border border-white/15 transition",
                  i === active ? "bg-white/70" : "bg-white/20 hover:bg-white/30",
                ].join(" ")}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {cleanImages.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {cleanImages.slice(0, 5).map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => scrollToIndex(i)}
              className={[
                "relative aspect-square overflow-hidden rounded-xl border bg-white/5 transition",
                i === active ? "border-white/30" : "border-white/10 hover:border-white/20",
              ].join(" ")}
              aria-label={`Select image ${i + 1}`}
            >
              <Image src={src} alt={name} fill className="object-cover" sizes="120px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
