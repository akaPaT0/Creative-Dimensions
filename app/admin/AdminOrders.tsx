"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AdminOrder = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  subtotalUSD: number;
  shippingUSD: number;
  discountUSD: number;
  totalUSD: number;
  promoCode: string;
  itemsCount: number;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  address: {
    fullName: string;
    phone: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
};

type OrdersResponse = {
  ok: boolean;
  metrics: {
    totalOrders: number;
    pendingOrders: number;
    revenueUSD: number;
  };
  orders: AdminOrder[];
};

function formatDate(value: string) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function AdminOrders() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [metrics, setMetrics] = useState<OrdersResponse["metrics"] | null>(null);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = (await res.json()) as OrdersResponse | { error?: string };
      if (!res.ok) {
        const message = "error" in data ? data.error || "Failed to load" : "Failed to load";
        throw new Error(message);
      }
      const parsed = data as OrdersResponse;
      setMetrics(parsed.metrics);
      setOrders(parsed.orders ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const bag = [
        o.orderNumber,
        o.status,
        o.user.fullName,
        o.user.email,
        o.promoCode,
        o.address.fullName,
        o.address.city,
      ]
        .join(" ")
        .toLowerCase();
      return bag.includes(q);
    });
  }, [orders, search]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-white text-xl font-semibold">Orders Monitor</h2>
          <p className="mt-1 text-sm text-white/60">
            Track all user orders, totals, promo usage, and shipping details.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order, email, promo..."
            className="w-full sm:w-72 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#FF8B64]"
          />
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-200/90">{error}</p>}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/55">Total Orders</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {loading || !metrics ? "-" : metrics.totalOrders}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/55">Pending</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {loading || !metrics ? "-" : metrics.pendingOrders}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3 col-span-2 lg:col-span-1">
          <div className="text-xs text-white/55">Revenue</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {loading || !metrics ? "-" : formatMoney(metrics.revenueUSD)}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 text-sm text-white/60">
          {loading ? "Loading orders..." : `Showing ${filtered.length} order(s)`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-white/60">
              <tr className="border-b border-white/10">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Totals</th>
                <th className="px-4 py-3">Promo</th>
                <th className="px-4 py-3">Address</th>
              </tr>
            </thead>
            <tbody className="text-white/85">
              {!loading &&
                filtered.map((o) => (
                  <tr key={o.id} className="border-b border-white/10 last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.orderNumber || o.id}</div>
                      <div className="text-xs text-white/60">{formatDate(o.createdAt)}</div>
                      <div className="mt-1 inline-flex rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-white/80">
                        {o.status}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${o.user.id}`}
                        className="font-medium hover:underline underline-offset-4"
                      >
                        {o.user.fullName}
                      </Link>
                      <div className="text-xs text-white/60">{o.user.email || "No email"}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/80">
                      <div>Items: {o.itemsCount}</div>
                      <div>Subtotal: {formatMoney(o.subtotalUSD)}</div>
                      <div>Discount: -{formatMoney(o.discountUSD)}</div>
                      <div>Shipping: {formatMoney(o.shippingUSD)}</div>
                      <div className="font-semibold text-white mt-0.5">
                        Total: {formatMoney(o.totalUSD)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/80">{o.promoCode || "-"}</td>
                    <td className="px-4 py-3 text-xs text-white/80">
                      <div>{o.address.fullName || "-"}</div>
                      <div>{o.address.line1 || "-"}</div>
                      <div>
                        {o.address.city || "-"}, {o.address.state || "-"}{" "}
                        {o.address.postalCode || ""}
                      </div>
                      <div>{o.address.country || "-"}</div>
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/60">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
