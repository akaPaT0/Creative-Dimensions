import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { detectAiVisit, normalizePath, type AiVisit } from "@/app/lib/ai-traffic";

// Counts visits that involve an AI assistant (see app/lib/ai-traffic.ts).
//
// This only runs for requests that already look like one: the matcher below
// checks the robot name, the referring site or the utm_source tag before the
// function is ever called, so ordinary customers never pass through it.
// It never changes the response, and a failed count is silently dropped.

// Next.js reads this block when the site is built, so every value has to be
// written out in full here; it cannot be assembled from shared variables.
//
// source: public pages only. Private areas, API routes, Next.js internals and
//         files (anything with a dot) are skipped.
// has:    what makes a request worth counting. Keep these three lists in step
//         with AI_BOTS, AI_REFERRERS and the utm list in app/lib/ai-traffic.ts
//         (scripts/ai-traffic.test.mjs checks that they agree).
// missing: skips the app's own preloads and background data requests.
export const config = {
  matcher: [
    {
      source:
        "/((?!(?:api|_next|admin|user|checkout|cart|orders|invoice|sign-in|sign-up|reset-password|f)(?:/|$)|.*\\.).*)",
      has: [
        {
          type: "header",
          key: "user-agent",
          value:
            ".*(ChatGPT-User|OAI-SearchBot|GPTBot|Claude-User|Claude-SearchBot|ClaudeBot|Claude-Web|anthropic-ai|Perplexity-User|PerplexityBot|Google-CloudVertexBot|meta-externalfetcher|meta-externalagent|MistralAI-User|DuckAssistBot|Amazonbot|Bytespider|CCBot).*",
        },
      ],
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "rsc" },
      ],
    },
    {
      source:
        "/((?!(?:api|_next|admin|user|checkout|cart|orders|invoice|sign-in|sign-up|reset-password|f)(?:/|$)|.*\\.).*)",
      has: [
        {
          type: "header",
          key: "referer",
          value:
            "https?://([^/]*\\.)?(chatgpt\\.com|chat\\.openai\\.com|claude\\.ai|perplexity\\.ai|gemini\\.google\\.com|copilot\\.microsoft\\.com|meta\\.ai|chat\\.mistral\\.ai|chat\\.deepseek\\.com|grok\\.com)(/.*)?",
        },
      ],
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "rsc" },
      ],
    },
    {
      source:
        "/((?!(?:api|_next|admin|user|checkout|cart|orders|invoice|sign-in|sign-up|reset-password|f)(?:/|$)|.*\\.).*)",
      has: [
        {
          type: "query",
          key: "utm_source",
          value: ".*(chatgpt|openai|claude|perplexity|gemini|copilot).*",
        },
      ],
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "rsc" },
      ],
    },
  ],
};

async function recordAiVisit(visit: AiVisit, path: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  // One small call that adds 1 to today's counter for this service and page.
  await fetch(`${url}/rest/v1/rpc/cd_ai_traffic_hit`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_kind: visit.kind,
      p_source: visit.source,
      p_agent: visit.agent,
      p_path: path,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(3000),
  });
}

export function proxy(request: NextRequest, event: NextFetchEvent) {
  try {
    // Count the live shop only, not preview deployments.
    const env = process.env.VERCEL_ENV;
    if (!env || env === "production") {
      const visit = detectAiVisit({
        method: request.method,
        headers: request.headers,
        utmSource: request.nextUrl.searchParams.get("utm_source"),
      });
      if (visit) {
        // Runs after the page has been sent, so the visitor never waits for it.
        event.waitUntil(recordAiVisit(visit, normalizePath(request.nextUrl.pathname)).catch(() => {}));
      }
    }
  } catch {
    // Counting must never get in the way of the page.
  }
  return NextResponse.next();
}
