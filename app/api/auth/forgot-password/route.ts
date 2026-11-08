import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";
import {
  checkRateLimit,
  getClientIp,
  recordFailedAttempt,
} from "@/app/lib/security/rate-limiter";
import { verifyTurnstileToken } from "@/app/lib/security/turnstile";

const shopOrigin = "https://www.creativedimensionslb.com";

const acceptedResponse = {
  ok: true,
  message: "If an account exists with that email, a password reset link has been sent.",
};

export async function POST(req: Request) {
  try {
    if (req.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }
    const ip = getClientIp(req.headers);
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : "";

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // Rate limit password reset requests (prevent inbox spamming)
    const ipKey = `reset:ip:${ip}`;
    const emailKey = `reset:email:${email}`;
    const ipLimit = checkRateLimit(ipKey);
    const emailLimit = checkRateLimit(emailKey);

    if (!ipLimit.allowed || !emailLimit.allowed) {
      const minutes = Math.ceil(
        Math.max(ipLimit.retryAfterSeconds || 300, emailLimit.retryAfterSeconds || 300) / 60
      );
      return NextResponse.json(
        {
          error: `Too many password reset requests. Please wait ${minutes} minute${
            minutes > 1 ? "s" : ""
          } before trying again.`,
        },
        { status: 429 }
      );
    }

    const resendKey = process.env.CD_RESEND_API_KEY?.trim();
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    const production = process.env.NODE_ENV === "production";
    if (!resendKey || (production && (!turnstileSecret || /^[123]x0+AA$/.test(turnstileSecret)))) {
      return NextResponse.json(
        { error: "Password reset email is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    if (turnstileSecret || turnstileToken) {
      const turnstileCheck = await verifyTurnstileToken(turnstileToken, ip);
      if (!turnstileCheck.success) {
        return NextResponse.json(
          { error: turnstileCheck.error || "Bot verification failed. Please try again." },
          { status: 403 }
        );
      }
    }

    recordFailedAttempt(ipKey);
    recordFailedAttempt(emailKey);

    const requestUrl = new URL(req.url);
    const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(requestUrl.hostname);
    const origin = !production && isLocal ? requestUrl.origin : shopOrigin;
    const resetUrl = new URL("/reset-password", origin);
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: resetUrl.href },
    });

    const tokenHash = data?.properties?.hashed_token;
    if (error || !tokenHash) {
      if (error?.code !== "user_not_found") console.error("Could not generate a shop recovery link.");
      return NextResponse.json(acceptedResponse);
    }

    // The fragment keeps the token out of page requests. Opening the link alone does not use it.
    resetUrl.hash = new URLSearchParams({ recovery: tokenHash }).toString();
    const delivery = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        from: "Creative Dimensions <support@creativedimensionslb.com>",
        to: [email],
        subject: "Reset your Creative Dimensions password",
        text: `We received a request to reset the password for your Creative Dimensions shop account.\n\nOpen this link to choose a new password:\n${resetUrl.href}\n\nIf you did not request a reset, you can ignore this email. For help, reply to this message.`,
      }),
    });
    if (!delivery.ok) console.error(`Shop recovery email delivery failed (${delivery.status}).`);

    return NextResponse.json(acceptedResponse);
  } catch {
    console.error("Could not process a shop password reset request.");
    return NextResponse.json(acceptedResponse);
  }
}
