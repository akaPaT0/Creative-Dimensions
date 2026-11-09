"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, Lock, MapPin, Printer } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Background from "../../components/Background";
import AuthModal from "../../components/AuthModal";
import { OrderProgress, OrderStatusBadge, statusLabel } from "../../components/OrderStatus";
import { openInvoiceWindow } from "@/app/lib/invoiceWindow";
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
    previewImageUrl?: string;
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
  invoice?: { invoiceNumber?: string; issuedAt?: string; paymentStatus?: string };
  trackingHistory?: Array<{ status?: string; at?: string; note?: string }>;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function formatDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export default function OrderDetailsPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId ? decodeURIComponent(params.orderId) : "";
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

  const showSkeleton = !isLoaded || (isSignedIn && loading);
  const card = "rounded-3xl border border-white/10 bg-[#141417]/90 p-4 sm:p-6";

  return (
    <div className="relative min-h-screen text-white">
      <Background />
      <Navbar />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <main className="relative z-10 mx-auto w-full max-w-[1000px] px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16">
        <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-white/55 hover:text-white transition">
          <ChevronLeft size={16} aria-hidden="true" /> My orders
        </Link>

        {showSkeleton ? (
          <div className="mt-4 space-y-4" aria-busy="true">
            <div className="h-10 w-64 animate-pulse rounded-xl bg-white/[0.06]" />
            <div className="h-28 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
            <div className="h-64 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
          </div>
        ) : !isSignedIn ? (
          <section className={`${card} mt-4 text-center`}>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FF8B64]/12 text-[#FF8B64]">
              <Lock size={22} aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-xl font-bold">Sign in to see this order</h1>
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="mt-5 rounded-2xl bg-[#FF8B64] px-7 py-3 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition"
            >
              Sign in
            </button>
          </section>
        ) : !order ? (
          <section className={`${card} mt-4 text-center`}>
            <h1 className="text-xl font-bold">Order not found</h1>
            <p className="mt-1 text-sm text-white/55">It may belong to a different account.</p>
            <Link
              href="/orders"
              className="mt-5 inline-flex rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-2.5 text-sm font-semibold hover:bg-white/10 transition"
            >
              Back to my orders
            </Link>
          </section>
        ) : (
          <>
            <header className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{order.orderNumber || order.id}</h1>
                <p className="mt-1 text-sm text-white/50">Placed {formatDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <OrderStatusBadge status={order.status} />
                <button
                  type="button"
                  onClick={() => openInvoiceWindow(`/invoice/${encodeURIComponent(order.id)}`)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold hover:bg-white/10 transition"
                >
                  <Printer size={13} aria-hidden="true" /> Invoice
                </button>
              </div>
            </header>

            <section className={`${card} mt-5`}>
              <OrderProgress status={order.status} />
            </section>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section className={card}>
                <h2 className="text-lg font-bold">Items</h2>
                <ul className="mt-4 space-y-3">
                  {order.items.map((item, i) => (
                    <li key={`${item.productId}-${i}`} className="flex items-center gap-3">
                      {item.previewImageUrl && !item.previewImageUrl.startsWith("data:") ? (
                        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                          <Image src={item.previewImageUrl} alt="" fill className="object-cover" sizes="56px" />
                        </span>
                      ) : (
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm font-bold text-white/40">
                          ×{item.quantity}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-sm font-semibold">{item.name}</span>
                        <span className="block text-xs text-white/50">
                          {formatMoney(item.unitPriceUSD)} × {item.quantity}
                          {item.customizationSummary ? ` · ${item.customizationSummary}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(item.lineTotalUSD)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
                  <div className="flex justify-between text-white/65">
                    <dt>Subtotal</dt>
                    <dd className="tabular-nums">{formatMoney(order.subtotalUSD)}</dd>
                  </div>
                  {(order.discountUSD || 0) > 0 && (
                    <div className="flex justify-between text-emerald-300">
                      <dt>Discount</dt>
                      <dd className="tabular-nums">−{formatMoney(order.discountUSD || 0)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-white/65">
                    <dt>Delivery</dt>
                    <dd className="tabular-nums">{order.shippingUSD > 0 ? formatMoney(order.shippingUSD) : "Free"}</dd>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3">
                    <dt className="font-semibold">Total</dt>
                    <dd className="text-lg font-extrabold tabular-nums">{formatMoney(order.totalUSD)}</dd>
                  </div>
                </dl>
              </section>

              <div className="space-y-5">
                <section className={card}>
                  <h2 className="flex items-center gap-2 text-sm font-bold">
                    <MapPin size={16} className="text-[#FF8B64]" aria-hidden="true" /> Delivering to
                  </h2>
                  <div className="mt-3 text-sm leading-relaxed text-white/70">
                    <div className="font-semibold text-white">{order.address?.fullName || "-"}</div>
                    {order.address?.phone && <div>{order.address.phone}</div>}
                    <div>
                      {order.address?.line1}
                      {order.address?.line2 ? `, ${order.address.line2}` : ""}
                    </div>
                    <div>
                      {[order.address?.city, order.address?.state, order.address?.postalCode].filter(Boolean).join(", ")}
                    </div>
                    {order.address?.country && <div>{order.address.country}</div>}
                  </div>
                </section>

                <section className={card}>
                  <h2 className="text-sm font-bold">Updates</h2>
                  {tracking.length > 0 ? (
                    <ol className="mt-3 space-y-3 border-l border-white/12 pl-4">
                      {tracking.map((event, idx) => (
                        <li key={idx} className="relative">
                          <span
                            className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ${idx === 0 ? "bg-[#FF8B64]" : "bg-white/25"}`}
                            aria-hidden="true"
                          />
                          <div className={`text-sm ${idx === 0 ? "font-semibold text-white" : "text-white/70"}`}>
                            {statusLabel(event.status)}
                          </div>
                          <div className="text-xs text-white/45">{formatDate(event.at)}</div>
                          {event.note && <div className="mt-0.5 text-xs text-white/60">{event.note}</div>}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="mt-2 text-sm text-white/55">No updates yet.</p>
                  )}
                </section>
              </div>
            </div>
          </>
        )}

        <Footer />
      </main>
    </div>
  );
}
