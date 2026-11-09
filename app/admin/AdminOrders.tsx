"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, Phone, Printer, RefreshCw, Search } from "lucide-react";
import { OrderStatusBadge, statusLabel } from "@/app/components/OrderStatus";
import { EmptyState, FilterChips, StatStrip, ui } from "./ui";
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

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) {
      const k = o.status.toLowerCase();
      counts[k] = (counts[k] || 0) + 1;
    }
    return counts;
  }, [orders]);

  const statusValue = (o: AdminOrder) =>
    ORDER_STATUS_OPTIONS.includes(o.status as (typeof ORDER_STATUS_OPTIONS)[number])
      ? o.status
      : "pending";

  return (
    <div className="space-y-4">
      <StatStrip
        items={[
          { label: "Orders", value: loading || !metrics ? "–" : metrics.totalOrders },
          { label: "Waiting", value: loading || !metrics ? "–" : metrics.pendingOrders, accent: !!metrics?.pendingOrders },
          { label: "Revenue", value: loading || !metrics ? "–" : formatMoney(metrics.revenueUSD) },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order, customer, city or promo"
            className={`${ui.input} pl-10`}
          />
        </div>
        <button type="button" onClick={() => void load()} className={ui.btn} disabled={loading}>
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <FilterChips
        value={statusFilter}
        onChange={setStatusFilter}
        options={[
          { value: "all" as const, label: "All", count: orders.length },
          ...ORDER_STATUS_OPTIONS.filter((s) => statusCounts[s] || statusFilter === s).map((s) => ({
            value: s,
            label: statusLabel(s),
            count: statusCounts[s] || 0,
          })),
        ]}
      />

      {error && <p className={ui.error}>{error}</p>}

      <div className={`${ui.panel} overflow-hidden`}>
        {loading && (
          <div className="divide-y divide-white/[0.06]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4">
                <div className="h-4 w-24 animate-pulse rounded bg-white/[0.06]" />
                <div className="h-4 flex-1 animate-pulse rounded bg-white/[0.04]" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-white/[0.06]" />
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <EmptyState
            title={orders.length === 0 ? "No orders yet" : "No orders match"}
            hint={orders.length === 0 ? "New orders show up here as soon as they are placed." : "Try another status or search."}
          />
        )}

        {!loading && filtered.length > 0 && (
          <ul className="divide-y divide-white/[0.06]">
            {filtered.map((o) => {
              const open = inspectOrderId === o.id;
              return (
                <li key={o.id} className={open ? "bg-white/[0.02]" : ""}>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto_auto_auto] sm:px-5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{o.orderNumber || o.id}</p>
                      <p className="text-xs text-white/40">{formatDate(o.createdAt)}</p>
                    </div>

                    <div className="order-3 col-span-2 min-w-0 sm:order-none sm:col-span-1">
                      <Link
                        href={`/admin/users/${o.user.id}`}
                        className="block truncate text-sm font-medium text-white/85 hover:text-[#FF8B64] transition-colors"
                      >
                        {o.user.fullName || o.address.fullName || "Customer"}
                      </Link>
                      <p className="truncate text-xs text-white/40">
                        {o.itemsCount} {o.itemsCount === 1 ? "item" : "items"}
                        {o.address.city ? ` · ${o.address.city}` : ""}
                        {o.promoCode ? ` · ${o.promoCode}` : ""}
                      </p>
                    </div>

                    <p className="text-right text-sm font-bold tabular-nums text-white">
                      {formatMoney(o.totalUSD)}
                    </p>

                    <div className="order-4 flex items-center sm:order-none">
                      <label className="sr-only" htmlFor={`status-${o.id}`}>
                        Order status for {o.orderNumber || o.id}
                      </label>
                      <div className="relative">
                        <select
                          id={`status-${o.id}`}
                          value={statusValue(o)}
                          onChange={(e) => void updateOrderStatus(o.id, o.user.id, e.target.value)}
                          disabled={updatingOrderId === o.id}
                          className="absolute inset-0 w-full cursor-pointer opacity-0 disabled:cursor-wait"
                        >
                          {ORDER_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {statusLabel(status)}
                            </option>
                          ))}
                        </select>
                        <span className={`pointer-events-none inline-flex items-center gap-1 ${updatingOrderId === o.id ? "opacity-50" : ""}`}>
                          <OrderStatusBadge status={o.status} />
                          <ChevronDown size={14} className="text-white/40" aria-hidden="true" />
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectOrderId((curr) => (curr === o.id ? "" : o.id))}
                      aria-expanded={open}
                      className="order-5 inline-flex items-center justify-end gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-white/55 hover:bg-white/[0.05] hover:text-white transition sm:order-none"
                    >
                      {open ? "Hide" : "Details"}
                      <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>
                  </div>

                  {open && (
                    <div className="grid gap-3 px-4 pb-5 sm:px-5 lg:grid-cols-[1.4fr_1fr_1fr]">
                      <section className={`${ui.inset} p-4`}>
                        <h3 className={ui.label}>Items</h3>
                        <ul className="mt-3 space-y-2">
                          {o.items.map((it, idx) => (
                            <li key={`${it.productId}-${idx}`} className="flex items-baseline justify-between gap-3 text-sm">
                              <span className="min-w-0 text-white/85">
                                <span className="mr-1.5 font-semibold tabular-nums text-[#FF8B64]">{it.quantity}×</span>
                                {it.name}
                              </span>
                              <span className="shrink-0 tabular-nums text-white/60">{formatMoney(it.lineTotalUSD)}</span>
                            </li>
                          ))}
                          {o.items.length === 0 && <li className="text-sm text-white/40">No item details saved.</li>}
                        </ul>
                      </section>

                      <section className={`${ui.inset} p-4 text-sm`}>
                        <h3 className={ui.label}>Delivery</h3>
                        <p className="mt-3 font-semibold text-white/90">{o.address.fullName || "–"}</p>
                        <p className="mt-1 text-white/60 leading-relaxed">
                          {[o.address.line1, o.address.city, o.address.state, o.address.postalCode, o.address.country]
                            .filter(Boolean)
                            .join(", ") || "No address"}
                        </p>
                        {o.address.phone && (
                          <a
                            href={`tel:${o.address.phone}`}
                            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF8B64] hover:text-[#ffa282]"
                          >
                            <Phone size={14} aria-hidden="true" />
                            {o.address.phone}
                          </a>
                        )}
                        {o.user.email && <p className="mt-2 truncate text-xs text-white/40">{o.user.email}</p>}
                      </section>

                      <section className={`${ui.inset} p-4 text-sm`}>
                        <h3 className={ui.label}>Payment</h3>
                        <dl className="mt-3 space-y-1.5 tabular-nums">
                          <div className="flex justify-between text-white/60"><dt>Subtotal</dt><dd>{formatMoney(o.subtotalUSD)}</dd></div>
                          {o.discountUSD > 0 && (
                            <div className="flex justify-between text-emerald-300/80">
                              <dt>Discount{o.promoCode ? ` (${o.promoCode})` : ""}</dt>
                              <dd>−{formatMoney(o.discountUSD)}</dd>
                            </div>
                          )}
                          <div className="flex justify-between text-white/60"><dt>Delivery</dt><dd>{formatMoney(o.shippingUSD)}</dd></div>
                          <div className="flex justify-between border-t border-white/[0.06] pt-1.5 font-bold text-white"><dt>Total</dt><dd>{formatMoney(o.totalUSD)}</dd></div>
                        </dl>
                        <div className="mt-4 flex items-center justify-between gap-2">
                          <p className="min-w-0 text-xs text-white/40">
                            <span className="block truncate">{o.invoice?.invoiceNumber || "Invoice pending"}</span>
                            <span className="capitalize">Payment {o.invoice?.paymentStatus || "pending"}</span>
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              openInvoiceWindow(
                                `/invoice/${encodeURIComponent(o.id)}?userId=${encodeURIComponent(o.user.id)}`
                              )
                            }
                            className={ui.btnSm}
                          >
                            <Printer size={13} aria-hidden="true" />
                            Invoice
                          </button>
                        </div>
                      </section>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
