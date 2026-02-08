"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";

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
  }>;
  address?: {
    fullName?: string;
    line1?: string;
    city?: string;
    state?: string;
  };
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
  const { isLoaded, isSignedIn } = useUser();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let alive = true;
    async function load() {
      setLoading(true);
      const res = await fetch("/api/orders", { cache: "no-store" });
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

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <SignedOut>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-10 text-center">
            <h1 className="text-3xl font-semibold text-white">My Orders</h1>
            <p className="mt-2 text-white/70">Sign in to view your orders.</p>
            <div className="mt-6 flex justify-center">
              <SignInButton mode="modal">
                <button className="rounded-xl bg-[#FF8B64] px-5 py-2.5 font-medium text-black hover:opacity-90 transition">
                  Sign in
                </button>
              </SignInButton>
            </div>
          </section>
        </SignedOut>

        <SignedIn>
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
                        </span>
                        <span>{formatMoney(item.lineTotalUSD)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 h-px bg-white/10" />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-white/80">
                    <span>Total</span>
                    <span className="font-semibold text-white">{formatMoney(order.totalUSD)}</span>
                  </div>
                </article>
              ))}
            </section>
          )}
        </SignedIn>

        <Footer />
      </main>
    </div>
  );
}
