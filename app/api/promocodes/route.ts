import { NextResponse } from "next/server";
import { loadPromos } from "@/app/lib/supabase/promo-store";
export async function GET() {
  try {
    const records = (await loadPromos())
      .filter((x) => x.active)
      .map((x) => ({
        code: x.code,
        label: x.label,
        description: x.description,
        type: x.type,
        value: x.value,
        minSubtotal: x.minSubtotal,
        maxDiscount: x.maxDiscount,
      }));

    return NextResponse.json({ promos: records });
  } catch (error) {
    console.error("Public promo code request failed:", error);
    return NextResponse.json({ error: "Promo codes are temporarily unavailable. Please try again." }, { status: 503 });
  }
}
