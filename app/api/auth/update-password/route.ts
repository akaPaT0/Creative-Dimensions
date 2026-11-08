import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isPasswordPwned, validatePassword } from "@/app/lib/security/password-policy";

const invalidLink = "This reset link is invalid or has expired. Please request a new one.";

export async function POST(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const tokenHash = typeof body?.tokenHash === "string" ? body.tokenHash : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!/^[a-zA-Z0-9_-]{1,256}$/.test(tokenHash)) {
    return NextResponse.json({ error: invalidLink }, { status: 400 });
  }

  if (password.length > 128) {
    return NextResponse.json({ error: "Use a password with at most 128 characters." }, { status: 400 });
  }
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return NextResponse.json({ error: passwordCheck.errors[0] }, { status: 400 });
  }
  if (await isPasswordPwned(password)) {
    return NextResponse.json(
      { error: "This password appeared in a data breach. Please choose a different one." },
      { status: 400 }
    );
  }

  try {
    // This client holds the one-time recovery session only for this request.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
    if (error || !data.session) {
      return NextResponse.json({ error: invalidLink }, { status: 401 });
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    await supabase.auth.signOut({ scope: "local" }).catch(() => {
      console.error("Could not close a shop password recovery session.");
    });
    if (updateError) {
      return NextResponse.json(
        { error: "Could not update your password. Please request a new reset link." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not update your password. Please request a new reset link." },
      { status: 503 }
    );
  }
}
