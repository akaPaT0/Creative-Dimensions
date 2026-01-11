import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { auth } from "@clerk/nextjs/server";
import { products } from "@/app/data/products";

function wishlistKey(userId: string) {
  return `wishlist:${userId}`;
}

// Optional: validate product id exists
function productIdExists(id: string) {
  const nid = (id || "").trim();
  return products.some((p: any) => String(p.id) === nid);
}

// GET => returns ["KECU001", "KECA008", ...]
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ids = (await kv.smembers(wishlistKey(userId))) as string[];
  return NextResponse.json({ ids: ids ?? [] });
}

// POST { id: "KECA008" } => toggles add/remove and returns { ids, added }
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const id = String(body?.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Loosen/disable this if you want to wishlist future IDs not yet in products.ts
  if (!productIdExists(id)) {
    return NextResponse.json({ error: "Unknown product id" }, { status: 400 });
  }

  const key = wishlistKey(userId);

  const isMember = (await kv.sismember(key, id)) as unknown as number | boolean;
  const exists = isMember === true || isMember === 1;

  let added = false;

  if (exists) {
    await kv.srem(key, id);
    added = false;
  } else {
    await kv.sadd(key, id);
    added = true;
  }

  const ids = (await kv.smembers(key)) as string[];
  return NextResponse.json({ ids: ids ?? [], added });
}
