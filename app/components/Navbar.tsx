"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Instagram,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Package,
  ShoppingCart,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { Ubuntu } from "next/font/google";

import CustomRequestModal, { openCustomRequest } from "./CustomRequestModal";
import AdminShortcutFab from "./AdminShortcutFab";
import AuthModal from "./AuthModal";
import { useIsAdmin, useSupabaseAuth } from "@/app/lib/supabase/auth-client";

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
  const pathname = usePathname();

  // Close the mobile menu on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Lock page scroll and allow Escape while the mobile menu is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    let last = false;
    const onScroll = () => {
      const next = window.scrollY > 8;
      if (next !== last) {
        last = next;
        setScrolled(next);
      }
    };
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
            Creative Dimensions
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

            <button
              type="button"
              onClick={() =>
                openCustomRequest({
                  productName: "Custom Order",
                  productUrl: "https://creativedimensionslb.com",
                })
              }
              className="rounded-xl bg-[#FF8B64] px-4 py-2 font-semibold text-[#0D0D0D] hover:bg-[#ffa282] transition"
            >
              Get a Quote
            </button>

            <AuthButtons onSignIn={() => setAuthOpen(true)} />
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 lg:hidden transition-all duration-200 ${
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
            Creative Dimensions
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
              aria-label={open ? "Close menu" : "Open menu"}
              suppressHydrationWarning
              className="text-white p-2 rounded-lg border border-white/10 hover:border-white/20 transition shrink-0"
            >
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {/* Mobile menu: full-height sheet under the header */}
        <div
          id="mobile-menu"
          className={`${open ? "block" : "hidden"} h-[calc(100dvh-64px)] overflow-y-auto overscroll-contain border-t border-white/10 bg-[#0D0D0D]`}
        >
          <MobileMenuContent onClose={() => setOpen(false)} onSignIn={() => setAuthOpen(true)} />
        </div>
      </nav>

      <AdminShortcutFab />
    </>
  );
}

const MENU_CATEGORIES = [
  { label: "Keychains", href: "/shop/keychains" },
  { label: "Accessories", href: "/shop/accessories" },
  { label: "Desk Add-Ons", href: "/shop/desk-add-ons" },
  { label: "Fanboys", href: "/shop/fanboys" },
  { label: "New Arrivals", href: "/shop/new-arrivals" },
];

