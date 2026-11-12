"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { EmptyState, FilterChips, StatStrip, ui } from "./ui";

type Kind = "crawler" | "fetch" | "referral";
type Counts = Record<Kind, number>;

type Report = {
  ready: boolean;
  days: number;
  since: string;
  totals: Counts;
  sources: { source: string; agent: string; kind: Kind; hits: number; lastSeen: string }[];
  pages: ({ path: string } & Counts)[];
  byDay: ({ day: string } & Counts)[];
  truncated: boolean;
};

type Range = "7" | "30" | "90";

const KIND_LABEL: Record<Kind, string> = {
  crawler: "Robot read",
  fetch: "For a question",
  referral: "Visitor sent",
};

const KIND_TONE: Record<Kind, string> = {
  crawler: "border-white/10 bg-white/[0.04] text-white/60",
  fetch: "border-sky-400/25 bg-sky-500/10 text-sky-200",
  referral: "border-[#FF8B64]/35 bg-[#FF8B64]/12 text-[#FF8B64]",
};

function formatDay(day: string) {
  const d = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return day;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(d);
}

function Num({ value, strong }: { value: number; strong?: boolean }) {
  return (
    <span className={`tabular-nums ${value ? (strong ? "font-semibold text-white" : "text-white/80") : "text-white/25"}`}>
      {value || "–"}
    </span>
  );
}

const COLS = "sm:grid-cols-[minmax(0,1fr)_120px_120px_120px]";
const HEAD = "text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40";

/** Column titles for the count lists. Phones show a small label beside each number instead. */
function CountHead({ first }: { first: string }) {
  return (
    <div className={`hidden gap-x-3 px-5 pb-2.5 sm:grid ${COLS} ${HEAD}`} aria-hidden="true">
      <span>{first}</span>
      <span className="text-right">Visitors sent</span>
      <span className="text-right">For a question</span>
      <span className="text-right">Robot reads</span>
    </div>
  );
}

function CountRow({ label, counts }: { label: ReactNode; counts: Counts }) {
  const cells: [string, number, boolean][] = [
    ["Visitors", counts.referral, true],
    ["Questions", counts.fetch, false],
    ["Robots", counts.crawler, false],
  ];
  return (
    <li className={`grid grid-cols-3 items-center gap-x-3 gap-y-1.5 border-t border-white/[0.06] px-4 py-3 text-sm transition-colors hover:bg-white/[0.02] sm:px-5 ${COLS}`}>
      <div className="col-span-3 min-w-0 truncate sm:col-span-1">{label}</div>
      {cells.map(([name, value, strong]) => (
        <div key={name} className="sm:text-right">
          <span className="mr-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30 sm:sr-only">{name}</span>
          <Num value={value} strong={strong} />
        </div>
      ))}
    </li>
  );
}

