import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import {
  PROMO_CODES_KEY,
  normalizePromoRecords,
  withPromoDefaults,
} from "@/app/lib/promocodes";

export async function GET() {
  const raw = await kv.get<unknown>(PROMO_CODES_KEY);
  const records = withPromoDefaults(normalizePromoRecords(raw))
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
}
