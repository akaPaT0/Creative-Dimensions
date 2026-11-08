import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import {
  checkRateLimit,
  getClientIp,
  recordFailedAttempt,
} from "@/app/lib/security/rate-limiter";
import { verifyTurnstileToken } from "@/app/lib/security/turnstile";
import { validatePassword, isPasswordPwned } from "@/app/lib/security/password-policy";

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

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // Password strength enforcement
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: `Password too weak: ${passwordCheck.errors.join("; ")}.` },
        { status: 400 }
      );
    }

    // Free HaveIBeenPwned global data breach check
    const pwned = await isPasswordPwned(password);
    if (pwned) {
      return NextResponse.json(
        {
          error:
            "This password has appeared in a known public data breach. Please choose a safer, unique password.",
        },
        { status: 400 }
      );
    }

    // 1. IP Rate Limiting for Sign Ups
    const ipKey = `signup:ip:${ip}`;
    const ipLimit = checkRateLimit(ipKey);
    if (!ipLimit.allowed) {
      const minutes = Math.ceil((ipLimit.retryAfterSeconds || 300) / 60);
      return NextResponse.json(
        {
          error: `Too many sign-up attempts from this network. Please try again in ${minutes} minutes.`,
        },
        { status: 429 }
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

    // 3. Supabase Sign Up via SSR server client
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      recordFailedAttempt(ipKey);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: "Check your email to confirm your account.",
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Account creation error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
