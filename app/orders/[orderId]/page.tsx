"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Background from "../../components/Background";
import AuthModal from "../../components/AuthModal";
import { authFetch, useSupabaseAuth } from "@/app/lib/supabase/auth-client";

type OrderRecord = {
  id: string;
  orderNumber?: string;
  status: string;
  createdAt: string;
  subtotalUSD: number;
  shippingUSD: number;
  discountUSD?: number;
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
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
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

function formatDate(value?: string) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default function OrderDetailsPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId ?? "";
  const { isLoaded, isSignedIn } = useSupabaseAuth();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !orderId) return;
    let alive = true;
    async function load() {
      setLoading(true);
      const res = await authFetch("/api/orders", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { orders?: OrderRecord[] };
      if (!alive) return;
      const all = Array.isArray(data.orders) ? data.orders : [];
      setOrder(all.find((x) => x.id === orderId) ?? null);
      setLoading(false);
    }
    void load();
    return () => {
      alive = false;
    };
  }, [isLoaded, isSignedIn, orderId]);

  const tracking = useMemo(
    () => [...(order?.trackingHistory ?? [])].sort((a, b) => String(b.at).localeCompare(String(a.at))),
    [order]
  );

  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <main className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {!isSignedIn ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-10 text-center">
            <h1 className="text-3xl font-semibold text-white">Order Tracking</h1>
            <p className="mt-2 text-white/70">Sign in to view your invoice and tracking details.</p>
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-semibold text-white">Order Tracking</h1>
                <p className="mt-2 text-white/70">Invoice and shipment progress for your order.</p>
              </div>
              <Link
                href="/orders"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition"
              >
                Back to orders
              </Link>
            </div>
          </section>

          {loading ? (
            <section className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
              Loading order details...
            </section>
          ) : !order ? (
            <section className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
              Order not found.
            </section>
          ) : (
            <div className="mt-5 grid gap-5 lg:grid-cols-12">
              <section className="lg:col-span-8 rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xl font-semibold text-white">Invoice</h2>
                <div className="mt-3 grid gap-2 text-sm text-white/80 sm:grid-cols-2">
                  <div>Order: {order.orderNumber || order.id}</div>
                  <div>Invoice: {order.invoice?.invoiceNumber || "Pending"}</div>
                  <div>Created: {formatDate(order.createdAt)}</div>
                  <div>Issued: {formatDate(order.invoice?.issuedAt || order.createdAt)}</div>
                  <div className="capitalize">Payment: {order.invoice?.paymentStatus || "pending"}</div>
                  <div className="capitalize">Current status: {order.status}</div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/80">
                  {order.items.map((item) => (
                    <div key={`${order.id}-${item.productId}`} className="flex items-center justify-between gap-2 py-1">
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
                  <div className="my-2 h-px bg-white/10" />
                  <div className="flex items-center justify-between py-0.5">
                    <span>Subtotal</span>
                    <span>{formatMoney(order.subtotalUSD)}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span>Discount</span>
                    <span>-{formatMoney(order.discountUSD || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span>Shipping</span>
                    <span>{formatMoney(order.shippingUSD)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between font-semibold text-white">
                    <span>Total</span>
                    <span>{formatMoney(order.totalUSD)}</span>
                  </div>
                </div>
              </section>

              <aside className="lg:col-span-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xl font-semibold text-white">Tracking</h2>
                <div className="mt-3 space-y-2">
                  {tracking.length > 0 ? (
                    tracking.map((event, idx) => (
                      <div key={`${order.id}-ev-${idx}`} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/80">
                        <div className="capitalize text-white">{event.status || "update"}</div>
                        <div className="mt-1 text-white/60">{formatDate(event.at)}</div>
                        {event.note && <div className="mt-1 text-white/70">{event.note}</div>}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/65">
                      No tracking updates yet.
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/75">
                  <div className="font-medium text-white/90">Shipping to</div>
                  <div className="mt-1">{order.address?.fullName || "-"}</div>
                  <div>{order.address?.line1 || "-"}</div>
                  <div>
                    {order.address?.city || "-"}, {order.address?.state || "-"} {order.address?.postalCode || ""}
                  </div>
                  <div>{order.address?.country || "-"}</div>
                </div>
              </aside>
            </div>
          )}
        </>
        )}

        <Footer />
      </main>
    </div>
  );
}
