import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ensureProductTaxonomyValues, getProductTaxonomyOptions } from "@/app/lib/product-taxonomy";
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
    const options = await getProductTaxonomyOptions(products);
    return json({ ok: true, options });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load taxonomy";
    return json({ error: message }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.res;

    const body = (await req.json().catch(() => ({}))) as {
      categories?: unknown;
      subCategories?: unknown;
      value?: unknown;
      kind?: unknown;
    };

    const categories = Array.isArray(body.categories)
      ? body.categories.filter((value): value is string => typeof value === "string")
      : typeof body.kind === "string" &&
          body.kind === "category" &&
          typeof body.value === "string"
        ? [body.value]
        : [];

    const subCategories = Array.isArray(body.subCategories)
      ? body.subCategories.filter((value): value is string => typeof value === "string")
      : typeof body.kind === "string" &&
          body.kind === "subCategory" &&
          typeof body.value === "string"
        ? [body.value]
        : [];

    if (categories.length === 0 && subCategories.length === 0) {
      return json({ error: "Missing taxonomy values" }, 400);
    }

    await ensureProductTaxonomyValues({ categories, subCategories });
    const products = await getProducts();
    const options = await getProductTaxonomyOptions(products);
    return json({ ok: true, options });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save taxonomy";
    return json({ error: message }, 500);
  }
}
