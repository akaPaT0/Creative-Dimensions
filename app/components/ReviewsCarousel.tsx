"use client";

import { useEffect, useRef, useState } from "react";
import { CompactReviewCard } from "./ReviewCard";
import type { PublicReview } from "@/app/lib/reviews";

const SPEED = 32; // pixels per second
const RESUME_AFTER_MS = 2500;

/**
 * Reviews in one row that slowly scroll on their own and loop forever.
 * It pauses while someone hovers, touches, swipes or tabs into it, and
 * stays still for people who ask their device for reduced motion.
 */
export default function ReviewsCarousel({ reviews }: { reviews: PublicReview[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [loop, setLoop] = useState(false);
  const reviewCount = reviews.length;

  // Only repeat the reviews when one copy is wider than the screen.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const check = () => {
      const oneCopy = loop ? el.scrollWidth / 2 : el.scrollWidth;
      setLoop(oneCopy > el.clientWidth + 1);
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [loop, reviews.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !loop) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let last = 0;
    let position = el.scrollLeft;
    let hovering = false;
    let holding = false;
    let focused = false;
    let resumeAt = 0;

    const paused = () => hovering || holding || focused || document.hidden || performance.now() < resumeAt;

    const tick = (now: number) => {
      const dt = last ? Math.min(now - last, 64) / 1000 : 0;
      last = now;
      // One full set of cards: where the repeated first card starts.
      const items = el.children as HTMLCollectionOf<HTMLElement>;
      const half = items[reviewCount] ? items[reviewCount].offsetLeft - items[0].offsetLeft : el.scrollWidth / 2;
      if (paused()) {
        // Follow manual swipes so we carry on from where the person left it.
        position = el.scrollLeft;
      } else {
        position += SPEED * dt;
      }
      if (position >= half) position -= half;
      if (position < 0) position += half;
      if (Math.abs(el.scrollLeft - position) >= 0.5) el.scrollLeft = position;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const pauseAWhile = () => {
      resumeAt = performance.now() + RESUME_AFTER_MS;
    };
    const onEnter = () => (hovering = true);
    const onLeave = () => (hovering = false);
    const onDown = () => (holding = true);
    const onUp = () => {
      holding = false;
      pauseAWhile();
    };
    const onFocusIn = () => (focused = true);
    const onFocusOut = () => (focused = false);

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("pointerup", onUp);
    el.addEventListener("touchend", onUp);
    el.addEventListener("wheel", pauseAWhile, { passive: true });
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("touchstart", onDown);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("touchend", onUp);
      el.removeEventListener("wheel", pauseAWhile);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
    };
  }, [loop, reviewCount]);

  const card = (review: PublicReview, key: string, copy: boolean) => (
    <div
      key={key}
      className="w-[250px] shrink-0 sm:w-[290px]"
      aria-hidden={copy || undefined}
      inert={copy || undefined}
    >
      <CompactReviewCard review={review} />
    </div>
  );

  return (
    <div
      ref={trackRef}
      role="region"
      aria-label="Customer reviews"
      className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0 sm:[mask-image:linear-gradient(to_right,transparent,black_48px,black_calc(100%-48px),transparent)]"
    >
      {reviews.map((review) => card(review, review.id, false))}
      {loop && reviews.map((review) => card(review, `${review.id}-copy`, true))}
    </div>
  );
}
