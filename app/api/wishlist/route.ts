import { kv } from "@vercel/kv";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function key(userId: string) {
  return `user:${userId}:wishlist`;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ids = ((await kv.smembers<string[]>(key(userId))) ?? []) as string[];
  return NextResponse.json({ ids });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { productId?: string } | null;
  const productId = body?.productId?.trim();
  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

  await kv.sadd(key(userId), productId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { productId?: string } | null;
  const productId = body?.productId?.trim();
  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

  await kv.srem(key(userId), productId);
  return NextResponse.json({ ok: true });
}
