"use client";

import ProductCard from "./ProductCard";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type FeaturedItem = {
  key: string;
  /** Product id; enables like and add-to-cart buttons. */
  id?: string;
  href: string;
  title: string;
  price: string;
  category: string;
  image: string;
  hoverImage?: string;
  isNew?: boolean;
};

export default function FeaturedCarousel({
  items,
  header,
}: {
  items: FeaturedItem[];
  /** Section header; when given, the arrows sit in it instead of on the sides. */
  header?: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  const arrowClass =
    "hidden md:flex absolute top-[38%] -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#161619]/95 text-white shadow-lg backdrop-blur transition hover:border-[#FF8B64]/60 hover:text-[#FF8B64] disabled:pointer-events-none disabled:opacity-0";

  const headerArrowClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/80 transition hover:border-[#FF8B64]/60 hover:text-[#FF8B64] disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="relative">
      {header ? (
        <div className="mb-4 sm:mb-6 flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">{header}</div>
          <div className="hidden md:flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Previous products"
              onClick={() => scrollByPage(-1)}
              disabled={!canPrev}
              className={headerArrowClass}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Next products"
              onClick={() => scrollByPage(1)}
              disabled={!canNext}
              className={headerArrowClass}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Previous featured products"
          onClick={() => scrollByPage(-1)}
          disabled={!canPrev}
          className={`${arrowClass} -left-5`}
        >
          <ChevronLeft size={20} />
        </button>
      )}

      <div
        ref={trackRef}
        className="flex gap-3.5 sm:gap-4 lg:gap-5 overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2"
      >
        {items.map((item) => (
          <ProductCard
            key={item.key}
            item={{ ...item, label: item.category }}
            productId={item.id}
            className="shrink-0 snap-start w-[42%] sm:w-[calc((100%-2rem)/3)] md:w-[calc((100%-4rem)/5)] lg:w-[calc((100%-5rem)/5)]"
            sizes="(max-width: 640px) 160px, (max-width: 1024px) 33vw, 20vw"
          />
        ))}
        <div className="shrink-0 w-2 sm:hidden pointer-events-none" aria-hidden="true" />
      </div>

      {!header && (
        <button
          type="button"
          aria-label="Next featured products"
          onClick={() => scrollByPage(1)}
          disabled={!canNext}
          className={`${arrowClass} -right-5`}
        >
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
}
