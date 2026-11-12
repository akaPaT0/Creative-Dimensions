import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  AI_BOTS,
  AI_REFERRERS,
  classifyBot,
  classifyReferral,
  detectAiVisit,
  normalizePath,
} from "../app/lib/ai-traffic.ts";

const headers = (map) => ({ get: (name) => map[name.toLowerCase()] ?? null });
const browser = { "sec-fetch-dest": "document", accept: "text/html", "user-agent": "Mozilla/5.0 Chrome/140 Safari/537.36" };

// The matcher values in proxy.ts, read the way Next.js applies them (whole value must match).
const proxySource = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
const matcherValues = [...proxySource.matchAll(/^\s*(?:value:\s*)?"((?:[^"\\]|\\.)+)",$/gm)].map((m) => JSON.parse(`"${m[1]}"`));
const fullMatch = (needle) => matcherValues.find((v) => v.includes(needle));
const uaMatcher = new RegExp(`^${fullMatch("GPTBot")}$`);
const refererMatcher = new RegExp(`^${fullMatch("chatgpt\\.com")}$`);
const utmMatcher = new RegExp(`^${fullMatch("chatgpt|")}$`);

test("robots are told apart from assistants opening a page for someone", () => {
  assert.deepEqual(classifyBot("Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)"), {
    kind: "crawler",
    source: "ChatGPT",
    agent: "GPTBot",
  });
  assert.deepEqual(classifyBot("Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot"), {
    kind: "fetch",
    source: "ChatGPT",
    agent: "ChatGPT-User",
  });
  assert.equal(classifyBot("Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)")?.kind, "crawler");
  assert.equal(classifyBot("Mozilla/5.0 (compatible; Claude-User/1.0; +Claude-User@anthropic.com)")?.kind, "fetch");
  assert.equal(classifyBot("Mozilla/5.0 (compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)")?.agent, "Perplexity-User");
  assert.equal(classifyBot(browser["user-agent"]), null);
  assert.equal(classifyBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"), null);
  assert.equal(classifyBot(""), null);
});

test("visitors arriving from an assistant are recognised by site or link tag", () => {
  assert.deepEqual(classifyReferral("https://chatgpt.com/", null), { kind: "referral", source: "ChatGPT", agent: "chatgpt.com" });
  assert.equal(classifyReferral("https://www.perplexity.ai/search/abc", null)?.source, "Perplexity");
  assert.equal(classifyReferral("https://gemini.google.com/app", null)?.source, "Gemini");
  assert.deepEqual(classifyReferral(null, "chatgpt.com"), { kind: "referral", source: "ChatGPT", agent: "utm_source=chatgpt.com" });
  assert.equal(classifyReferral("https://www.google.com/", null), null);
  assert.equal(classifyReferral("https://notchatgpt.com/", null), null);
  assert.equal(classifyReferral("https://chatgpt.com.evil.example/", null), null);
  assert.equal(classifyReferral("not a url", "instagram"), null);
  assert.equal(classifyReferral(null, "chatgpt<script>"), null);
});

test("one visit is counted once and only for real page loads", () => {
  const fromChatGpt = { ...browser, referer: "https://chatgpt.com/" };
  assert.equal(detectAiVisit({ method: "GET", headers: headers(fromChatGpt), utmSource: "chatgpt.com" })?.agent, "chatgpt.com");
  assert.equal(detectAiVisit({ method: "GET", headers: headers(browser), utmSource: null }), null);
  // Background data requests and preloads of the same page are not extra visits.
  assert.equal(detectAiVisit({ method: "GET", headers: headers({ ...fromChatGpt, rsc: "1" }), utmSource: null }), null);
  assert.equal(detectAiVisit({ method: "GET", headers: headers({ ...fromChatGpt, "sec-purpose": "prefetch" }), utmSource: null }), null);
  assert.equal(detectAiVisit({ method: "GET", headers: headers({ ...fromChatGpt, "sec-fetch-dest": "image" }), utmSource: null }), null);
  assert.equal(detectAiVisit({ method: "HEAD", headers: headers({ "user-agent": "GPTBot/1.2" }), utmSource: null }), null);
  // A robot stays a robot even if it sends a referring site.
  assert.equal(detectAiVisit({ method: "GET", headers: headers({ "user-agent": "ChatGPT-User/1.0", referer: "https://chatgpt.com/" }), utmSource: null })?.kind, "fetch");
});

test("stored page paths are bounded and plain", () => {
  assert.equal(normalizePath("/"), "/");
  assert.equal(normalizePath("/shop/keychains/"), "/shop/keychains");
  assert.equal(normalizePath("/shop/keychains/badge-%2F-100%25"), "/shop/keychains/badge-%2F-100%25");
  assert.equal(normalizePath("/shop/<script>"), "(other)");
  assert.equal(normalizePath(`/${"a".repeat(200)}`), "(other)");
});

test("proxy.ts wakes up for exactly the robots and sites the list knows", () => {
  for (const bot of AI_BOTS) {
    assert.match(`Mozilla/5.0 (compatible; ${bot.token}/1.0)`, uaMatcher, bot.token);
  }
  assert.doesNotMatch(browser["user-agent"], uaMatcher);
  for (const ref of AI_REFERRERS) {
    assert.match(`https://${ref.host}/`, refererMatcher, ref.host);
    assert.match(`https://www.${ref.host}/some/page?q=1`, refererMatcher, ref.host);
  }
  assert.doesNotMatch("https://www.google.com/", refererMatcher);
  assert.doesNotMatch("https://notchatgpt.com/", refererMatcher);
  for (const tag of ["chatgpt.com", "openai", "claude.ai", "perplexity", "gemini", "copilot"]) {
    assert.match(tag, utmMatcher, tag);
    assert.ok(classifyReferral(null, tag), tag);
  }
  assert.doesNotMatch("instagram", utmMatcher);
});
