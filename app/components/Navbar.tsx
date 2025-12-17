"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Ubuntu } from "next/font/google";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* PC Nav (lg and up) */}
      <nav
          className={`fixed inset-x-0 top-0 z-20 hidden lg:block transition-all duration-200 ${
            scrolled
              ? "bg-white/5 border-b border-white/10 backdrop-blur-xs backdrop-saturate-150 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
              : "bg-transparent border-b border-transparent shadow-none"
          }`}
          >
          <div className="max-w-8xl mx-auto px-20 py-4 flex items-center justify-between">
            <Link
              href="/"
              className={`${ubuntu.className} text-[30px] font-semibold tracking-tight
                bg-gradient-to-r from-[#FF8B64] to-[#3BC7C4]
                hover:from-[#3BC7C4] hover:to-[#FF8B64]
                bg-clip-text text-transparent transition`}
            >
              Creative Dimensions
            </Link>

            <div className="flex gap-8 text-sm">
              <Link href="/about" className="text-white hover:opacity-70 transition">About</Link>
              <Link href="/shop" className="text-white hover:opacity-70 transition">Shop</Link>
              <Link href="/contact" className="text-white hover:opacity-70 transition">Contact</Link>
            </div>
          </div>
      </nav>

      {/* Mobile Nav */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 md:hidden transition-all duration-200 ${
          scrolled
            ? "bg-[#0D0D0D]/10 border border-white/10 backdrop-blur-xs backdrop-saturate-150 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
            : "bg-transparent border border-transparent shadow-none"
        }`}
      >
        <div className="px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className={`${ubuntu.className} font-semibold tracking-tight
              bg-gradient-to-r from-[#FF8B64] to-[#3BC7C4]
              bg-clip-text text-transparent transition text-lg`}
          >
            Creative Dimensions
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="text-white p-2 rounded-lg border border-white/10 hover:border-white/20 transition"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div id="mobile-menu" className={open ? "block" : "hidden"}>
          <div className="px-4 py-3 flex flex-col items-center justify-center gap-3 text-sm border-t border-white/10">
            <Link href="/about" onClick={() => setOpen(false)} className="text-white hover:opacity-70 transition">
              About
            </Link>
            <Link href="/shop" onClick={() => setOpen(false)} className="text-white hover:opacity-70 transition">
              Shop
            </Link>
            <Link href="/contact" onClick={() => setOpen(false)} className="text-white hover:opacity-70 transition">
              Contact
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
