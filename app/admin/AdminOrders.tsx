"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { openInvoiceWindow } from "@/app/lib/invoiceWindow";

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
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPriceUSD: number;
    lineTotalUSD: number;
  }>;
  invoice: {
    invoiceNumber: string;
    issuedAt: string;
    paymentStatus: string;
  };
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

const ORDER_STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

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

async function safeReadJson<T>(res: Response): Promise<T | null> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) return null;
  return (await res.json().catch(() => null)) as T | null;
}

export default function AdminOrders() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [metrics, setMetrics] = useState<OrdersResponse["metrics"] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | (typeof ORDER_STATUS_OPTIONS)[number]>(
    "all"
  );
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [inspectOrderId, setInspectOrderId] = useState("");

  function recalcMetrics(nextOrders: AdminOrder[]) {
    const totalOrders = nextOrders.length;
    const pendingOrders = nextOrders.filter((x) => x.status.toLowerCase() === "pending").length;
    const revenueUSD = nextOrders.reduce((sum, x) => sum + x.totalUSD, 0);
    setMetrics({ totalOrders, pendingOrders, revenueUSD });
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = await safeReadJson<OrdersResponse | { error?: string }>(res);
      if (!res.ok) {
        const message =
          data && "error" in data
            ? data.error || "Failed to load"
            : "Failed to load admin orders.";
        throw new Error(message);
      }
      if (!data || !("orders" in data)) {
        throw new Error("Invalid response returned by /api/admin/orders.");
      }
      const parsed = data as OrdersResponse;
      setMetrics(parsed.metrics);
      setOrders(parsed.orders ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateOrderStatus(orderId: string, userId: string, status: string) {
    setError("");
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, orderId, status }),
      });
      const data = await safeReadJson<{ error?: string }>(res);
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update order status");
      }
      let nextOrders: AdminOrder[] = [];
      setOrders((prev) => {
        nextOrders = prev.map((x) => (x.id === orderId ? { ...x, status } : x));
        return nextOrders;
      });
      recalcMetrics(nextOrders);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update order status");
    } finally {
      setUpdatingOrderId("");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byStatus =
      statusFilter === "all"
        ? orders
        : orders.filter((o) => o.status.toLowerCase() === statusFilter);
    if (!q) return byStatus;
    return byStatus.filter((o) => {
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
  }, [orders, search, statusFilter]);

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
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as "all" | (typeof ORDER_STATUS_OPTIONS)[number]
              )
            }
            className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#FF8B64]"
          >
            <option value="all" className="bg-[#1b1b1b]">
              All statuses
            </option>
            {ORDER_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status} className="bg-[#1b1b1b]">
                {status}
              </option>
            ))}
          </select>
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
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="text-white/85">
              {!loading &&
                filtered.map((o) => (
                  <Fragment key={o.id}>
                    <tr className="border-b border-white/10">
                      <td className="px-4 py-3">
                        <div className="font-medium">{o.orderNumber || o.id}</div>
                        <div className="text-xs text-white/60">{formatDate(o.createdAt)}</div>
                        <div className="mt-2">
                          <label className="sr-only" htmlFor={`status-${o.id}`}>
                            Order status
                          </label>
                          <select
                            id={`status-${o.id}`}
                            value={
                              ORDER_STATUS_OPTIONS.includes(
                                o.status as (typeof ORDER_STATUS_OPTIONS)[number]
                              )
                                ? o.status
                                : "pending"
                            }
                            onChange={(e) =>
                              void updateOrderStatus(o.id, o.user.id, e.target.value)
                            }
                            disabled={updatingOrderId === o.id}
                            className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-[11px] text-white outline-none focus:border-[#FF8B64] disabled:opacity-60"
                          >
                            {ORDER_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status} className="bg-[#1b1b1b]">
                                {status}
                              </option>
                            ))}
                          </select>
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
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            setInspectOrderId((curr) => (curr === o.id ? "" : o.id))
                          }
                          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 transition"
                        >
                          {inspectOrderId === o.id ? "Hide" : "Inspect"}
                        </button>
                      </td>
                    </tr>

                    {inspectOrderId === o.id && (
                      <tr className="border-b border-white/10 last:border-b-0">
                        <td colSpan={6} className="px-4 pb-4">
                          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="text-white/90">
                                Invoice:{" "}
                                <span className="font-semibold">
                                  {o.invoice?.invoiceNumber || "Pending"}
                                </span>
                              </div>
                              <div className="text-white/70">
                                Issued: {formatDate(o.invoice?.issuedAt || o.createdAt)}
                              </div>
                              <div className="text-white/70 capitalize">
                                Payment: {o.invoice?.paymentStatus || "pending"}
                              </div>
                              <button
                                type="button"
                                aria-label="Print invoice"
                                onClick={() =>
                                  openInvoiceWindow(
                                    `/invoice/${encodeURIComponent(o.id)}?userId=${encodeURIComponent(
                                      o.user.id
                                    )}`
                                  )
                                }
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/15 bg-white/5 text-white/85 hover:bg-white/10 transition"
                              >
                                <Printer size={13} />
                              </button>
                            </div>
                            <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white/80">
                              <div className="flex items-center justify-between gap-2 py-1">
                                <span className="text-white/70">
                                  Items preview hidden
                                </span>
                                <span className="font-semibold text-white">
                                  {formatMoney(o.totalUSD)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/60">
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