export default function AdminAiTraffic() {
  const [range, setRange] = useState<Range>("30");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  const load = useCallback(async (days: Range) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/ai-traffic?days=${days}`, { cache: "no-store" });
      const data = (await res.json()) as Report | { error?: string };
      if (!res.ok) throw new Error(("error" in data && data.error) || "Failed to load");
      setReport(data as Report);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(range);
  }, [load, range]);

  const totals = report?.totals;
  const services = report ? new Set(report.sources.map((s) => s.source)).size : 0;
  const empty = !!report && report.ready && report.sources.length === 0;
  const show = (n: number | undefined) => (loading || n === undefined ? "–" : n);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips<Range>
          value={range}
          onChange={setRange}
          options={[
            { value: "7", label: "Last 7 days" },
            { value: "30", label: "Last 30 days" },
            { value: "90", label: "Last 90 days" },
          ]}
        />
        <button type="button" onClick={() => void load(range)} className={ui.btn} disabled={loading}>
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {error && <p className={ui.error}>{error}</p>}

      {report && !report.ready && (
        <p className={ui.error}>
          Counting is not switched on yet. Apply <span className="font-mono">supabase-ai-traffic-schema.sql</span> to the
          shop&rsquo;s Supabase project, then refresh.
        </p>
      )}

      <StatStrip
        items={[
          { label: "Visitors sent by AI", value: show(totals?.referral), accent: true },
          { label: "Opened for a question", value: show(totals?.fetch) },
          { label: "Robot reads", value: show(totals?.crawler) },
          { label: "AI services seen", value: loading || !report ? "–" : services },
        ]}
      />

      <div className={`${ui.panelPad} space-y-1.5`}>
        <p className={ui.note}>
          <span className="font-semibold text-white/65">Visitors sent by AI</span> are real people who clicked through
          from an assistant. Many apps hide where a click came from, so the true number is higher.
        </p>
        <p className={ui.note}>
          <span className="font-semibold text-white/65">Opened for a question</span> means an assistant loaded a page
          while answering someone. It does not prove the shop was recommended.
        </p>
        <p className={ui.note}>
          <span className="font-semibold text-white/65">Robot reads</span> are AI companies scanning pages for their
          index. Robots are recognised by the name they give and are not verified. Gemini reads through the normal
          Google robot, so it only appears here when it sends a visitor.
        </p>
      </div>

      {report?.truncated && (
        <p className={ui.note}>There is more data than one report reads, so these totals are a minimum. Try a shorter range.</p>
      )}

      {empty && !loading && (
        <div className={ui.panel}>
          <EmptyState
            title="No AI visits counted in this period"
            hint="Counting starts from the day this went live. Earlier visits were not recorded."
          />
        </div>
      )}

      {report && report.sources.length > 0 && (
        <>
          <div className={`${ui.panel} overflow-hidden`}>
            <h2 className="px-4 pt-4 pb-3 text-sm font-semibold text-white sm:px-5">Who visited</h2>
            <div
              className={`hidden grid-cols-[minmax(0,1fr)_150px_70px_90px] gap-x-3 px-5 pb-2.5 sm:grid ${HEAD}`}
              aria-hidden="true"
            >
              <span>Service</span>
              <span>Type</span>
              <span className="text-right">Visits</span>
              <span className="text-right">Last seen</span>
            </div>
            <ul>
              {report.sources.map((s) => (
                <li
                  key={`${s.kind}|${s.source}|${s.agent}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto_44px] items-center gap-x-3 border-t border-white/[0.06] px-4 py-3 text-sm transition-colors hover:bg-white/[0.02] sm:grid-cols-[minmax(0,1fr)_150px_70px_90px] sm:px-5"
                >
                  <div className="min-w-0">
                    <span className="block truncate font-semibold text-white">{s.source}</span>
                    <span className="block truncate font-mono text-[11px] text-white/45">{s.agent}</span>
                  </div>
                  <div>
                    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${KIND_TONE[s.kind]}`}>
                      {KIND_LABEL[s.kind]}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="sr-only">Visits </span>
                    <Num value={s.hits} strong />
                  </div>
                  <div className="hidden whitespace-nowrap text-right text-xs text-white/50 sm:block">
                    <span className="sr-only">Last seen </span>
                    {formatDay(s.lastSeen)}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className={`${ui.panel} overflow-hidden`}>
            <h2 className="px-4 pt-4 pb-3 text-sm font-semibold text-white sm:px-5">Pages they looked at</h2>
            <CountHead first="Page" />
            <ul>
              {report.pages.map((p) => (
                <CountRow
                  key={p.path}
                  counts={p}
                  label={
                    p.path.startsWith("/") ? (
                      <a href={p.path} target="_blank" rel="noreferrer" className="text-white/85 transition-colors hover:text-[#FF8B64]">
                        {p.path === "/" ? "/ (home page)" : p.path}
                      </a>
                    ) : (
                      <span className="text-white/50">Other addresses</span>
                    )
                  }
                />
              ))}
            </ul>
          </div>

          <div className={`${ui.panel} overflow-hidden`}>
            <h2 className="px-4 pt-4 pb-3 text-sm font-semibold text-white sm:px-5">Day by day</h2>
            <CountHead first="Day" />
            <ul>
              {report.byDay.map((d) => (
                <CountRow key={d.day} counts={d} label={<span className="text-white/85">{formatDay(d.day)}</span>} />
              ))}
            </ul>
            <p className={`border-t border-white/[0.06] px-4 py-3 sm:px-5 ${ui.note}`}>
              Days are counted in UTC. Days with no AI visits are not listed.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
