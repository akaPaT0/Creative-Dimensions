import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import {
  checkRateLimit,
  getClientIp,
  recordFailedAttempt,
  resetAttempts,
} from "@/app/lib/security/rate-limiter";
import { verifyTurnstileToken } from "@/app/lib/security/turnstile";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const ipKey = `ip:${ip}`;
    const emailKey = `email:${email}`;

    // 1. Check Rate Limits (IP & Target Email)
    const ipLimit = checkRateLimit(ipKey);
    const emailLimit = checkRateLimit(emailKey);

    if (!ipLimit.allowed || !emailLimit.allowed) {
      const retryAfter = Math.max(
        ipLimit.retryAfterSeconds || 0,
        emailLimit.retryAfterSeconds || 0
      );
      const minutes = Math.ceil(retryAfter / 60);
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Please try again in ${minutes} minute${
            minutes > 1 ? "s" : ""
          }.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }

    // 2. Cloudflare Turnstile Bot Check
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret || turnstileToken) {
      const turnstileCheck = await verifyTurnstileToken(turnstileToken, ip);
      if (!turnstileCheck.success) {
        return NextResponse.json(
          { error: turnstileCheck.error || "Bot verification failed. Please try again." },
          { status: 403 }
        );
      }
    }

    // 3. Authenticate with Supabase SSR server client (sets HttpOnly cookies)
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      // Record failed attempt
      const ipFail = recordFailedAttempt(ipKey);
      const emailFail = recordFailedAttempt(emailKey);

      if (ipFail.locked || emailFail.locked) {
        const retryAfter = Math.max(
          ipFail.retryAfterSeconds || 0,
          emailFail.retryAfterSeconds || 0
        );
        const minutes = Math.ceil(retryAfter / 60);
        return NextResponse.json(
          {
            error: `Too many failed attempts. Login temporarily locked for ${minutes} minute${
              minutes > 1 ? "s" : ""
            }.`,
          },
          {
            status: 429,
            headers: { "Retry-After": String(retryAfter) },
          }
        );
      }

      // Return sanitized message to prevent account enumeration
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 4. Success: Clear rate limits for IP and email
    resetAttempts(ipKey);
    resetAttempts(emailKey);

    return NextResponse.json({
      ok: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
