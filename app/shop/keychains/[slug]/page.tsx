"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type Props = {
  images: string[];
  name?: string;
};

export default function ProductGallery({ images, name = "Product" }: Props) {
  const imgs = useMemo(() => (Array.isArray(images) ? images.filter(Boolean) : []), [images]);
  const [index, setIndex] = useState(0);

  // Keep index valid if images change
  useEffect(() => {
    if (index > imgs.length - 1) setIndex(0);
  }, [imgs.length, index]);

  const hasMany = imgs.length > 1;
  const current = imgs[index] || "/products/placeholder.jpg";

  function prev() {
    if (!hasMany) return;
    setIndex((i) => (i - 1 + imgs.length) % imgs.length);
  }

  function next() {
    if (!hasMany) return;
    setIndex((i) => (i + 1) % imgs.length);
  }

  return (
    <div className="w-full">
      {/* Main image frame */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        <div className="relative aspect-square w-full">
          <Image
            src={current}
            alt={`${name} image ${index + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Arrows */}
        {hasMany && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-white/90 hover:bg-black/55 transition"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-white/90 hover:bg-black/55 transition"
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}

        {/* Dots */}
        {hasMany && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2">
            {imgs.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full transition ${
                  i === index ? "bg-white/80" : "bg-white/25 hover:bg-white/45"
                }`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails (scrollable + clipped) */}
      {hasMany && (
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-2 overflow-hidden">
          <div className="flex gap-2 overflow-x-auto overscroll-x-contain">
            {imgs.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border transition ${
                  i === index
                    ? "border-white/40"
                    : "border-white/10 hover:border-white/25"
                }`}
                aria-label={`View thumbnail ${i + 1}`}
              >
                <Image
                  src={src}
                  alt={`${name} thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                {i === index && (
                  <div className="pointer-events-none absolute inset-0 ring-2 ring-white/20" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
