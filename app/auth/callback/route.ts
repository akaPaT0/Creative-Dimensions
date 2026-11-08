import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { getAuthOrigin, getAuthReturnPath } from "@/app/lib/auth-navigation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = getAuthOrigin(request.url);
  const next = getAuthReturnPath(url.searchParams.get("next"));
  const code = url.searchParams.get("code");

  if (code && !url.searchParams.has("error")) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, origin), {
          status: 303,
          headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
        });
      }
    } catch {
      // Missing verifier, expired codes and cancelled sign-ins share a safe retry page.
    }
  }

  const failure = new URL("/auth/error", origin);
  failure.searchParams.set("next", next);
  return NextResponse.redirect(failure, {
    status: 303,
    headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
  });
}
