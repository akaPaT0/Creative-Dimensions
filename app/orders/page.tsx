"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Lock, Package, Printer } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";
import { openInvoiceWindow } from "@/app/lib/invoiceWindow";
import AuthModal from "../components/AuthModal";
import { OrderStatusBadge } from "../components/OrderStatus";
import { authFetch, useSupabaseAuth } from "@/app/lib/supabase/auth-client";

type OrderRecord = {
  id: string;
  orderNumber?: string;
  status: string;
  createdAt: string;
  totalUSD: number;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    lineTotalUSD: number;
    customizationSummary?: string;
  }>;
  invoice?: { invoiceNumber?: string };
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
}

export default function OrdersPage() {
  const { isLoaded, isSignedIn } = useSupabaseAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let alive = true;
    async function load() {
      setLoading(true);
      const res = await authFetch("/api/orders", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { orders?: OrderRecord[] };
      if (!alive) return;
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setLoading(false);
    }
    void load();
    return () => {
      alive = false;
    };
  }, [isLoaded, isSignedIn]);

  const showSkeleton = !isLoaded || (isSignedIn && loading);

  return (
    <div className="relative min-h-screen text-white">
      <Background />
      <Navbar />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <main className="relative z-10 mx-auto w-full max-w-[900px] px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">My orders</h1>
        <p className="mt-1 text-sm text-white/55">Track your orders and get your invoices.</p>

        {showSkeleton ? (
          <div className="mt-6 space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
            ))}
          </div>
        ) : !isSignedIn ? (
          <section className="mt-6 rounded-3xl border border-white/10 bg-[#141417]/90 p-6 text-center sm:p-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FF8B64]/12 text-[#FF8B64]">
              <Lock size={22} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-xl font-bold">Sign in to see your orders</h2>
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="mt-5 rounded-2xl bg-[#FF8B64] px-7 py-3 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition"
            >
              Sign in
            </button>
          </section>
        ) : orders.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-white/10 bg-[#141417]/90 p-6 text-center sm:p-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FF8B64]/12 text-[#FF8B64]">
              <Package size={22} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-xl font-bold">No orders yet</h2>
            <p className="mt-1 text-sm text-white/55">When you place an order, you&rsquo;ll be able to track it here.</p>
            <Link
              href="/shop"
              className="mt-5 inline-flex rounded-2xl bg-[#FF8B64] px-7 py-3 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition"
            >
              Browse the shop
            </Link>
          </section>
        ) : (
          <ul className="mt-6 space-y-3">
            {orders.map((order) => {
              const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <li key={order.id} className="rounded-2xl border border-white/10 bg-[#161619]/90 transition hover:border-white/20">
                  <Link href={`/orders/${encodeURIComponent(order.id)}`} className="block p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold">{order.orderNumber || order.id}</p>
                        <p className="mt-0.5 text-xs text-white/50">
                          {formatDate(order.createdAt)} · {count} {count === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm text-white/70">
                      {order.items
                        .map((item) => `${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ""}`)
                        .join(", ")}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-lg font-extrabold text-[#FF8B64] tabular-nums">{formatMoney(order.totalUSD)}</span>
                      <span className="flex items-center gap-1 text-sm font-semibold text-white/70">
                        Track order <ChevronRight size={16} aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                  <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-2.5 sm:px-5">
                    <span className="text-xs text-white/45">Invoice {order.invoice?.invoiceNumber || "pending"}</span>
                    <button
                      type="button"
                      onClick={() => openInvoiceWindow(`/invoice/${encodeURIComponent(order.id)}`)}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-white/70 hover:bg-white/[0.06] hover:text-white transition"
                    >
                      <Printer size={13} aria-hidden="true" /> Print invoice
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <Footer />
      </main>
    </div>
  );
}
