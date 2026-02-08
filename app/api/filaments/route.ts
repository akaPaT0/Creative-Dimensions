import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const FILAMENTS_KEY = "admin:filament-options";

type FilamentItem = {
  id: string;
  type: string;
  color: string;
  hex: string;
  brand: string;
  finish: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function cleanHex(value: unknown) {
  if (typeof value !== "string") return "";
  const raw = value.trim();
  if (!raw) return "";
  const normalized = raw.startsWith("#") ? raw : `#${raw}`;
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toLowerCase() : "";
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeItems(raw: unknown): FilamentItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => ({
      id: asText(x.id),
      type: asText(x.type),
      color: asText(x.color),
      hex: cleanHex(x.hex),
      brand: asText(x.brand),
      finish: asText(x.finish),
      notes: asText(x.notes),
      isActive: x.isActive === true,
      createdAt: asText(x.createdAt),
      updatedAt: asText(x.updatedAt),
    }))
    .filter((x) => x.id && x.color && x.isActive);
}

export async function GET() {
  try {
    const raw = await kv.get<unknown>(FILAMENTS_KEY);
    const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const items = normalizeItems(data.items);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load filaments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
