"use client";

import { useEffect, useState } from "react";

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

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-white text-xl font-semibold">User Insights</h2>
          <p className="mt-1 text-sm text-white/60">
            Login/session activity and recent user information from Clerk.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
        >
          Refresh
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-200/90">{error}</p>}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/55">Total Users</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {loading || !metrics ? "-" : metrics.totalUsers}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/55">Active (7d)</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {loading || !metrics ? "-" : metrics.activeLast7d}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/55">Total Sessions</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {loading || !metrics ? "-" : metrics.totalSessions}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/55">Your Login Sessions</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {loading || !metrics ? "-" : metrics.yourSessions}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 text-sm text-white/60">
          {loading ? "Loading users..." : `Showing ${users.length} users`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-white/60">
              <tr className="border-b border-white/10">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Last Sign In</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="text-white/85">
              {!loading &&
                users.map((u) => (
                  <tr key={u.id} className="border-b border-white/10 last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.fullName}</div>
                      <div className="text-xs text-white/45 font-mono">{u.id}</div>
                    </td>
                    <td className="px-4 py-3 text-white/80">{u.email || "-"}</td>
                    <td className="px-4 py-3 text-white/80">{u.username || "-"}</td>
                    <td className="px-4 py-3 text-white/80">{formatDate(u.lastSignInAt)}</td>
                    <td className="px-4 py-3 text-white/80">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/60">
                    No user data found.
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
