import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";

const FILAMENTS_KEY = "admin:filament-options";
const MAX_TEXT = 120;
const MAX_NOTES = 280;

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

function json(res: unknown, status = 200) {
  return NextResponse.json(res, { status });
}

function asList(raw: unknown) {
  if (!Array.isArray(raw)) return [] as string[];
  return raw
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
}

function cleanText(raw: unknown, maxLen = MAX_TEXT) {
  if (typeof raw !== "string") return "";
  return raw.trim().slice(0, maxLen);
}

function cleanBool(raw: unknown, fallback = true) {
  if (typeof raw === "boolean") return raw;
  return fallback;
}

function cleanHex(raw: unknown) {
  if (typeof raw !== "string") return "";
  const value = raw.trim();
  if (!value) return "";
  const normalized = value.startsWith("#") ? value : `#${value}`;
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toLowerCase() : "";
}

function hasOwn(input: Record<string, unknown> | null, key: string) {
  if (!input) return false;
  return Object.prototype.hasOwnProperty.call(input, key);
}

function makeId() {
  return `flm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

function normalizeItems(raw: unknown): FilamentItem[] {
  if (!Array.isArray(raw)) return [];

  const now = new Date().toISOString();
  const seen = new Set<string>();
  const out: FilamentItem[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = cleanText(row.id, 80) || makeId();
    if (seen.has(id)) continue;
    seen.add(id);

    out.push({
      id,
      type: cleanText(row.type),
      color: cleanText(row.color),
      hex: cleanHex(row.hex),
      brand: cleanText(row.brand),
      finish: cleanText(row.finish),
      notes: cleanText(row.notes, MAX_NOTES),
      isActive: cleanBool(row.isActive, true),
      createdAt: cleanText(row.createdAt, 40) || now,
      updatedAt: cleanText(row.updatedAt, 40) || now,
    });
  }
  return out.filter((x) => x.type || x.color);
}

function migrateFromLegacy(data: { types?: unknown; colors?: unknown }) {
  const types = asList(data.types);
  const colors = asList(data.colors);
  const now = new Date().toISOString();
  const created: FilamentItem[] = [];

  if (types.length && colors.length) {
    for (const type of types) {
      for (const color of colors) {
        created.push({
          id: makeId(),
          type,
          color,
          hex: "",
          brand: "",
          finish: "",
          notes: "",
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    return created;
  }

  for (const type of types) {
    created.push({
      id: makeId(),
      type,
      color: "",
      hex: "",
      brand: "",
      finish: "",
      notes: "",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }
  for (const color of colors) {
    created.push({
      id: makeId(),
      type: "",
      color,
      hex: "",
      brand: "",
      finish: "",
      notes: "",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }
  return created;
}

async function getFilamentState() {
  const raw = await kv.get<unknown>(FILAMENTS_KEY);
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const items = normalizeItems(data.items);
  if (items.length > 0) return items;
  return migrateFromLegacy({ types: data.types, colors: data.colors });
}

async function persistItems(items: FilamentItem[]) {
  const updatedAt = new Date().toISOString();
  await kv.set(FILAMENTS_KEY, { items, updatedAt });
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.res;

    const items = await getFilamentState();
    const uniqueTypes = [...new Set(items.map((x) => x.type).filter(Boolean))];
    const uniqueColors = [...new Set(items.map((x) => x.color).filter(Boolean))];

    return json({
      ok: true,
      items,
      types: uniqueTypes,
      colors: uniqueColors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load filaments";
    return json({ error: message }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.res;

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const type = cleanText(body?.type);
    const color = cleanText(body?.color);
    const brand = cleanText(body?.brand);
    const finish = cleanText(body?.finish);
    const notes = cleanText(body?.notes, MAX_NOTES);
    const hex = cleanHex(body?.hex);
    const isActive = cleanBool(body?.isActive, true);

    if (!type && !color) return json({ error: "Type or color is required." }, 400);

    const items = await getFilamentState();
    const now = new Date().toISOString();
    const item: FilamentItem = {
      id: makeId(),
      type,
      color,
      hex,
      brand,
      finish,
      notes,
      isActive,
      createdAt: now,
      updatedAt: now,
    };
    const next = [item, ...items];
    await persistItems(next);

    return json({ ok: true, item, items: next });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create filament";
    return json({ error: message }, 500);
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.res;

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const id = cleanText(body?.id, 80);
    if (!id) return json({ error: "Missing filament id." }, 400);

    const items = await getFilamentState();
    const idx = items.findIndex((x) => x.id === id);
    if (idx === -1) return json({ error: "Filament not found." }, 404);

    const prev = items[idx];
    const nextType = hasOwn(body, "type") ? cleanText(body?.type) : prev.type;
    const nextColor = hasOwn(body, "color") ? cleanText(body?.color) : prev.color;
    const nextBrand = hasOwn(body, "brand") ? cleanText(body?.brand) : prev.brand;
    const nextFinish = hasOwn(body, "finish") ? cleanText(body?.finish) : prev.finish;
    const nextNotes = hasOwn(body, "notes") ? cleanText(body?.notes, MAX_NOTES) : prev.notes;
    const nextHex = hasOwn(body, "hex") ? cleanHex(body?.hex) : prev.hex;
    const nextIsActive = hasOwn(body, "isActive")
      ? cleanBool(body?.isActive, prev.isActive)
      : prev.isActive;

    const nextItem: FilamentItem = {
      ...prev,
      type: nextType,
      color: nextColor,
      hex: nextHex,
      brand: nextBrand,
      finish: nextFinish,
      notes: nextNotes,
      isActive: nextIsActive,
      updatedAt: new Date().toISOString(),
    };
    if (!nextItem.type && !nextItem.color) {
      return json({ error: "Type or color is required." }, 400);
    }

    const next = [...items];
    next[idx] = nextItem;
    await persistItems(next);

    return json({ ok: true, item: nextItem, items: next });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save filaments";
    return json({ error: message }, 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.res;

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const id = cleanText(body?.id, 80);
    if (!id) return json({ error: "Missing filament id." }, 400);

    const items = await getFilamentState();
    const next = items.filter((x) => x.id !== id);
    if (next.length === items.length) {
      return json({ error: "Filament not found." }, 404);
    }

    await persistItems(next);
    return json({ ok: true, items: next });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete filament";
    return json({ error: message }, 500);
  }
}
