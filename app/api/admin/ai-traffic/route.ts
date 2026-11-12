import { NextResponse } from "next/server";
import { requireSupabaseAdmin } from "@/app/lib/supabase/auth-server";
import { loadAiTrafficReport } from "@/app/lib/supabase/ai-traffic-store";

const RANGES = [7, 30, 90];

export async function GET(req: Request) {
  try {
    const admin = await requireSupabaseAdmin(req);
    if ("response" in admin) return admin.response;

    const asked = Number(new URL(req.url).searchParams.get("days"));
    const days = RANGES.includes(asked) ? asked : 30;
    return NextResponse.json(await loadAiTrafficReport(days));
  } catch (error) {
    console.error("Admin AI traffic request failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI traffic is temporarily unavailable." },
      { status: 503 }
    );
  }
}
