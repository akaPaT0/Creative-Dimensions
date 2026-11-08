import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { validatePassword, isPasswordPwned } from "@/app/lib/security/password-policy";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your reset session has expired or is invalid. Please request a new link." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const password = typeof body?.password === "string" ? body.password : "";

    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    // 1. Password policy check
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: `Password too weak: ${passwordCheck.errors.join("; ")}.` },
        { status: 400 }
      );
    }

    // 2. HaveIBeenPwned breach check
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

    // 3. Update password in Supabase
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update password.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
