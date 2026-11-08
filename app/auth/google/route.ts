import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { getAuthOrigin, getAuthReturnPath } from "@/app/lib/auth-navigation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = getAuthOrigin(request.url);
  const next = getAuthReturnPath(url.searchParams.get("next"));
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", next);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "custom:creative-dimensions-google",
      options: {
        redirectTo: callback.toString(),
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    });
    if (!error && data.url) {
      return NextResponse.redirect(data.url, { status: 303, headers: { "Cache-Control": "private, no-store" } });
    }
  } catch {
    // Provider and infrastructure details must not be exposed in the URL or UI.
  }

  const failure = new URL("/auth/error", origin);
  failure.searchParams.set("next", next);
  return NextResponse.redirect(failure, { status: 303, headers: { "Cache-Control": "private, no-store" } });
}