function MobileMenuContent({
  onClose,
  onSignIn,
}: {
  onClose?: () => void;
  onSignIn: () => void;
}) {
  const { user, isLoaded, isSignedIn, signOut } = useSupabaseAuth();

  const name =
    (typeof user?.user_metadata?.username === "string" && user.user_metadata.username.trim()) ||
    (typeof user?.user_metadata?.first_name === "string" && user.user_metadata.first_name.trim()) ||
    (typeof user?.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
    user?.email?.split("@")[0] ||
    "Account";
  const avatar = typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : "";

  const isAdmin = useIsAdmin();

  const row =
    "flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-white/90 hover:bg-white/[0.06] transition";
  const sectionLabel = "px-3 text-[11px] font-semibold uppercase tracking-wider text-white/35";

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col gap-6 px-4 pb-8 pt-4">
      {/* Shop */}
      <section>
        <Link href="/shop" onClick={onClose} className={`${row} text-lg font-bold text-white`}>
          Shop all
          <ChevronRight size={18} className="text-white/40" aria-hidden="true" />
        </Link>
        <div className="mt-2 flex flex-wrap gap-2 px-3">
          {MENU_CATEGORIES.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              onClick={onClose}
              className="rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-1.5 text-sm text-white/80 hover:border-white/25 hover:text-white transition"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={() => {
          onClose?.();
          openCustomRequest({
            productName: "Custom Order",
            productUrl: "https://creativedimensionslb.com",
          });
        }}
        className="w-full rounded-2xl bg-[#FF8B64] px-5 py-3.5 text-center text-base font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition active:scale-[0.99]"
      >
        Get a Quote
      </button>

      <section className="flex flex-col">
        <Link href="/about" onClick={onClose} className={row}>
          About
          <ChevronRight size={16} className="text-white/30" aria-hidden="true" />
        </Link>
        <Link href="/contact" onClick={onClose} className={row}>
          Contact
          <ChevronRight size={16} className="text-white/30" aria-hidden="true" />
        </Link>
      </section>

      {/* Account */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
        <div className={`${sectionLabel} pt-2 pb-1`}>Account</div>
        {isSignedIn ? (
          <>
            <Link href="/user" onClick={onClose} className={`${row} justify-start`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FF8B64]/15 text-sm font-bold text-[#FF8B64]">
                {isLoaded && avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-white">{name}</span>
                <span className="text-xs font-normal text-white/50">My account</span>
              </span>
            </Link>
            <Link href="/orders" onClick={onClose} className={`${row} justify-start`}>
              <Package size={18} className="text-white/50" aria-hidden="true" />
              Track orders
            </Link>
            {isAdmin && (
              <Link href="/admin" onClick={onClose} className={`${row} justify-start`}>
                <LayoutDashboard size={18} className="text-white/50" aria-hidden="true" />
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                onClose?.();
                void signOut();
              }}
              className={`${row} w-full justify-start text-white/60`}
            >
              <LogOut size={18} className="text-white/40" aria-hidden="true" />
              Sign out
            </button>
          </>
        ) : (
          <div className="p-2">
            <p className="text-sm text-white/55">Sign in to track orders and save favourites.</p>
            <button
              type="button"
              onClick={() => {
                onClose?.();
                onSignIn();
              }}
              className="mt-3 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Sign in or create account
            </button>
          </div>
        )}
      </section>

      {/* Socials */}
      <div className="mt-auto flex items-center justify-center gap-3 pt-2">
        <a
          href="https://instagram.com/creativedimensions.lb"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/80 hover:text-white transition"
        >
          <Instagram size={18} />
        </a>
        <a
          href="https://wa.me/96170304007"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/80 hover:text-white transition"
        >
          <MessageCircle size={18} />
        </a>
      </div>
    </div>
  );
}

function AuthButtons({ onSignIn }: { onSignIn: () => void }) {
  const { signOut, user, isLoaded, isSignedIn } = useSupabaseAuth();

  const isAdmin = useIsAdmin();

  const name =
    (typeof user?.user_metadata?.username === "string" && user.user_metadata.username.trim()) ||
    (typeof user?.user_metadata?.first_name === "string" && user.user_metadata.first_name.trim()) ||
    (typeof user?.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
    user?.email?.split("@")[0] ||
    "Account";
  const avatar = isLoaded && typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : "";

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

  const initial = (
    <span className="flex h-full w-full items-center justify-center bg-[#FF8B64]/15 text-sm font-bold text-[#FF8B64]">
      {name.charAt(0).toUpperCase()}
    </span>
  );

  const item =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/85 hover:bg-white/[0.06] hover:text-white transition";

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
            aria-haspopup="menu"
            aria-label="Account menu"
            className={`h-10 w-10 overflow-hidden rounded-full border transition ${
              menuOpen ? "border-[#FF8B64]" : "border-white/15 hover:border-white/30"
            }`}
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#111113]/95 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            >
              <Link
                href="/user"
                onClick={close}
                role="menuitem"
                className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/[0.06] transition"
              >
                <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initial
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">{name}</span>
                  <span className="block truncate text-xs text-white/45">{user?.email}</span>
                </span>
              </Link>

              <div className="my-1 h-px bg-white/[0.08]" />

              <Link href="/user" onClick={close} role="menuitem" className={item}>
                <UserRound size={16} className="text-white/45" aria-hidden="true" /> My account
              </Link>
              <Link href="/orders" onClick={close} role="menuitem" className={item}>
                <Package size={16} className="text-white/45" aria-hidden="true" /> Track orders
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  openCustomRequest({
                    productName: "Custom Order",
                    productUrl: "https://creativedimensionslb.com",
                  });
                }}
                className={item}
              >
                <Sparkles size={16} className="text-[#FF8B64]" aria-hidden="true" /> Get a Quote
              </button>
              {isAdmin && (
                <Link href="/admin" onClick={close} role="menuitem" className={item}>
                  <LayoutDashboard size={16} className="text-white/45" aria-hidden="true" /> Admin
                </Link>
              )}

              <div className="my-1 h-px bg-white/[0.08]" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  void signOut();
                }}
                className={`${item} text-white/60`}
              >
                <LogOut size={16} className="text-white/40" aria-hidden="true" /> Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
