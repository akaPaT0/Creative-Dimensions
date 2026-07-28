import { NextResponse } from "next/server";
import { getProducts } from "@/app/lib/products-db";
import { requireSupabaseAdmin } from "@/app/lib/supabase/auth-server";

function json(res: unknown, status = 200) {
  return NextResponse.json(res, { status });
}

export async function GET(req: Request) {
  try {
    const admin = await requireSupabaseAdmin(req);
    if ("response" in admin) return admin.response;

    const products = await getProducts();
    return json({ ok: true, products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load products";
    return json({ error: message }, 500);
  }
}

