"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useUser, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

type InvoicePayload = {
  orderId: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  subtotalUSD: number;
  shippingUSD: number;
  discountUSD: number;
  totalUSD: number;
  customer: {
    fullName: string;
    email: string;
  };
  address: {
    fullName: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPriceUSD: number;
    lineTotalUSD: number;
    customizationSummary?: string;
  }>;
  invoiceMeta: {
    invoiceNumber: string;
    issuedAt: string;
    paymentStatus: string;
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
  if (Number.isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default function InvoicePage() {
  const { isLoaded, isSignedIn } = useUser();
  const params = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const orderId = params?.orderId ?? "";
  const adminUserId = searchParams.get("userId") || "";
  const isAdminView = Boolean(adminUserId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoice, setInvoice] = useState<InvoicePayload | null>(null);

  const endpoint = useMemo(() => {
    if (!orderId) return "";
    if (isAdminView) {
      const q = new URLSearchParams({ userId: adminUserId, orderId });
      return `/api/admin/invoices?${q.toString()}`;
    }
    return `/api/invoices/${encodeURIComponent(orderId)}`;
  }, [orderId, isAdminView, adminUserId]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !endpoint) return;
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          invoice?: InvoicePayload;
        };
        if (!alive) return;
        if (!res.ok) throw new Error(data.error || "Failed to load invoice.");
        if (!data.invoice) throw new Error("Invoice not found.");
        setInvoice(data.invoice);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load invoice.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [endpoint, isLoaded, isSignedIn]);

  return (
    <div className="min-h-screen bg-[#f3f3f3] text-black">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 14mm;
            }
            html,
            body {
              background: #fff !important;
              color: #000 !important;
            }
            .no-print {
              display: none !important;
            }
            .invoice-sheet {
              box-shadow: none !important;
              border: 1px solid #000 !important;
            }
            .invoice-table th,
            .invoice-table td {
              border-color: #000 !important;
              color: #000 !important;
              background: #fff !important;
            }
          }
        `}</style>

        <SignedOut>
          <section className="mx-auto max-w-xl rounded-xl border border-black/20 bg-white p-8 text-center shadow-sm">
            <h1 className="text-3xl font-semibold text-black">Invoice</h1>
            <p className="mt-2 text-black/70">Sign in to view invoice details.</p>
            <div className="mt-6 flex justify-center">
              <SignInButton mode="modal">
                <button className="rounded-lg border border-black px-5 py-2.5 font-medium text-black hover:bg-black hover:text-white transition">
                  Sign in
                </button>
              </SignInButton>
            </div>
          </section>
        </SignedOut>

        <SignedIn>
          <section className="invoice-sheet rounded-xl border border-black/20 bg-white p-5 shadow-sm sm:p-6">
            <div className="no-print mb-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg border border-black px-4 py-2 text-sm font-medium text-black hover:bg-black hover:text-white transition"
              >
                Print
              </button>
            </div>

            {loading ? (
              <div className="rounded-lg border border-black/20 p-6 text-black/70">
                Loading invoice...
              </div>
            ) : error ? (
              <div className="rounded-lg border border-black/20 p-6 text-black">{error}</div>
            ) : invoice ? (
              <>
                <div className="mb-4 flex items-end justify-between border-b border-black pb-3">
                  <div>
                    <h1 className="text-2xl font-bold tracking-wide">INVOICE</h1>
                    <p className="text-sm text-black/70">
                      {isAdminView ? "Admin invoice preview" : "Customer invoice"}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <div>
                      <span className="font-semibold">Invoice #</span>{" "}
                      {invoice.invoiceMeta.invoiceNumber}
                    </div>
                    <div>
                      <span className="font-semibold">Order #</span> {invoice.orderNumber}
                    </div>
                    <div>
                      <span className="font-semibold">Issued</span>{" "}
                      {formatDate(invoice.invoiceMeta.issuedAt)}
                    </div>
                    <div className="capitalize">
                      <span className="font-semibold">Payment</span>{" "}
                      {invoice.invoiceMeta.paymentStatus}
                    </div>
                  </div>
                </div>

                <div className="mb-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-black/30 p-3 text-sm">
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide">Bill To</div>
                    <div className="font-semibold">{invoice.customer.fullName}</div>
                    <div>{invoice.customer.email}</div>
                  </div>
                  <div className="rounded-lg border border-black/30 p-3 text-sm">
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide">Ship To</div>
                    <div>{invoice.address.fullName || "-"}</div>
                    <div>{invoice.address.line1 || "-"}</div>
                    {invoice.address.line2 && <div>{invoice.address.line2}</div>}
                    <div>
                      {invoice.address.city || "-"}, {invoice.address.state || "-"}{" "}
                      {invoice.address.postalCode || ""}
                    </div>
                    <div>{invoice.address.country || "-"}</div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-black/30">
                  <table className="invoice-table w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-black bg-black/5">
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2">Unit</th>
                        <th className="px-3 py-2 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, idx) => (
                        <tr
                          key={`${item.productId}-${idx}`}
                          className="border-b border-black/20 last:border-b-0"
                        >
                          <td className="px-3 py-2">
                            <div>{item.name || item.productId}</div>
                            {item.customizationSummary ? (
                              <div className="text-[11px] text-black/60">{item.customizationSummary}</div>
                            ) : null}
                          </td>
                          <td className="px-3 py-2">{item.quantity}</td>
                          <td className="px-3 py-2">{formatMoney(item.unitPriceUSD)}</td>
                          <td className="px-3 py-2 text-right">{formatMoney(item.lineTotalUSD)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 ml-auto w-full max-w-sm rounded-lg border border-black/30 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>{formatMoney(invoice.subtotalUSD)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span>Discount</span>
                    <span>-{formatMoney(invoice.discountUSD)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span>Shipping</span>
                    <span>{formatMoney(invoice.shippingUSD)}</span>
                  </div>
                  <div className="mt-2 h-px bg-black/30" />
                  <div className="mt-2 flex items-center justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>{formatMoney(invoice.totalUSD)}</span>
                  </div>
                </div>
              </>
            ) : null}
          </section>
        </SignedIn>
      </main>
    </div>
  );
}
