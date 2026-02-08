"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Ubuntu } from "next/font/google";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useClerk,
  useUser,
} from "@clerk/nextjs";

import CustomRequestModal, { openCustomRequest } from "./CustomRequestModal";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export default function Navbar() {
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
      {/* One hidden instance so dropdown can open the same modal */}
      <CustomRequestModal
        hideButton
        productName="Custom Order"
        productUrl="https://creative-dimensions.vercel.app"
      />

      {/* PC Nav */}
      <nav
        className={`fixed inset-x-0 top-0 z-20 hidden lg:block transition-all duration-200 ${
          scrolled
            ? "bg-white/5 border-b border-white/10 backdrop-blur-xs backdrop-saturate-150 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
            : "bg-transparent border-b border-transparent shadow-none"
        }`}
      >
        <div className="mx-auto w-full max-w-[1700px] px-4 sm:px-6 lg:px-10 2xl:px-16 py-4 flex items-center">
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

          <div className="ml-auto flex items-center gap-8 text-sm">
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

            <AuthButtons
              onRequestCustom={() =>
                openCustomRequest({
                  productName: "Custom Order",
                  productUrl: "https://creative-dimensions.vercel.app",
                })
              }
            />
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

        {/* Mobile menu dropdown */}
        <div id="mobile-menu" className={open ? "block" : "hidden"}>
          <div className="px-4 pt-3 pb-4 border-t border-white/10">
            <MobileMenuContent
              onClose={() => setOpen(false)}
              onRequestCustom={() => {
                setOpen(false);
                openCustomRequest({
                  productName: "Custom Order",
                  productUrl: "https://creative-dimensions.vercel.app",
                });
              }}
            />
          </div>
        </div>
      </nav>
    </>
  );
}

function MobileMenuContent({
  onRequestCustom,
  onClose,
}: {
  onRequestCustom?: () => void;
  onClose?: () => void;
}) {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();

  const name =
    user?.firstName ||
    user?.username ||
    user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
    "Account";

  const isAdmin = user?.publicMetadata?.role === "admin";

  // Slightly thinner than full width, centered
  const groupWrapClass = "mx-auto w-full max-w-[320px]";

  // Unified "menu pill" style for ALL items (My account -> Contact)
  const itemClass =
    "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 hover:border-white/25 transition text-center";

  // More visible divider (still subtle)
  const dividerClass = "my-3 h-px w-full bg-white/20";

  return (
    <div className={groupWrapClass}>
      {/* Avatar + name row */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full border border-white/15 bg-white/5 overflow-hidden flex items-center justify-center">
          {isLoaded && user?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.imageUrl}
              alt="Account"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="h-full w-full rounded-full bg-white/10" />
          )}
        </div>

        <div className="flex flex-col">
          <span className="text-white text-sm font-medium leading-tight">
            <SignedIn>{name}</SignedIn>
            <SignedOut>Guest</SignedOut>
          </span>
          <span className="text-white/60 text-xs leading-tight">
            <SignedIn>Signed in</SignedIn>
            <SignedOut>Sign in to access your account</SignedOut>
          </span>
        </div>
      </div>

      {/* Everything same gap + same shape */}
      <div className="mt-3 flex flex-col gap-2">
        <SignedOut>
          <SignInButton mode="modal">
            <button className={itemClass}>Sign in</button>
          </SignInButton>

          <button type="button" onClick={onRequestCustom} className={itemClass}>
            Request custom
          </button>

          <div className={dividerClass} />

          <Link href="/about" onClick={onClose} className={itemClass}>
            About
          </Link>
          <Link href="/shop" onClick={onClose} className={itemClass}>
            Shop
          </Link>
          <Link href="/contact" onClick={onClose} className={itemClass}>
            Contact
          </Link>
        </SignedOut>

        <SignedIn>
          <Link href="/user" onClick={onClose} className={itemClass}>
            My account
          </Link>
          <Link href="/orders" onClick={onClose} className={itemClass}>
            My orders
          </Link>

          <button type="button" onClick={onRequestCustom} className={itemClass}>
            Request custom
          </button>

          {isAdmin && (
            <Link href="/admin" onClick={onClose} className={itemClass}>
              Admin
            </Link>
          )}

          <div className={dividerClass} />

          <Link href="/about" onClick={onClose} className={itemClass}>
            About
          </Link>
          <Link href="/shop" onClick={onClose} className={itemClass}>
            Shop
          </Link>
          <Link href="/contact" onClick={onClose} className={itemClass}>
            Contact
          </Link>

          <button
            type="button"
            onClick={() => {
              onClose?.();
              signOut({ redirectUrl: "/" });
            }}
            className={itemClass}
          >
            Sign out
          </button>
        </SignedIn>
      </div>
    </div>
  );
}

function AuthButtons({ onRequestCustom }: { onRequestCustom?: () => void }) {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();

  const isAdmin = user?.publicMetadata?.role === "admin";

  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setMenuOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

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
        <div ref={wrapRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Account menu"
            className="h-10 w-10 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition overflow-hidden flex items-center justify-center"
          >
            {isLoaded && user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt="Account"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="h-full w-full rounded-full bg-white/10" />
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0D0D0D]/80 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.35)] z-50">
              <Link
                href="/user"
                onClick={close}
                className="block px-4 py-3 text-sm text-white/90 hover:bg-white/5 transition"
              >
                My account
              </Link>

              <Link
                href="/orders"
                onClick={close}
                className="block px-4 py-3 text-sm text-white/90 hover:bg-white/5 transition"
              >
                My orders
              </Link>

              <button
                type="button"
                onClick={() => {
                  close();
                  onRequestCustom?.();
                }}
                className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/5 transition"
              >
                Request custom
              </button>

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={close}
                  className="block px-4 py-3 text-sm text-white/90 hover:bg-white/5 transition"
                >
                  Admin
                </Link>
              )}

              <div className="h-px bg-white/10" />

              <button
                type="button"
                onClick={() => {
                  close();
                  signOut({ redirectUrl: "/" });
                }}
                className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </SignedIn>
    </div>
  );
}
