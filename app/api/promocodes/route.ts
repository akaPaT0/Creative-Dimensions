import { NextResponse } from "next/server";
import { loadPromos } from "@/app/lib/supabase/promo-store";
import { normalizePromoCode } from "@/app/lib/promocodes";
import { checkRateLimit, getClientIp, recordFailedAttempt } from "@/app/lib/security/rate-limiter";

// Looks up ONE code the customer typed. The full list of codes is never sent to
// the browser, so private codes can't be read by visiting this address.
export async function GET(req: Request) {
  try {
    const code = normalizePromoCode(new URL(req.url).searchParams.get("code"));
    if (!code || code.length > 64) return NextResponse.json({ promos: [] });

    // Slow down guessing of codes.
    const ipKey = `promo:ip:${getClientIp(req.headers)}`;
    const limit = checkRateLimit(ipKey);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }

    const match = (await loadPromos()).find((x) => x.active && x.code === code);
    if (!match) {
      recordFailedAttempt(ipKey);
      return NextResponse.json({ promos: [] });
    }

    return NextResponse.json({
      promos: [
        {
          code: match.code,
          label: match.label,
          description: match.description,
          type: match.type,
          value: match.value,
          minSubtotal: match.minSubtotal,
          maxDiscount: match.maxDiscount,
        },
      ],
    });
  } catch (error) {
    console.error("Public promo code request failed:", error);
    return NextResponse.json({ error: "Promo codes are temporarily unavailable. Please try again." }, { status: 503 });
  }
}
