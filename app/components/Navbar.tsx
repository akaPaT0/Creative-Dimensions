"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, ShoppingCart, X } from "lucide-react";
import { Ubuntu } from "next/font/google";

import CustomRequestModal, { openCustomRequest } from "./CustomRequestModal";
import AdminShortcutFab from "./AdminShortcutFab";
import AuthModal from "./AuthModal";
import { useSupabaseAuth } from "@/app/lib/supabase/auth-client";

const CART_STORAGE_KEY = "cd_cart_v1";
const CART_UPDATED_EVENT = "cd-cart-updated";

function parseCartCount(raw: string | null) {
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return 0;
    return parsed.reduce((sum, item) => {
      if (!item || typeof item !== "object") return sum;
      const row = item as Record<string, unknown>;
      const qty =
        typeof row.quantity === "number" && Number.isFinite(row.quantity)
          ? Math.max(1, Math.floor(row.quantity))
          : 1;
      return sum + qty;
    }, 0);
  } catch {
    return 0;
  }
}

function readCartCount() {
  if (typeof window === "undefined") return 0;
  return parseCartCount(window.localStorage.getItem(CART_STORAGE_KEY));
}

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sync = () => setCartCount(readCartCount());
    sync();

    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== CART_STORAGE_KEY) return;
      sync();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(CART_UPDATED_EVENT, sync as EventListener);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CART_UPDATED_EVENT, sync as EventListener);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return (
    <>
      {/* Hidden instance used by menu shortcuts */}
      <CustomRequestModal
        hideButton
        productName="Custom Order"
        productUrl="https://creativedimensionslb.com"
      />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
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
              bg-clip-text text-transparent transition px-1 py-0.5 inline-flex items-center`}
          >
            Creative Dimensions{" "}
            <span className="text-white text-[12px] font-semibold tracking-wide ml-1.5">
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
            <Link
              href="/cart"
              aria-label="Open cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10 transition"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#FF8B64] px-1 text-[10px] font-semibold text-black">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            <AuthButtons
              cartCount={cartCount}
              onSignIn={() => setAuthOpen(true)}
            />
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 lg:hidden w-full max-w-full transition-all duration-200 ${
          scrolled || open
            ? "bg-[#0D0D0D]/90 border-b border-white/10 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
            : "bg-transparent border-b border-transparent shadow-none"
        }`}
      >
        <div className="mx-auto w-full px-4 py-3.5 flex items-center justify-between gap-3">
          <Link
            href="/"
            className={`${ubuntu.className} font-semibold tracking-tight
              bg-gradient-to-r from-[#FF8B64] to-[#3BC7C4]
              bg-clip-text text-transparent transition text-base sm:text-lg truncate shrink min-w-0 px-1 py-0.5 inline-flex items-center`}
          >
            Creative Dimensions{" "}
            <span className="text-white text-[10px] sm:text-[11px] font-semibold tracking-wide ml-1">
              beta
            </span>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/cart"
              aria-label="Open cart"
              className="relative text-white p-2 rounded-lg border border-white/10 hover:border-white/20 transition shrink-0"
            >
              <ShoppingCart size={19} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#FF8B64] px-1 text-[10px] font-semibold text-black">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              suppressHydrationWarning
              className="text-white p-2 rounded-lg border border-white/10 hover:border-white/20 transition shrink-0"
            >
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        <div id="mobile-menu" className={open ? "block" : "hidden"}>
          <div className="px-4 pt-3 pb-4 border-t border-white/10">
            <MobileMenuContent
              cartCount={cartCount}
              onClose={() => setOpen(false)}
              onSignIn={() => setAuthOpen(true)}
            />
          </div>
        </div>
      </nav>

      <AdminShortcutFab />
    </>
  );
}

