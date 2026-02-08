import { kv } from "@vercel/kv";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

type AddressInput = {
  id?: string;
  label?: string;
  fullName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
};

function key(userId: string) {
  return `user:${userId}:addresses`;
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeInput(raw: unknown): AddressInput {
  if (!raw || typeof raw !== "object") return {};
  const body = raw as Record<string, unknown>;
  return {
    id: asText(body.id),
    label: asText(body.label),
    fullName: asText(body.fullName),
    phone: asText(body.phone),
    line1: asText(body.line1),
    line2: asText(body.line2),
    city: asText(body.city),
    state: asText(body.state),
    postalCode: asText(body.postalCode),
    country: asText(body.country),
    isDefault: body.isDefault === true,
  };
}

function validateAddressInput(input: AddressInput) {
  if (!input.fullName) return "Full name is required";
  if (!input.phone) return "Phone is required";
  if (!input.line1) return "Address line 1 is required";
  if (!input.city) return "City is required";
  if (!input.state) return "State/Province is required";
  if (!input.postalCode) return "Postal code is required";
  if (!input.country) return "Country is required";
  return null;
}

function normalizeStored(raw: unknown): Address[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => ({
      id: asText(x.id),
      label: asText(x.label),
      fullName: asText(x.fullName),
      phone: asText(x.phone),
      line1: asText(x.line1),
      line2: asText(x.line2),
      city: asText(x.city),
      state: asText(x.state),
      postalCode: asText(x.postalCode),
      country: asText(x.country) || "US",
      isDefault: x.isDefault === true,
      createdAt: asText(x.createdAt),
      updatedAt: asText(x.updatedAt),
    }))
    .filter((x) => x.id && x.fullName && x.line1 && x.city && x.postalCode);
}

function ensureDefault(addresses: Address[]) {
  if (addresses.length === 0) return addresses;
  const hasDefault = addresses.some((x) => x.isDefault);
  if (hasDefault) return addresses;
  return addresses.map((x, idx) => (idx === 0 ? { ...x, isDefault: true } : x));
}

async function loadAddresses(userId: string) {
  const raw = await kv.get<unknown>(key(userId));
  return ensureDefault(normalizeStored(raw));
}

async function saveAddresses(userId: string, addresses: Address[]) {
  await kv.set(key(userId), ensureDefault(addresses));
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const addresses = await loadAddresses(userId);
  return NextResponse.json({ addresses });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const input = normalizeInput(body);
  const error = validateAddressInput(input);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const now = new Date().toISOString();
  const newAddress: Address = {
    id: crypto.randomUUID(),
    label: input.label || "Address",
    fullName: input.fullName || "",
    phone: input.phone || "",
    line1: input.line1 || "",
    line2: input.line2 || "",
    city: input.city || "",
    state: input.state || "",
    postalCode: input.postalCode || "",
    country: input.country || "US",
    isDefault: input.isDefault === true,
    createdAt: now,
    updatedAt: now,
  };

  const current = await loadAddresses(userId);
  const next = newAddress.isDefault
    ? [newAddress, ...current.map((x) => ({ ...x, isDefault: false }))]
    : [...current, newAddress];

  await saveAddresses(userId, next);
  return NextResponse.json({ ok: true, address: newAddress });
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const input = normalizeInput(body);
  if (!input.id) {
    return NextResponse.json({ error: "Address id is required" }, { status: 400 });
  }

  const error = validateAddressInput(input);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const current = await loadAddresses(userId);
  const index = current.findIndex((x) => x.id === input.id);
  if (index < 0) return NextResponse.json({ error: "Address not found" }, { status: 404 });

  const prev = current[index];
  const updated: Address = {
    ...prev,
    label: input.label || "Address",
    fullName: input.fullName || "",
    phone: input.phone || "",
    line1: input.line1 || "",
    line2: input.line2 || "",
    city: input.city || "",
    state: input.state || "",
    postalCode: input.postalCode || "",
    country: input.country || "US",
    isDefault: input.isDefault === true,
    updatedAt: new Date().toISOString(),
  };

  const next = current.map((x, i) => {
    if (i === index) return updated;
    if (updated.isDefault) return { ...x, isDefault: false };
    return x;
  });

  await saveAddresses(userId, next);
  return NextResponse.json({ ok: true, address: updated });
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const input = normalizeInput(body);
  if (!input.id) {
    return NextResponse.json({ error: "Address id is required" }, { status: 400 });
  }

  const current = await loadAddresses(userId);
  const next = current.filter((x) => x.id !== input.id);

  if (next.length === current.length) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  await saveAddresses(userId, next);
  return NextResponse.json({ ok: true });
}
