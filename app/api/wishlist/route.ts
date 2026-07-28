import { NextResponse } from "next/server";
import { requireSupabaseUser } from "@/app/lib/supabase/auth-server";
import {
  addProductToCollection,
  getProductCollection,
  removeProductFromCollection,
} from "@/app/lib/supabase/user-data";

const TABLE = "user_wishlist";

function getProductId(body: unknown) {
  if (!body || typeof body !== "object") return "";
  const productId = (body as { productId?: unknown }).productId;
  return typeof productId === "string" ? productId.trim() : "";
}

export async function GET(req: Request) {
  const auth = await requireSupabaseUser(req);
  if ("response" in auth) return auth.response;

  const ids = await getProductCollection(auth.userId, TABLE);
  return NextResponse.json({ ids });
}

export async function POST(req: Request) {
  const auth = await requireSupabaseUser(req);
  if ("response" in auth) return auth.response;

  const productId = getProductId(await req.json().catch(() => null));
  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

  await addProductToCollection(auth.userId, TABLE, productId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const auth = await requireSupabaseUser(req);
  if ("response" in auth) return auth.response;

  const productId = getProductId(await req.json().catch(() => null));
  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

  await removeProductFromCollection(auth.userId, TABLE, productId);
  return NextResponse.json({ ok: true });
}
