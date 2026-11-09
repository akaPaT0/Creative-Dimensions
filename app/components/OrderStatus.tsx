import { Check, X } from "lucide-react";

const STEPS = [
  { key: "pending", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Printing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
] as const;

const BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: "Placed", className: "border-amber-300/30 bg-amber-300/10 text-amber-200" },
  confirmed: { label: "Confirmed", className: "border-sky-300/30 bg-sky-300/10 text-sky-200" },
  processing: { label: "Printing", className: "border-violet-300/30 bg-violet-300/10 text-violet-200" },
  shipped: { label: "Shipped", className: "border-[#FF8B64]/40 bg-[#FF8B64]/10 text-[#FFB59B]" },
  delivered: { label: "Delivered", className: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" },
  cancelled: { label: "Cancelled", className: "border-red-300/30 bg-red-300/10 text-red-200" },
};

export function statusLabel(status?: string) {
  const key = (status || "").toLowerCase();
  return BADGES[key]?.label ?? (key ? key.charAt(0).toUpperCase() + key.slice(1) : "Update");
}

export function OrderStatusBadge({ status }: { status?: string }) {
  const key = (status || "").toLowerCase();
  const badge = BADGES[key] ?? { label: statusLabel(status), className: "border-white/15 bg-white/5 text-white/75" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
      {badge.label}
    </span>
  );
}

/** Horizontal progress through the order steps. */
export function OrderProgress({ status }: { status?: string }) {
  const key = (status || "").toLowerCase();

  if (key === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        <X size={16} aria-hidden="true" /> This order was cancelled.
      </div>
    );
  }

  const current = Math.max(0, STEPS.findIndex((s) => s.key === key));
  const fill = (current / (STEPS.length - 1)) * 80; // line spans the middle 80%

  return (
    <div className="relative">
      <span className="absolute left-[10%] right-[10%] top-3.5 h-0.5 bg-white/12" aria-hidden="true" />
      <span
        className="absolute left-[10%] top-3.5 h-0.5 bg-[#FF8B64] transition-all"
        style={{ width: `${fill}%` }}
        aria-hidden="true"
      />
      <ol className="relative grid grid-cols-5" aria-label="Order progress">
        {STEPS.map((step, i) => {
          const done = i < current || (i === current && key === "delivered");
          const active = i === current && key !== "delivered";
          return (
            <li key={step.key} className="flex flex-col items-center text-center">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold ${
                  done
                    ? "border-[#FF8B64] bg-[#FF8B64] text-[#0D0D0D]"
                    : active
                      ? "border-[#FF8B64] bg-[#2a1a14] text-[#FF8B64] ring-4 ring-[#FF8B64]/15"
                      : "border-white/20 bg-[#141417] text-white/35"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={`mt-2 text-[10px] sm:text-xs ${
                  active ? "font-semibold text-white" : done ? "text-white/70" : "text-white/35"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
