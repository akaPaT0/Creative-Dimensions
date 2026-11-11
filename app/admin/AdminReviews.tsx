"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, EyeOff, RefreshCw, RotateCcw, Star, Trash2 } from "lucide-react";
import { EmptyState, FilterChips, ui } from "./ui";
import type { AdminReview, ReviewStatus } from "@/app/lib/reviews";

type Filter = ReviewStatus | "all";

const STATUS_STYLE: Record<ReviewStatus, string> = {
  pending: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  approved: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  hidden: "border-white/15 bg-white/[0.04] text-white/50",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("pending");
  const [copied, setCopied] = useState(false);
  const [linkProduct, setLinkProduct] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reviews", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { error?: string; reviews?: AdminReview[] };
      if (!res.ok) throw new Error(data.error || "Failed to load reviews");
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(id: string, method: "PATCH" | "DELETE", status?: ReviewStatus) {
    if (method === "DELETE" && !window.confirm("Delete this review for good?")) return;
    setBusyId(id);
    setError("");
    try {
      const res = await fetch("/api/admin/reviews", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not update the review");
      setReviews((list) =>
        method === "DELETE"
          ? list.filter((r) => r.id !== id)
          : list.map((r) => (r.id === id && status ? { ...r, status } : r))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the review");
    } finally {
      setBusyId(null);
    }
  }

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, hidden: 0 };
    reviews.forEach((r) => (c[r.status] += 1));
    return c;
  }, [reviews]);

  const visible = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);

  const shareLink = useMemo(() => {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    const url = new URL("/review", origin || "https://www.creativedimensionslb.com");
    if (linkProduct.trim()) url.searchParams.set("product", linkProduct.trim());
    return url.toString();
  }, [linkProduct]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link:", shareLink);
    }
  }

  const whatsappText = encodeURIComponent(
    `Hi! Thanks for ordering from Creative Dimensions 🙏 If you have a minute, we'd love a quick review: ${shareLink}`
  );

  return (
    <div className="space-y-5">
      <div className={ui.panelPad}>
        <p className="text-sm font-semibold">Link to send clients</p>
        <p className={`mt-1 ${ui.note}`}>
          Optionally fill in what they bought so it&rsquo;s pre-filled for them. New reviews wait here until you approve them.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className={ui.input}
            value={linkProduct}
            onChange={(e) => setLinkProduct(e.target.value)}
            placeholder="Product (optional), e.g. Ghost Candy Bowl"
          />
          <button type="button" onClick={copyLink} className={`${ui.btnPrimary} shrink-0`}>
            {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {copied ? "Copied" : "Copy link"}
          </button>
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${ui.btn} shrink-0`}
          >
            Send on WhatsApp
          </a>
        </div>
        <p className={`mt-2 break-all ${ui.mono}`}>{shareLink}</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <FilterChips<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "pending", label: "Waiting", count: counts.pending },
            { value: "approved", label: "On the site", count: counts.approved },
            { value: "hidden", label: "Hidden", count: counts.hidden },
            { value: "all", label: "All", count: reviews.length },
          ]}
        />
        <button type="button" onClick={() => void load()} className={ui.btnSm} disabled={loading}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} aria-hidden="true" /> Refresh
        </button>
      </div>

      {error && <p className={ui.error}>{error}</p>}

      <div className={ui.panel}>
        {loading && !reviews.length ? (
          <EmptyState title="Loading reviews…" />
        ) : !visible.length ? (
          <EmptyState
            title={filter === "pending" ? "Nothing waiting for approval" : "No reviews here yet"}
            hint="Send clients the link above to start collecting reviews."
          />
        ) : (
          <ul>
            {visible.map((r, i) => (
              <li key={r.id} className={`p-4 sm:p-5 ${i ? "border-t border-white/[0.06]" : ""}`}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={14}
                        strokeWidth={1.5}
                        className={n <= r.rating ? "fill-[#FF8B64] text-[#FF8B64]" : "text-white/20"}
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                  <span className="text-sm font-semibold">{r.name}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLE[r.status]}`}>
                    {r.status === "approved" ? "On the site" : r.status === "pending" ? "Waiting" : "Hidden"}
                  </span>
                  <span className="text-xs text-white/35">{dateFormat.format(new Date(r.createdAt))}</span>
                </div>
                {(r.product || r.orderRef) && (
                  <p className="mt-1 text-xs text-white/45">
                    {r.product}
                    {r.product && r.orderRef ? " · " : ""}
                    {r.orderRef && <span className="font-mono">{r.orderRef}</span>}
                  </p>
                )}
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/80">{r.comment}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status !== "approved" && (
                    <button type="button" className={ui.btnSm} disabled={busyId === r.id} onClick={() => act(r.id, "PATCH", "approved")}>
                      <Check size={13} aria-hidden="true" /> Approve
                    </button>
                  )}
                  {r.status === "approved" && (
                    <button type="button" className={ui.btnSm} disabled={busyId === r.id} onClick={() => act(r.id, "PATCH", "hidden")}>
                      <EyeOff size={13} aria-hidden="true" /> Hide from site
                    </button>
                  )}
                  {r.status === "pending" && (
                    <button type="button" className={ui.btnSm} disabled={busyId === r.id} onClick={() => act(r.id, "PATCH", "hidden")}>
                      <EyeOff size={13} aria-hidden="true" /> Don&rsquo;t publish
                    </button>
                  )}
                  {r.status === "hidden" && (
                    <button type="button" className={ui.btnSm} disabled={busyId === r.id} onClick={() => act(r.id, "PATCH", "pending")}>
                      <RotateCcw size={13} aria-hidden="true" /> Back to waiting
                    </button>
                  )}
                  <button type="button" className={ui.btnDangerSm} disabled={busyId === r.id} onClick={() => act(r.id, "DELETE")}>
                    <Trash2 size={13} aria-hidden="true" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
