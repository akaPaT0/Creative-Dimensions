import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp, recordFailedAttempt } from "@/app/lib/security/rate-limiter";
import { verifyTurnstileToken } from "@/app/lib/security/turnstile";
import { parseReviewInput } from "@/app/lib/reviews";
import { insertReview } from "@/app/lib/supabase/review-store";
import { telegramNotify } from "@/app/lib/telegram";

export const runtime = "nodejs";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
  try {
    if (req.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
      return json({ error: "Invalid request." }, 400);
    }
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") return json({ error: "Invalid request." }, 400);

    // Honeypot: real people never see or fill this field. Pretend success for bots.
    if (typeof body.website === "string" && body.website.trim()) return json({ ok: true });

    const parsed = parseReviewInput(body);
    if (!parsed.ok) return json({ error: parsed.error }, 400);

    const ip = getClientIp(req.headers);
    const ipKey = `review:ip:${ip}`;
    const limit = checkRateLimit(ipKey);
    if (!limit.allowed) {
      const minutes = Math.ceil((limit.retryAfterSeconds || 300) / 60);
      return json({ error: `Too many reviews from this connection. Please wait ${minutes} minute${minutes > 1 ? "s" : ""}.` }, 429);
    }

    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
    const production = process.env.NODE_ENV === "production";
    if (production && (!turnstileSecret || /^[123]x0+AA$/.test(turnstileSecret))) {
      return json({ error: "Reviews are temporarily unavailable. Please try again later." }, 503);
    }
    if (turnstileSecret || turnstileToken) {
      const check = await verifyTurnstileToken(turnstileToken, ip, "review");
      if (!check.success) return json({ error: check.error || "Security check failed." }, 403);
    }

    // Count every accepted submission so one connection can't flood the queue.
    recordFailedAttempt(ipKey);
    await insertReview(parsed.review);

    const r = parsed.review;
    await telegramNotify(
      [
        `⭐ New review waiting for approval (${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)})`,
        `From: ${r.name}`,
        r.product ? `Product: ${r.product}` : "",
        r.orderRef ? `Order: ${r.orderRef}` : "",
        "",
        r.comment,
        "",
        "Approve it in Admin → Reviews.",
      ].filter((line, i, all) => line || all[i - 1]).join("\n")
    ).catch((err) => console.error("Review Telegram notify failed:", err));

    return json({ ok: true });
  } catch (error) {
    console.error("Review submission failed:", error);
    return json({ error: error instanceof Error ? error.message : "Could not save your review." }, 500);
  }
}
