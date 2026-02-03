"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Ubuntu } from "next/font/google";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

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
            Creative Dimensions{" "}
            <span className="text-white text-[12px] font-semibold tracking-wide">
              beta
            </span>
          </Link>

          <div className="flex items-center gap-8 text-sm">
            <Link href="/about" className="text-white hover:opacity-70 transition">
              About
            </Link>
            <Link href="/shop" className="text-white hover:opacity-70 transition">
              Shop
            </Link>
            <Link
              href="/contact"
              className="text-white hover:opacity-70 transition"
            >
              Contact
            </Link>

            {/* Auth only (links live inside UserButton menu) */}
            <AuthButtons />
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 md:hidden transition-all duration-200 ${
          scrolled || open
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
            Creative Dimensions{" "}
            <span className="text-white text-[11px] font-semibold tracking-wide">
              beta
            </span>
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
            <Link
              href="/about"
              onClick={() => setOpen(false)}
              className="text-white hover:opacity-70 transition"
            >
              About
            </Link>
            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className="text-white hover:opacity-70 transition"
            >
              Shop
            </Link>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="text-white hover:opacity-70 transition"
            >
              Contact
            </Link>

            {/* Auth only (links live inside UserButton menu) */}
            <AuthButtons />
          </div>
        </div>
      </nav>
    </>
  );
}

export function AuthButtons() {
  return (
    <div className="flex items-center gap-3">
      <SignedOut>
        <SignInButton mode="modal">
          <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white hover:bg-white/10 transition">
            Sign in
          </button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
            <div className="relative group">
              <UserButton afterSignOutUrl="/" />

              {/* Custom menu (ours), shows on hover */}
              <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#0D0D0D]/80 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.35)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                <Link
                  href="/account"
                  className="block px-4 py-3 text-sm text-white/90 hover:bg-white/5 transition"
                >
                  My account
                </Link>
                <Link
                  href="/orders"
                  className="block px-4 py-3 text-sm text-white/90 hover:bg-white/5 transition"
                >
                  My orders
                </Link>
                <Link
                  href="/request-custom"
                  className="block px-4 py-3 text-sm text-white/90 hover:bg-white/5 transition"
                >
                  Request custom
                </Link>
                <Link
                  href="/admin"
                  className="block px-4 py-3 text-sm text-white/90 hover:bg-white/5 transition"
                >
                  Admin
                </Link>
              </div>
            </div>
            
          </SignedIn>

    </div>
  );
}
