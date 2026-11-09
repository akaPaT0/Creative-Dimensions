import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Layers, Package, Plus, ShoppingBag, TicketPercent, Users } from "lucide-react";

export type AdminSection = "orders" | "catalog" | "create" | "insights" | "promocodes" | "filaments";

const NAV: { key: AdminSection; label: string; href: string; icon: typeof Package }[] = [
  { key: "orders", label: "Orders", href: "/admin?tab=orders", icon: ShoppingBag },
  { key: "catalog", label: "Products", href: "/admin?tab=catalog", icon: Package },
  { key: "create", label: "Add product", href: "/admin?tab=create", icon: Plus },
  { key: "insights", label: "Customers", href: "/admin?tab=insights", icon: Users },
  { key: "promocodes", label: "Promo codes", href: "/admin?tab=promocodes", icon: TicketPercent },
  { key: "filaments", label: "Filaments", href: "/admin/filaments", icon: Layers },
];

export const SECTION_TITLES: Record<AdminSection, { title: string; blurb: string }> = {
  orders: { title: "Orders", blurb: "Update status, check what was ordered and print invoices." },
  catalog: { title: "Products", blurb: "Flip New and Featured right from the list, or open a product to edit it." },
  create: { title: "Add product", blurb: "Photos first, then the details. The first photo is the cover." },
  insights: { title: "Customers", blurb: "Accounts, sign-ins and activity." },
  promocodes: { title: "Promo codes", blurb: "Create, edit and switch off discount codes." },
  filaments: { title: "Filaments", blurb: "Materials and colours available for custom orders." },
};

export default function AdminShell({
  active,
  email,
  title,
  blurb,
  actions,
  children,
}: {
  active: AdminSection;
  email?: string;
  title?: ReactNode;
  blurb?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const heading = title ?? SECTION_TITLES[active].title;
  const sub = blurb ?? SECTION_TITLES[active].blurb;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white selection:bg-[#FF8B64]/30">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/[0.06] bg-[#111113] lg:flex">
        <Link href="/admin" className="px-5 pt-6 pb-5">
          <span className="block text-[15px] font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FF8B64] to-[#ffd0b5]">
            Creative Dimensions
          </span>
          <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">Admin</span>
        </Link>

        <nav className="flex-1 space-y-0.5 px-3" aria-label="Admin sections">
          {NAV.map(({ key, label, href, icon: Icon }) => {
            const on = key === active;
            return (
              <Link
                key={key}
                href={href}
                aria-current={on ? "page" : undefined}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  on ? "bg-white/[0.06] text-white" : "text-white/55 hover:bg-white/[0.03] hover:text-white"
                }`}
              >
                {on && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[#FF8B64]" aria-hidden="true" />}
                <Icon size={17} className={on ? "text-[#FF8B64]" : ""} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <Link
            href="/"
            className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-white/55 transition hover:bg-white/[0.03] hover:text-white"
          >
            View store
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          {email && <p className="truncate px-3 pt-1 pb-1 text-[11px] text-white/30">{email}</p>}
        </div>
      </aside>

      {/* Top bar + tabs (phones / tablets) */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0D0D0D]/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 pt-3">
          <Link href="/admin" className="text-sm font-bold">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF8B64] to-[#ffd0b5]">Creative Dimensions</span>
            <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Admin</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-white/55 hover:text-white">
            Store <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-2.5 [scrollbar-width:none]" aria-label="Admin sections">
          {NAV.map(({ key, label, href, icon: Icon }) => {
            const on = key === active;
            return (
              <Link
                key={key}
                href={href}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  on ? "bg-[#FF8B64] text-[#0D0D0D]" : "bg-white/[0.05] text-white/60"
                }`}
              >
                <Icon size={14} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="lg:pl-60">
        <div className="mx-auto w-full max-w-[1200px] px-4 pt-6 pb-16 sm:px-6 lg:px-10 lg:pt-10">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{heading}</h1>
              {sub && <p className="mt-1 text-sm text-white/50">{sub}</p>}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