function MobileMenuContent({
  cartCount,
  onClose,
  onSignIn,
}: {
  cartCount: number;
  onClose?: () => void;
  onSignIn: () => void;
}) {
  const { user, isLoaded, isSignedIn, signOut } = useSupabaseAuth();

  const name =
    (typeof user?.user_metadata?.first_name === "string" && user.user_metadata.first_name) ||
    (typeof user?.user_metadata?.name === "string" && user.user_metadata.name) ||
    user?.email?.split("@")[0] ||
    "Account";

  const isAdmin =
    user?.email?.trim().toLowerCase() ===
    process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase();

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
          {isLoaded && typeof user?.user_metadata?.avatar_url === "string" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.user_metadata.avatar_url}
              alt="Account"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="h-full w-full rounded-full bg-white/10" />
          )}
        </div>

        <div className="flex flex-col">
          <span className="text-white text-sm font-medium leading-tight">
            {isSignedIn ? name : "Guest"}
          </span>
          <span className="text-white/60 text-xs leading-tight">
            {isSignedIn ? "Signed in" : "Sign in to access your account"}
          </span>
        </div>
      </div>

      {/* Everything same gap + same shape */}
      <div className="mt-3 flex flex-col gap-2">
        {!isSignedIn && (
          <>
            <button
              type="button"
              onClick={() => {
                onClose?.();
                onSignIn();
              }}
              className={itemClass}
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={() => {
                onClose?.();
                openCustomRequest({
                  productName: "Custom Order",
                  productUrl: "https://creativedimensionslb.com",
                });
              }}
              className={itemClass}
            >
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
          </>
        )}

        {isSignedIn && (
            <>
              <Link href="/user" onClick={onClose} className={itemClass}>
                My account
              </Link>
              <Link
                href="/cart"
                onClick={onClose}
                className={`${itemClass} relative`}
              >
                <span className="inline-block w-full text-center">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute right-3 top-1/2 inline-flex min-w-[20px] -translate-y-1/2 items-center justify-center rounded-full bg-[#FF8B64] px-1.5 text-xs font-semibold text-black">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
              <Link href="/orders" onClick={onClose} className={itemClass}>
                Track orders
              </Link>

              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  openCustomRequest({
                    productName: "Custom Order",
                    productUrl: "https://creativedimensionslb.com",
                  });
                }}
                className={itemClass}
              >
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
                  void signOut();
                }}
                className={itemClass}
              >
                Sign out
              </button>
            </>
        )}
      </div>
    </div>
  );
}

function AuthButtons({
  cartCount,
  onSignIn,
}: {
  cartCount: number;
  onSignIn: () => void;
}) {
  const { signOut, user, isLoaded, isSignedIn } = useSupabaseAuth();

  const isAdmin =
    user?.email?.trim().toLowerCase() ===
    process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase();

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
      {!isSignedIn && (
        <button
          type="button"
          onClick={onSignIn}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white hover:bg-white/10 transition"
        >
          Sign in
        </button>
      )}

      {isSignedIn && (
        <div ref={wrapRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Account menu"
            className="h-10 w-10 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition overflow-hidden flex items-center justify-center"
          >
            {isLoaded && typeof user?.user_metadata?.avatar_url === "string" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url}
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
                href="/cart"
                onClick={close}
                className="relative block px-4 py-3 text-sm text-white/90 hover:bg-white/5 transition"
              >
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="absolute right-3 top-1/2 inline-flex min-w-[20px] -translate-y-1/2 items-center justify-center rounded-full bg-[#FF8B64] px-1.5 text-xs font-semibold text-black">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>

              <Link
                href="/orders"
                onClick={close}
                className="block px-4 py-3 text-sm text-white/90 hover:bg-white/5 transition"
              >
                Track orders
              </Link>

              <button
                type="button"
                onClick={() => {
                  close();
                  openCustomRequest({
                    productName: "Custom Order",
                    productUrl: "https://creativedimensionslb.com",
                  });
                }}
                className="block w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/5 transition"
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
                  void signOut();
                }}
                className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
