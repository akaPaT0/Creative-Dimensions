"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useRef } from "react";

type Item = {
  id?: string;
  slug: string;
  name: string;
  image: string;
};

export default function RecommendedRow({ items }: { items: Item[] }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const canScroll = useMemo(() => (items?.length ?? 0) > 4, [items?.length]);

  const scrollByOneView = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(240, el.clientWidth * 0.9);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  if (!items?.length) return null;

  return (
    <div className="mt-auto rounded-2xl border border-white/10 bg-black/20 p-3 lg:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-white/85 font-semibold">Check similar</div>

        {/* Arrows ONLY on PC (lg+) */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByOneView(-1)}
            disabled={!canScroll}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white/85 hover:bg-white/10 transition disabled:opacity-40 disabled:hover:bg-white/5"
            aria-label="Scroll left"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollByOneView(1)}
            disabled={!canScroll}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white/85 hover:bg-white/10 transition disabled:opacity-40 disabled:hover:bg-white/5"
            aria-label="Scroll right"
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="mt-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex gap-3">
          {items.map((x) => (
            <Link
              key={x.id ?? x.slug}
              href={`/shop/keychains/${encodeURIComponent(x.slug)}`}
              className="
                group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-2
                shrink-0 snap-start
                w-36 sm:w-40 md:w-44
                lg:w-48 xl:w-52
              "
            >
              {/* ✅ Make image smaller (~1.25x) by padding inside the square */}
              <div className="aspect-square rounded-2xl border border-white/10 bg-black/20 p-2">
                <div className="relative h-full w-full overflow-hidden rounded-xl">
                  <Image
                    src={x.image}
                    alt={x.name}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
              </div>

              <div className="mt-2 text-center text-white/85 text-xs sm:text-sm font-semibold leading-tight line-clamp-1">
                {x.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
