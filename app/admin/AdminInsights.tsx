"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState, StatStrip, ui } from "./ui";
import { ChevronRight, RefreshCw, Search } from "lucide-react";

type Metrics = {
  totalUsers: number;
  activeLast7d: number;
  totalSessions: number;
  yourSessions: number;
};

type AdminUserRow = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  lastSignInAt: string | null;
  createdAt: string | null;
};

type AnalyticsResponse = {
  ok: boolean;
  metrics: Metrics;
  users: AdminUserRow[];
};

function formatDate(value: string | null) {
  if (!value) return "Never";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default function AdminInsights() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics", { cache: "no-store" });
      const data = (await res.json()) as AnalyticsResponse | { error?: string };
      if (!res.ok) {
        const message = "error" in data ? data.error || "Failed to load" : "Failed to load";
        throw new Error(message);
      }
      const parsed = data as AnalyticsResponse;
      setMetrics(parsed.metrics);
      setUsers(parsed.users);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const [q, setQ] = useState("");
  const shown = users.filter((u) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return `${u.fullName} ${u.email} ${u.username}`.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-4">
      <StatStrip
        items={[
          { label: "Accounts", value: loading || !metrics ? "–" : metrics.totalUsers },
          { label: "Active this week", value: loading || !metrics ? "–" : metrics.activeLast7d, accent: true },
          { label: "Sessions", value: loading || !metrics ? "–" : metrics.totalSessions },
          { label: "Your sessions", value: loading || !metrics ? "–" : metrics.yourSessions },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email or username"
            className={`${ui.input} pl-10`}
          />
        </div>
        <button type="button" onClick={() => void load()} className={ui.btn} disabled={loading}>
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {error && <p className={ui.error}>{error}</p>}

      <div className={`${ui.panel} overflow-hidden`}>
        {loading && (
          <div className="divide-y divide-white/[0.06]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <div className="h-9 w-9 animate-pulse rounded-full bg-white/[0.06]" />
                <div className="h-4 flex-1 animate-pulse rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        )}

        {!loading && shown.length === 0 && <EmptyState title="No customers found" />}

        {!loading && shown.length > 0 && (
          <ul className="divide-y divide-white/[0.06]">
            {shown.map((u) => {
              const initials =
                (u.fullName || u.email || "?")
                  .split(/\s+/)
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "?";
              return (
                <li key={u.id}>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="group grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-white/[0.02] sm:grid-cols-[36px_minmax(0,1.2fr)_minmax(0,1fr)_150px_120px_16px] sm:gap-x-4 sm:px-5"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF8B64]/12 text-xs font-bold text-[#FF8B64]">
                      {initials}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white group-hover:text-[#FF8B64] transition-colors">
                        {u.fullName || "No name"}
                      </span>
                      <span className="block truncate text-xs text-white/40">
                        {u.username ? `@${u.username}` : u.email || "–"}
                      </span>
                    </span>
                    <span className="hidden truncate text-sm text-white/60 sm:block">{u.email || "–"}</span>
                    <span className="hidden text-xs text-white/50 sm:block">
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Last sign-in</span>
                      {formatDate(u.lastSignInAt)}
                    </span>
                    <span className="hidden text-xs text-white/50 sm:block">
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">Joined</span>
                      {formatDate(u.createdAt)}
                    </span>
                    <ChevronRight size={16} className="text-white/25 group-hover:text-white/60 transition-colors" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
