// Recognises visits that involve an AI assistant. Pure helpers, shared by
// proxy.ts (which counts them) and the tests. Nothing here identifies a person.
//
// Three kinds are kept apart on purpose:
//   crawler  - an AI company's robot reading pages for its index or training
//   fetch    - an assistant opening a page because someone asked it something
//   referral - a real visitor arriving from an AI assistant's site or app

export type AiVisitKind = "crawler" | "fetch" | "referral";

export type AiVisit = {
  kind: AiVisitKind;
  /** The service, e.g. "ChatGPT". */
  source: string;
  /** The robot's name or the referring site, e.g. "GPTBot" or "chatgpt.com". */
  agent: string;
};

// Names the robots put in their User-Agent. Keep in step with the matcher in proxy.ts.
export const AI_BOTS: { token: string; source: string; kind: "crawler" | "fetch" }[] = [
  { token: "ChatGPT-User", source: "ChatGPT", kind: "fetch" },
  { token: "OAI-SearchBot", source: "ChatGPT", kind: "crawler" },
  { token: "GPTBot", source: "ChatGPT", kind: "crawler" },
  { token: "Claude-User", source: "Claude", kind: "fetch" },
  { token: "Claude-SearchBot", source: "Claude", kind: "crawler" },
  { token: "ClaudeBot", source: "Claude", kind: "crawler" },
  { token: "Claude-Web", source: "Claude", kind: "crawler" },
  { token: "anthropic-ai", source: "Claude", kind: "crawler" },
  { token: "Perplexity-User", source: "Perplexity", kind: "fetch" },
  { token: "PerplexityBot", source: "Perplexity", kind: "crawler" },
  { token: "Google-CloudVertexBot", source: "Google AI", kind: "crawler" },
  { token: "meta-externalfetcher", source: "Meta AI", kind: "fetch" },
  { token: "meta-externalagent", source: "Meta AI", kind: "crawler" },
  { token: "MistralAI-User", source: "Mistral", kind: "fetch" },
  { token: "DuckAssistBot", source: "DuckDuckGo AI", kind: "fetch" },
  { token: "Amazonbot", source: "Amazon", kind: "crawler" },
  { token: "Bytespider", source: "ByteDance", kind: "crawler" },
  { token: "CCBot", source: "Common Crawl", kind: "crawler" },
];

// Sites a visitor can arrive from. Keep in step with the matcher in proxy.ts.
export const AI_REFERRERS: { host: string; source: string }[] = [
  { host: "chatgpt.com", source: "ChatGPT" },
  { host: "chat.openai.com", source: "ChatGPT" },
  { host: "claude.ai", source: "Claude" },
  { host: "perplexity.ai", source: "Perplexity" },
  { host: "gemini.google.com", source: "Gemini" },
  { host: "copilot.microsoft.com", source: "Copilot" },
  { host: "meta.ai", source: "Meta AI" },
  { host: "chat.mistral.ai", source: "Mistral" },
  { host: "chat.deepseek.com", source: "DeepSeek" },
  { host: "grok.com", source: "Grok" },
];

// Some assistants tag the links they hand out, e.g. ?utm_source=chatgpt.com
const AI_UTM_SOURCES: { needle: string; source: string }[] = [
  { needle: "chatgpt", source: "ChatGPT" },
  { needle: "openai", source: "ChatGPT" },
  { needle: "claude", source: "Claude" },
  { needle: "perplexity", source: "Perplexity" },
  { needle: "gemini", source: "Gemini" },
  { needle: "copilot", source: "Copilot" },
];

export function classifyBot(userAgent: string | null | undefined): AiVisit | null {
  const ua = (userAgent || "").toLowerCase();
  if (!ua) return null;
  for (const bot of AI_BOTS) {
    if (ua.includes(bot.token.toLowerCase())) {
      return { kind: bot.kind, source: bot.source, agent: bot.token };
    }
  }
  return null;
}

export function classifyReferral(
  referer: string | null | undefined,
  utmSource: string | null | undefined
): AiVisit | null {
  let host = "";
  try {
    host = referer ? new URL(referer).hostname.toLowerCase() : "";
  } catch {
    host = "";
  }
  if (host) {
    for (const ref of AI_REFERRERS) {
      if (host === ref.host || host.endsWith(`.${ref.host}`)) {
        return { kind: "referral", source: ref.source, agent: ref.host };
      }
    }
  }

  const utm = (utmSource || "").trim().toLowerCase();
  if (utm && /^[a-z0-9._-]{1,40}$/.test(utm)) {
    for (const tag of AI_UTM_SOURCES) {
      if (utm.includes(tag.needle)) {
        return { kind: "referral", source: tag.source, agent: `utm_source=${utm}` };
      }
    }
  }
  return null;
}

type HeaderBag = { get(name: string): string | null };

/** True when a browser is opening the page itself, not preloading it or fetching data for it. */
export function isPageNavigation(headers: HeaderBag): boolean {
  if (headers.get("rsc") || headers.get("next-router-prefetch")) return false;
  const purpose = `${headers.get("purpose") || ""} ${headers.get("sec-purpose") || ""}`.toLowerCase();
  if (purpose.includes("prefetch") || purpose.includes("prerender")) return false;
  const dest = headers.get("sec-fetch-dest");
  if (dest) return dest === "document";
  return (headers.get("accept") || "").includes("text/html");
}

export function detectAiVisit(input: {
  method: string;
  headers: HeaderBag;
  utmSource: string | null;
}): AiVisit | null {
  if (input.method !== "GET") return null;

  const bot = classifyBot(input.headers.get("user-agent"));
  if (bot) {
    // A robot never needs the app's background data requests; ignore them if they appear.
    if (input.headers.get("rsc") || input.headers.get("next-router-prefetch")) return null;
    return bot;
  }

  if (!isPageNavigation(input.headers)) return null;
  return classifyReferral(input.headers.get("referer"), input.utmSource);
}

/** The page path we store: no query string, bounded, and odd-looking paths share one bucket. */
export function normalizePath(pathname: string): string {
  let path = pathname || "/";
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  if (path.length > 160 || !/^\/[A-Za-z0-9/_%~-]*$/.test(path)) return "(other)";
  return path;
}
