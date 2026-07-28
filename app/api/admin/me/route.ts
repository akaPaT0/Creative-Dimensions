import { NextResponse } from "next/server";
import { requireSupabaseAdmin } from "@/app/lib/supabase/auth-server";

export async function GET(req: Request) {
  const auth = await requireSupabaseAdmin(req);
  if ("response" in auth) return auth.response;

  return NextResponse.json({ isAdmin: true, email: auth.email });
}
