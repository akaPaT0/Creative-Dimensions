import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

const invalidLink = { error: "This reset link is invalid or has expired. Please request a new one." };

export async function POST(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    return NextResponse.json(invalidLink, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const tokenHash = typeof body?.tokenHash === "string" ? body.tokenHash : "";
  if (!/^[a-zA-Z0-9_-]{1,256}$/.test(tokenHash)) {
    return NextResponse.json(invalidLink, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
    if (error || !data.session) return NextResponse.json(invalidLink, { status: 401 });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not open the reset link. Please try again." }, { status: 503 });
  }
}
