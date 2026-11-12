import "server-only";
import { supabaseAdmin } from "./admin";
import type { AiVisitKind } from "../ai-traffic";

const TABLE = "cd_ai_traffic";
const PAGE_SIZE = 1000;
const MAX_PAGES = 30;

type Row = {
  day: string;
  kind: AiVisitKind;
  source: string;
  agent: string;
  path: string;
  hits: number;
};

type Counts = Record<AiVisitKind, number>;

export type AiTrafficReport = {
  /** False until supabase-ai-traffic-schema.sql has been applied. */
  ready: boolean;
  days: number;
  since: string;
  totals: Counts;
  sources: { source: string; agent: string; kind: AiVisitKind; hits: number; lastSeen: string }[];
  pages: ({ path: string } & Counts)[];
  byDay: ({ day: string } & Counts)[];
  /** True when there was more data than one report reads; totals are then a lower bound. */
  truncated: boolean;
};

const zero = (): Counts => ({ crawler: 0, fetch: 0, referral: 0 });

function isMissingTable(error: { code?: string; message?: string }) {
  return error.code === "42P01" || error.code === "PGRST205" || /could not find the table/i.test(error.message || "");
}

export async function loadAiTrafficReport(days: number): Promise<AiTrafficReport> {
  const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const report: AiTrafficReport = {
    ready: true,
    days,
    since,
    totals: zero(),
    sources: [],
    pages: [],
    byDay: [],
    truncated: false,
  };

  const rows: Row[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("day, kind, source, agent, path, hits")
      .gte("day", since)
      .order("day", { ascending: false })
      .order("kind")
      .order("source")
      .order("agent")
      .order("path")
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (error) {
      if (isMissingTable(error)) return { ...report, ready: false };
      throw new Error(error.message);
    }
    rows.push(...((data ?? []) as Row[]));
    if (!data || data.length < PAGE_SIZE) break;
    if (page === MAX_PAGES - 1) report.truncated = true;
  }

  const sources = new Map<string, AiTrafficReport["sources"][number]>();
  const pages = new Map<string, AiTrafficReport["pages"][number]>();
  const byDay = new Map<string, AiTrafficReport["byDay"][number]>();

  for (const row of rows) {
    if (!(row.kind in report.totals)) continue;
    report.totals[row.kind] += row.hits;

    const sourceKey = `${row.kind}|${row.source}|${row.agent}`;
    const s = sources.get(sourceKey);
    if (s) {
      s.hits += row.hits;
      if (row.day > s.lastSeen) s.lastSeen = row.day;
    } else {
      sources.set(sourceKey, { source: row.source, agent: row.agent, kind: row.kind, hits: row.hits, lastSeen: row.day });
    }

    const p = pages.get(row.path) ?? { path: row.path, ...zero() };
    p[row.kind] += row.hits;
    pages.set(row.path, p);

    const d = byDay.get(row.day) ?? { day: row.day, ...zero() };
    d[row.kind] += row.hits;
    byDay.set(row.day, d);
  }

  report.sources = [...sources.values()].sort((a, b) => b.hits - a.hits || a.agent.localeCompare(b.agent));
  // Pages that brought real visitors first, then the ones assistants opened, then robot reads.
  report.pages = [...pages.values()]
    .sort((a, b) => b.referral - a.referral || b.fetch - a.fetch || b.crawler - a.crawler || a.path.localeCompare(b.path))
    .slice(0, 50);
  report.byDay = [...byDay.values()].sort((a, b) => b.day.localeCompare(a.day));
  return report;
}
