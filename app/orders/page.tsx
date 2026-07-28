"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";
import { openInvoiceWindow } from "@/app/lib/invoiceWindow";
import AuthModal from "../components/AuthModal";
import { authFetch, useSupabaseAuth } from "@/app/lib/supabase/auth-client";

type OrderRecord = {
  id: string;
  orderNumber?: string;
  status: string;
  createdAt: string;
  subtotalUSD: number;
  shippingUSD: number;
  totalUSD: number;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPriceUSD: number;
    lineTotalUSD: number;
    customizationSummary?: string;
  }>;
  address?: {
    fullName?: string;
    line1?: string;
    city?: string;
    state?: string;
  };
  invoice?: {
    invoiceNumber?: string;
    issuedAt?: string;
    paymentStatus?: string;
  };
  trackingHistory?: Array<{
    status?: string;
    at?: string;
    note?: string;
  }>;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
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

  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {!isSignedIn ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-10 text-center">
            <h1 className="text-3xl font-semibold text-white">My Orders</h1>
            <p className="mt-2 text-white/70">Sign in to view your orders.</p>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="rounded-xl bg-[#FF8B64] px-5 py-2.5 font-medium text-black hover:opacity-90 transition"
              >
                Sign in
              </button>
            </div>
          </section>
        ) : (

        <>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <h1 className="text-3xl font-semibold text-white">My Orders</h1>
            <p className="mt-2 text-white/70">Track your recent checkout activity.</p>
          </section>

          {loading ? (
            <section className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
              Loading orders...
            </section>
          ) : orders.length === 0 ? (
            <section className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-white/70">No orders yet.</p>
              <Link
                href="/shop"
                className="mt-4 inline-flex rounded-xl bg-[#FF8B64] px-5 py-2.5 font-medium text-black hover:opacity-90 transition"
              >
                Start shopping
              </Link>
            </section>
          ) : (
            <section className="mt-5 space-y-3">
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-white font-semibold">
                        {order.orderNumber || order.id}
                      </p>
                      <p className="text-xs text-white/60">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="rounded-full border border-white/15 px-2 py-1 text-xs text-white/75">
                      {order.status}
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-white/80 space-y-1">
                    {order.items.map((item) => (
                      <div key={`${order.id}-${item.productId}`} className="flex justify-between gap-2">
                        <span className="truncate">
                          {item.name} x{item.quantity}
                          {item.customizationSummary ? (
                            <span className="block text-[11px] text-[#FFB9A3]">
                              {item.customizationSummary}
                            </span>
                          ) : null}
                        </span>
                        <span>{formatMoney(item.lineTotalUSD)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 h-px bg-white/10" />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-white/80">
                    <div>
                      <span>Total: </span>
                      <span className="font-semibold text-white">{formatMoney(order.totalUSD)}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 text-xs text-white/65">
                      <span>Invoice: {order.invoice?.invoiceNumber || "Pending"}</span>
                      <button
                        type="button"
                        aria-label="Print invoice"
                        onClick={() =>
                          openInvoiceWindow(`/invoice/${encodeURIComponent(order.id)}`)
                        }
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 transition"
                      >
                        <Printer size={12} />
                      </button>
                    </div>
                  </div>

                  {Array.isArray(order.trackingHistory) && order.trackingHistory.length > 0 && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs text-white/60">Tracking</div>
                      <div className="mt-2 text-xs text-white/75 space-y-1">
                        {[...order.trackingHistory]
                          .slice(-3)
                          .reverse()
                          .map((event, index) => (
                            <div key={`${order.id}-track-${index}`} className="flex items-center justify-between gap-2">
                              <span className="capitalize">{event.status || "update"}</span>
                              <span>{event.at ? formatDate(event.at) : "N/A"}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/orders/${order.id}`}
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 transition"
                    >
                      View invoice
                    </Link>
                    <Link
                      href={`/orders/${order.id}`}
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 transition"
                    >
                      Track order
                    </Link>
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
        )}

        <Footer />
      </main>
    </div>
  );
}
