import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { products } from "@/app/data/products";

function pad3(n: number) {
  return String(n).padStart(3, "0");
}

function prefixFrom(category: string, subCategory: string) {
  const c = (category || "").trim().toLowerCase();
  const s = (subCategory || "").trim().toLowerCase();
  const cat2 = c.slice(0, 2).toUpperCase();
  const sub2 = s.slice(0, 2).toUpperCase();
  return `${cat2}${sub2}`;
}

export async function GET(req: Request) {
  // auth
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const primaryEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    "";
  const userEmail = primaryEmail.trim().toLowerCase();

  if (!adminEmail || userEmail !== adminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const category = url.searchParams.get("category") || "";
  const subCategory = url.searchParams.get("subCategory") || "";

  if (!category || !subCategory) {
    return NextResponse.json({ error: "Missing category/subCategory" }, { status: 400 });
  }

  const prefix = prefixFrom(category, subCategory);

  let max = 0;
  for (const p of products) {
    if (!p.id?.startsWith(prefix)) continue;
    const tail = p.id.slice(prefix.length);
    const num = Number(tail);
    if (Number.isFinite(num)) max = Math.max(max, num);
  }

  const nextId = `${prefix}${pad3(max + 1)}`;
  return NextResponse.json({ id: nextId, prefix, last: `${prefix}${pad3(max)}` });
}
