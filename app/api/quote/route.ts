import { NextResponse } from "next/server";

const PLA_PER_GRAM = 15 / 1000;
const ELECTRICITY_PER_HOUR = 0.5;
const MACHINE_WEAR_PER_HOUR = 1;
const BASE_FEE = 3;
const PROFIT_MULTIPLIER = 1.4;
const COLOR_FEE_PER_EXTRA = 2;

type QuoteRequest = {
  grams: number;
  hours: number;
  colors: number;
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function roundToNearestHalf(value: number) {
  return Math.round(value * 2) / 2;
}

function parseBody(raw: unknown): QuoteRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const grams = typeof row.grams === "number" ? row.grams : NaN;
  const hours = typeof row.hours === "number" ? row.hours : NaN;
  const colors = typeof row.colors === "number" ? row.colors : NaN;
  if (!Number.isFinite(grams) || grams <= 0 || grams > 100000) return null;
  if (!Number.isFinite(hours) || hours <= 0 || hours > 1000) return null;
  if (!Number.isInteger(colors) || colors < 1 || colors > 4) return null;
  return { grams, hours, colors };
}

export async function POST(req: Request) {
  try {
    const raw = (await req.json().catch(() => null)) as unknown;
    const body = parseBody(raw);
    if (!body) return json({ error: "Invalid payload." }, 400);

    const materialCost = body.grams * PLA_PER_GRAM;
    const timeCost = body.hours * (ELECTRICITY_PER_HOUR + MACHINE_WEAR_PER_HOUR);
    const extraColorCount = Math.max(0, body.colors - 1);
    const colorFee = extraColorCount * COLOR_FEE_PER_EXTRA;
    const subtotal = BASE_FEE + materialCost + timeCost + colorFee;
    const final = roundToNearestHalf(subtotal * PROFIT_MULTIPLIER);

    return json({
      ok: true,
      grams: roundMoney(body.grams),
      hours: Math.round(body.hours * 1000) / 1000,
      colors: body.colors,
      pricing: {
        constants: {
          PLA_PER_GRAM,
          ELECTRICITY_PER_HOUR,
          MACHINE_WEAR_PER_HOUR,
          BASE_FEE,
          PROFIT_MULTIPLIER,
          COLOR_FEE_PER_EXTRA,
        },
        materialCost: roundMoney(materialCost),
        timeCost: roundMoney(timeCost),
        colorFee: roundMoney(colorFee),
        subtotal: roundMoney(subtotal),
      },
      finalPrice: roundMoney(final),
      currency: "USD",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate quote.";
    return json({ error: message }, 500);
  }
}
