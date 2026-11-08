"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useProductSelection } from "./ProductSelection";

const PLACEHOLDER = "/products/placeholder.jpg";

/** Index of the slide closest to the scroller's current position. */
function slideIndex(el: HTMLDivElement) {
  return el.clientWidth ? Math.round(el.scrollLeft / el.clientWidth) : 0;
}

function scrollToSlide(el: HTMLDivElement | null, index: number, smooth = true) {
  if (!el) return;
  el.scrollTo({ left: index * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
}

const arrowBase =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-[#0D0D0D]/70 text-white backdrop-blur transition hover:border-[#FF8B64]/70 hover:text-[#FF8B64] disabled:pointer-events-none disabled:opacity-0";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const imgs = useMemo(
    () => (Array.isArray(images) && images.length ? images : [PLACEHOLDER]),
    [images]
  );
  const count = imgs.length;
  const multiple = count > 1;

  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  const thumbsRef = useRef<HTMLDivElement | null>(null);
  const lightboxThumbsRef = useRef<HTMLDivElement | null>(null);

  const goTo = useCallback(
    (index: number, opts?: { instant?: boolean }) => {
      const next = Math.min(Math.max(index, 0), count - 1);
      const from = stageRef.current ? slideIndex(stageRef.current) : next;
      // Neighbouring photo: slide. Further away: jump straight there instead of
      // scrolling past every photo in between.
      const smooth = !opts?.instant && Math.abs(next - from) <= 1;
      setActive(next);
      scrollToSlide(stageRef.current, next, smooth);
      scrollToSlide(lightboxRef.current, next, smooth);
    },
    [count]
  );

  // Optional link with colour swatches on the product page.
  const selection = useProductSelection();
  const reportIndex = selection?.reportIndex;
  useEffect(() => {
    reportIndex?.(active);
  }, [active, reportIndex]);
  const registerGallery = selection?.registerGallery;
  useEffect(() => {
    registerGallery?.(goTo);
    return () => registerGallery?.(null);
  }, [registerGallery, goTo]);

  // Keep the active index in sync when the user swipes.
  const onStageScroll = () => {
    if (stageRef.current) setActive(slideIndex(stageRef.current));
  };
  const onLightboxScroll = () => {
    if (lightboxRef.current) setActive(slideIndex(lightboxRef.current));
  };

  // Keep the active thumbnail visible (page strip and full-screen strip).
  useEffect(() => {
    for (const strip of [thumbsRef.current, lightboxThumbsRef.current]) {
      const thumb = strip?.children[active] as HTMLElement | undefined;
      thumb?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }
  }, [active, open]);

  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Lightbox open/close: jump to the current image and lock page scroll;
  // on close, line the main stage up with the image viewed last.
  useEffect(() => {
    if (!open) {
      scrollToSlide(stageRef.current, activeRef.current, false);
      return;
    }
    const frame = requestAnimationFrame(() =>
      scrollToSlide(lightboxRef.current, activeRef.current, false)
    );
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Lightbox keyboard controls.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") goTo(activeRef.current + 1);
      if (e.key === "ArrowLeft") goTo(activeRef.current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, goTo]);

  const counter = (
    <span className="rounded-full bg-[#0D0D0D]/70 px-2.5 py-1 text-xs font-semibold tabular-nums text-white/90 backdrop-blur">
      {active + 1} / {count}
    </span>
  );

  const lightbox = open ? (
    <div
      className="fixed inset-0 z-[999999] flex flex-col bg-[#0B0B0C]/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${name} images`}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <span className="min-w-0 truncate text-sm font-medium text-white/80">{name}</span>
        <div className="flex items-center gap-3">
          {multiple && counter}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={lightboxRef}
          onScroll={onLightboxScroll}
          className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {imgs.map((src, i) => (
            <div key={`lb-${src}-${i}`} className="relative h-full w-full shrink-0 snap-center">
              <Image
                src={src}
                alt={`${name} ${i + 1}`}
                fill
                className="object-contain p-2 sm:p-8"
                sizes="100vw"
                priority={i === active}
              />
            </div>
          ))}
        </div>
        {multiple && (
          <>
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              aria-label="Previous image"
              className={`${arrowBase} absolute left-3 top-1/2 h-12 w-12 -translate-y-1/2 sm:left-6`}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              disabled={active === count - 1}
              aria-label="Next image"
              className={`${arrowBase} absolute right-3 top-1/2 h-12 w-12 -translate-y-1/2 sm:right-6`}
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {multiple && (
        <div className="overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* w-max + mx-auto: centred when it fits, scrollable from the first thumb when it doesn't. */}
          <div ref={lightboxThumbsRef} className="mx-auto flex w-max gap-2 p-1">
            {imgs.map((src, i) => (
              <button
                key={`lbt-${src}-${i}`}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={i === active}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  i === active ? "border-[#FF8B64] opacity-100" : "border-transparent opacity-50 hover:opacity-90"
                }`}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="56px" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="w-full">
      <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/40">
        <div
          ref={stageRef}
          onScroll={onStageScroll}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {imgs.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setOpen(true)}
              aria-label={`Open image ${i + 1} full screen`}
              className="relative aspect-square w-full shrink-0 snap-center cursor-zoom-in focus:outline-none"
            >
              <Image
                src={src}
                alt={i === 0 ? name : `${name} ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={i === 0}
                // Load every slide up front so swatch jumps show the photo instantly.
                loading={i === 0 ? undefined : "eager"}
              />
            </button>
          ))}
        </div>

        {/* Overlays */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3">
          {multiple ? counter : <span />}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="View full screen"
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#0D0D0D]/70 text-white/90 backdrop-blur transition hover:text-[#FF8B64]"
          >
            <Expand size={16} />
          </button>
        </div>

        {multiple && (
          <>
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              aria-label="Previous image"
              className={`${arrowBase} absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 opacity-0 group-hover:opacity-100 md:inline-flex`}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              disabled={active === count - 1}
              aria-label="Next image"
              className={`${arrowBase} absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 opacity-0 group-hover:opacity-100 md:inline-flex`}
            >
              <ChevronRight size={20} />
            </button>

            {/* Dots (mobile) */}
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden">
              {imgs.map((_, i) => (
                <span
                  key={`dot-${i}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === active ? "w-5 bg-[#FF8B64]" : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {multiple && (
        <div
          ref={thumbsRef}
          className="mt-3 hidden gap-2.5 overflow-x-auto pb-1 md:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {imgs.map((src, i) => (
            <button
              key={`thumb-${src}-${i}`}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border transition ${
                i === active
                  ? "border-[#FF8B64] ring-1 ring-[#FF8B64]"
                  : "border-white/10 opacity-60 hover:opacity-100 hover:border-white/25"
              }`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}

      {lightbox ? createPortal(lightbox, document.body) : null}
    </div>
  );
}
