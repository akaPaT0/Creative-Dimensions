"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

export default function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const imgs = useMemo(
    () =>
      Array.isArray(images) && images.length
        ? images
        : ["/products/placeholder.jpg"],
    [images]
  );

  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const current =
    imgs[Math.min(Math.max(active, 0), imgs.length - 1)] ||
    "/products/placeholder.jpg";

  useEffect(() => setMounted(true), []);

  // Esc + arrows
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight")
        setActive((i) => Math.min(i + 1, imgs.length - 1));
      if (e.key === "ArrowLeft")
        setActive((i) => Math.max(i - 1, 0));
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, imgs.length]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const modal = open ? (
    // ✅ outer layer: pointer-events none so header doesn't "fight" visually/click-wise
    <div className="fixed inset-0 z-[999999] pointer-events-none">
      {/* ✅ overlay behind modal (lower opacity than X button) */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        // allow clicking outside to close
        onMouseDown={(e) => {
          // needs pointer events, so we attach to inner wrapper (below)
        }}
      />

      {/* ✅ actual modal wrapper: pointer-events enabled */}
      <div
        className="absolute inset-0 pointer-events-auto"
        onMouseDown={(e) => {
          // click outside closes
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        <div className="mx-auto h-full w-full max-w-6xl px-4 py-6 flex flex-col">
          {/* ✅ Top bar with its own background so it never blends with header */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0D0D0D]/55 backdrop-blur-xl px-4 py-3">
            <div className="text-white/85 text-sm truncate">{name}</div>

            {/* ✅ X button more opaque than popup background */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-white/20 bg-black/80 px-3 py-2 text-white hover:bg-black/90 transition"
              aria-label="Close preview"
            >
              ✕
            </button>
          </div>

          {/* ✅ Big image panel */}
          <div className="mt-4 flex-1 rounded-2xl border border-white/10 bg-[#0D0D0D]/45 backdrop-blur-xl overflow-hidden relative">
            <Image
              src={current}
              alt={name}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* ✅ thumbs inside modal */}
          {imgs.length > 1 && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-[#0D0D0D]/40 backdrop-blur-xl p-3">
              <div className="flex gap-2 overflow-x-auto">
                {imgs.map((src, i) => (
                  <button
                    key={`modal-${src}-${i}`}
                    type="button"
                    onClick={() => setActive(i)}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border transition ${
                      i === active
                        ? "border-white/40"
                        : "border-white/10 hover:border-white/20"
                    }`}
                    aria-label={`View image ${i + 1}`}
                  >
                    <Image
                      src={src}
                      alt={`${name} ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Normal gallery (page) */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative w-full aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/20 focus:outline-none"
          aria-label="Open image preview"
        >
          <Image
            src={current}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-3 right-3 rounded-xl border border-white/15 bg-black/45 px-3 py-1.5 text-xs text-white/85 backdrop-blur">
            Tap to zoom
          </div>
        </button>

        {/* thumbs */}
        {imgs.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {imgs.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition ${
                  i === active
                    ? "border-white/40"
                    : "border-white/10 hover:border-white/20"
                }`}
                aria-label={`View image ${i + 1}`}
              >
                <Image
                  src={src}
                  alt={`${name} ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Portal to body so Navbar can't overlay it */}
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
