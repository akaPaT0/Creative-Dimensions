"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const SHOW_AFTER_PX = 700;

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [aboveAdminFab, setAboveAdminFab] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SHOW_AFTER_PX);
      // Admins have a shortcut button in the same corner; sit above it.
      setAboveAdminFab(!!document.querySelector('[aria-label="Open admin shortcuts"]'));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollUp = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollUp}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`fixed right-5 z-[80] inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-[#161619]/90 text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all duration-300 hover:border-[#FF8B64]/60 hover:text-[#FF8B64] ${
        aboveAdminFab ? "bottom-20" : "bottom-5"
      } ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
    >
      <ArrowUp size={20} aria-hidden="true" />
    </button>
  );
}
