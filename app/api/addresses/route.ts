import { NextResponse } from "next/server";
import { requireSupabaseUser } from "@/app/lib/supabase/auth-server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

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

function toClient(row: Record<string, unknown>) {
  return {
    id: asText(row.id),
    label: asText(row.label),
    fullName: asText(row.full_name),
    phone: asText(row.phone),
    line1: asText(row.line1),
    line2: asText(row.line2),
    city: asText(row.city),
    state: asText(row.state),
    postalCode: asText(row.postal_code),
    country: asText(row.country) || "US",
    isDefault: row.is_default === true,
    createdAt: asText(row.created_at),
    updatedAt: asText(row.updated_at),
  };
}

async function clearDefault(userId: string) {
  const { error } = await supabaseAdmin
    .from("user_addresses")
    .update({ is_default: false })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function GET(req: Request) {
  const auth = await requireSupabaseUser(req);
  if ("response" in auth) return auth.response;

  const { data, error } = await supabaseAdmin
    .from("user_addresses")
    .select("*")
    .eq("user_id", auth.userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ addresses: (data ?? []).map(toClient) });
}

export async function POST(req: Request) {
  const auth = await requireSupabaseUser(req);
  if ("response" in auth) return auth.response;

  const input = normalizeInput(await req.json().catch(() => null));
  const error = validateAddressInput(input);
  if (error) return NextResponse.json({ error }, { status: 400 });

  if (input.isDefault) await clearDefault(auth.userId);

  const { data, error: insertError } = await supabaseAdmin
    .from("user_addresses")
    .insert({
      user_id: auth.userId,
      label: input.label || "Address",
      full_name: input.fullName,
      phone: input.phone,
      line1: input.line1,
      line2: input.line2 || "",
      city: input.city,
      state: input.state,
      postal_code: input.postalCode,
      country: input.country || "US",
      is_default: input.isDefault === true,
    })
    .select("*")
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json({ ok: true, address: toClient(data as Record<string, unknown>) });
}

export async function PUT(req: Request) {
  const auth = await requireSupabaseUser(req);
  if ("response" in auth) return auth.response;

  const input = normalizeInput(await req.json().catch(() => null));
  if (!input.id) return NextResponse.json({ error: "Address id is required" }, { status: 400 });

  const error = validateAddressInput(input);
  if (error) return NextResponse.json({ error }, { status: 400 });
  if (input.isDefault) await clearDefault(auth.userId);

  const { data, error: updateError } = await supabaseAdmin
    .from("user_addresses")
    .update({
      label: input.label || "Address",
      full_name: input.fullName,
      phone: input.phone,
      line1: input.line1,
      line2: input.line2 || "",
      city: input.city,
      state: input.state,
      postal_code: input.postalCode,
      country: input.country || "US",
      is_default: input.isDefault === true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("user_id", auth.userId)
    .select("*")
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ ok: true, address: toClient(data as Record<string, unknown>) });
}

export async function DELETE(req: Request) {
  const auth = await requireSupabaseUser(req);
  if ("response" in auth) return auth.response;

  const input = normalizeInput(await req.json().catch(() => null));
  if (!input.id) return NextResponse.json({ error: "Address id is required" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("user_addresses")
    .delete()
    .eq("id", input.id)
    .eq("user_id", auth.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
