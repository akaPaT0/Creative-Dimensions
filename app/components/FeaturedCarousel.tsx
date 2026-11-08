"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type FeaturedItem = {
  key: string;
  href: string;
  title: string;
  price: string;
  category: string;
  image: string;
  hoverImage?: string;
  isNew?: boolean;
};

export default function FeaturedCarousel({ items }: { items: FeaturedItem[] }) {
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

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Previous featured products"
        onClick={() => scrollByPage(-1)}
        disabled={!canPrev}
        className={`${arrowClass} -left-5`}
      >
        <ChevronLeft size={20} />
      </button>

      <div
        ref={trackRef}
        className="flex gap-3.5 sm:gap-4 lg:gap-5 overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2"
      >
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="group flex flex-col rounded-2xl border border-white/10 bg-[#161619]/90 hover:border-[#FF8B64]/40 transition-all duration-200 p-2.5 sm:p-3 shrink-0 snap-start shadow-md w-[42%] sm:w-[calc((100%-2rem)/3)] md:w-[calc((100%-4rem)/5)] lg:w-[calc((100%-5rem)/5)]"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/40 border border-white/5">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className={`object-cover transition-all duration-300 group-hover:scale-[1.04] ${
                  item.hoverImage ? "group-hover:opacity-0" : ""
                }`}
                sizes="(max-width: 640px) 160px, (max-width: 1024px) 33vw, 20vw"
              />
              {item.hoverImage && (
                <Image
                  src={item.hoverImage}
                  alt=""
                  aria-hidden="true"
                  fill
                  className="object-cover opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 160px, (max-width: 1024px) 33vw, 20vw"
                />
              )}
              {item.isNew && (
                <span className="absolute left-2 top-2 rounded-full bg-[#FF8B64] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0D0D0D]">
                  New
                </span>
              )}
            </div>

            <div className="mt-2.5 flex flex-1 flex-col">
              <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-white/40">
                {item.category}
              </span>
              <span className="mt-0.5 line-clamp-2 min-h-[2.5em] text-xs sm:text-sm font-semibold leading-tight text-white group-hover:text-[#FF8B64] transition-colors">
                {item.title}
              </span>
              <span className="mt-auto pt-1.5 text-xs sm:text-sm font-bold text-[#FF8B64]">
                {item.price}
              </span>
            </div>
          </Link>
        ))}
        <div className="shrink-0 w-2 sm:hidden pointer-events-none" aria-hidden="true" />
      </div>

      <button
        type="button"
        aria-label="Next featured products"
        onClick={() => scrollByPage(1)}
        disabled={!canNext}
        className={`${arrowClass} -right-5`}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
