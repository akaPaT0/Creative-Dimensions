import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import {
  PROMO_CODES_KEY,
  PromoCodeRecord,
  normalizePromoCode,
  normalizePromoRecords,
  withPromoDefaults,
} from "@/app/lib/promocodes";

type PromoInput = {
  code?: string;
  label?: string;
  description?: string;
  active?: boolean;
  type?: "percent" | "fixed" | "free_shipping";
  value?: number;
  minSubtotal?: number;
  maxDiscount?: number;
};

function json(res: unknown, status = 200) {
  return NextResponse.json(res, { status });
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return value;
}

function validateType(value: unknown): PromoCodeRecord["type"] {
  return value === "fixed" || value === "free_shipping" ? value : "percent";
}

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, res: json({ error: "Unauthorized" }, 401) };

  const user = await currentUser();
  if (!user) return { ok: false as const, res: json({ error: "Unauthorized" }, 401) };

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const primaryEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    "";
  const userEmail = primaryEmail.trim().toLowerCase();

  if (!adminEmail || userEmail !== adminEmail) {
    return { ok: false as const, res: json({ error: "Forbidden" }, 403) };
  }
  return { ok: true as const };
}

async function loadPromos() {
  const raw = await kv.get<unknown>(PROMO_CODES_KEY);
  return withPromoDefaults(normalizePromoRecords(raw));
}

function sortPromos(promos: PromoCodeRecord[]) {
  return [...promos].sort((a, b) => a.code.localeCompare(b.code));
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.res;
  const promos = await loadPromos();
  return json({ promos: sortPromos(promos) });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.res;

  const body = (await req.json().catch(() => null)) as PromoInput | null;
  const code = normalizePromoCode(body?.code);
  if (!code) return json({ error: "Code is required" }, 400);

  const current = await loadPromos();
  if (current.some((x) => x.code === code)) {
    return json({ error: "Promo code already exists" }, 400);
  }

  const now = new Date().toISOString();
  const nextPromo: PromoCodeRecord = {
    code,
    label: asText(body?.label) || code,
    description: asText(body?.description),
    active: body?.active !== false,
    type: validateType(body?.type),
    value: Math.max(0, asNumber(body?.value, 0)),
    minSubtotal: Math.max(0, asNumber(body?.minSubtotal, 0)),
    maxDiscount: Math.max(0, asNumber(body?.maxDiscount, 0)),
    createdAt: now,
    updatedAt: now,
  };

  const next = sortPromos([...current, nextPromo]);
  await kv.set(PROMO_CODES_KEY, next);
  return json({ ok: true, promo: nextPromo });
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.res;

  const body = (await req.json().catch(() => null)) as PromoInput | null;
  const code = normalizePromoCode(body?.code);
  if (!code) return json({ error: "Code is required" }, 400);

  const current = await loadPromos();
  const index = current.findIndex((x) => x.code === code);
  if (index < 0) return json({ error: "Promo code not found" }, 404);

  const existing = current[index];
  const updated: PromoCodeRecord = {
    ...existing,
    label: asText(body?.label) || existing.label,
    description: asText(body?.description),
    active: body?.active === undefined ? existing.active : body.active === true,
    type: validateType(body?.type ?? existing.type),
    value: Math.max(0, asNumber(body?.value, existing.value)),
    minSubtotal: Math.max(0, asNumber(body?.minSubtotal, existing.minSubtotal)),
    maxDiscount: Math.max(0, asNumber(body?.maxDiscount, existing.maxDiscount)),
    updatedAt: new Date().toISOString(),
  };

  const next = [...current];
  next[index] = updated;
  await kv.set(PROMO_CODES_KEY, sortPromos(next));
  return json({ ok: true, promo: updated });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.res;

  const body = (await req.json().catch(() => null)) as PromoInput | null;
  const code = normalizePromoCode(body?.code);
  if (!code) return json({ error: "Code is required" }, 400);

  const current = await loadPromos();
  const next = current.filter((x) => x.code !== code);
  if (next.length === current.length) return json({ error: "Promo code not found" }, 404);

  await kv.set(PROMO_CODES_KEY, sortPromos(next));
  return json({ ok: true });
}
