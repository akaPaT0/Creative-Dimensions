import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getProducts } from "@/app/lib/products-db";

function json(res: unknown, status = 200) {
  return NextResponse.json(res, { status });
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

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.res;

    const products = await getProducts();
    return json({ ok: true, products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load products";
    return json({ error: message }, 500);
  }
}

