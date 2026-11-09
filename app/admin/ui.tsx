// Shared look for the admin area, matching the storefront redesign.
import type { ReactNode } from "react";

export const ui = {
  panel: "rounded-2xl border border-white/10 bg-[#161619]",
  panelPad: "rounded-2xl border border-white/10 bg-[#161619] p-4 sm:p-5",
  inset: "rounded-xl border border-white/10 bg-[#0f0f11]",
  label: "block text-xs font-semibold uppercase tracking-[0.08em] text-white/50",
  input:
    "w-full rounded-xl border border-white/10 bg-[#0f0f11] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#FF8B64]/60 focus:ring-2 focus:ring-[#FF8B64]/15 disabled:opacity-60",
  select:
    "w-full rounded-xl border border-white/10 bg-[#0f0f11] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-[#FF8B64]/60 focus:ring-2 focus:ring-[#FF8B64]/15 disabled:opacity-60 [&>option]:bg-[#161619]",
  file:
    "block w-full text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-[#232326] file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#2c2c30] file:transition",
  btn: "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#232326] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2c2c30] disabled:opacity-50 disabled:cursor-not-allowed",
  btnSm: "inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-[#232326] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2c2c30] disabled:opacity-50 disabled:cursor-not-allowed",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF8B64] px-5 py-2.5 text-sm font-bold text-[#0D0D0D] transition hover:bg-[#ffa282] disabled:opacity-50 disabled:cursor-not-allowed",
  btnDanger:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed",
  btnDangerSm:
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/20 disabled:opacity-50",
  th: "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40",
  td: "px-4 py-3",
  row: "border-t border-white/[0.06] transition-colors hover:bg-white/[0.02]",
  error: "rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200",
  success: "rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200",
  note: "text-xs text-white/40 leading-relaxed",
  mono: "font-mono text-[11px] text-white/40",
};

/** A row of key numbers, separated by thin rules instead of boxed cards. */
export function StatStrip({ items }: { items: { label: string; value: ReactNode; accent?: boolean }[] }) {
  return (
    <dl className={`${ui.panel} grid grid-cols-2 divide-white/[0.06] sm:flex sm:divide-x`}>
      {items.map((it, i) => (
        <div
          key={it.label}
          className={`min-w-0 flex-1 px-4 py-3.5 sm:px-5 ${i > 1 ? "border-t border-white/[0.06] sm:border-t-0" : ""} ${
            i % 2 === 1 ? "border-l border-white/[0.06] sm:border-l-0" : ""
          }`}
        >
          <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40">{it.label}</dt>
          <dd className={`mt-1 text-xl sm:text-2xl font-bold tabular-nums ${it.accent ? "text-[#FF8B64]" : "text-white"}`}>
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Filter pills with optional counts. */
export function FilterChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              on
                ? "border-[#FF8B64]/50 bg-[#FF8B64]/12 text-[#FF8B64]"
                : "border-white/10 bg-[#161619] text-white/60 hover:text-white"
            }`}
          >
            {o.label}
            {typeof o.count === "number" && (
              <span className={`tabular-nums ${on ? "text-[#FF8B64]/80" : "text-white/35"}`}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-sm font-semibold text-white/70">{title}</p>
      {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
    </div>
  );
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <span className={ui.label}>{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className={`mt-1.5 ${ui.note}`}>{hint}</p>}
    </div>
  );
}

/** On/off switch used for New / Featured style flags. */
export function Switch({
  checked,
  onChange,
  label,
  srLabel,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  /** Accessible name when no visible label is shown. */
  srLabel?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ? undefined : srLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center gap-2.5 text-sm text-white/75 disabled:opacity-60"
    >
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? "bg-[#FF8B64]" : "bg-white/15 group-hover:bg-white/20"}`}
        aria-hidden="true"
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}
