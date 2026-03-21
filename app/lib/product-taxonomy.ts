import type { Product } from "@/app/data/products";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

const PRODUCT_TAXONOMY_TABLE = "product_taxonomy";

export type ProductTaxonomyKind = "category" | "subCategory";

type ProductTaxonomyRow = {
  kind: ProductTaxonomyKind;
  value: string;
};

function slugifyValue(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mergeUnique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isMissingTaxonomyTableError(error: unknown) {
  if (!isRecord(error)) return false;
  const code = typeof error.code === "string" ? error.code : "";
  const message = typeof error.message === "string" ? error.message : "";
  return code === "42P01" || message.toLowerCase().includes(PRODUCT_TAXONOMY_TABLE);
}

function missingTableMessage() {
  return "Missing Supabase table `product_taxonomy`. Run `supabase/product-taxonomy.sql` once, then try again.";
}

function deriveOptionsFromProducts(products: Pick<Product, "category" | "subCategory">[]) {
  return {
    categories: mergeUnique(products.map((product) => product.category || "")),
    subCategories: mergeUnique(products.map((product) => product.subCategory || "")),
  };
}

export async function getProductTaxonomyOptions(
  productsFallback: Pick<Product, "category" | "subCategory">[] = []
) {
  const fallback = deriveOptionsFromProducts(productsFallback);

  const { data, error } = await supabaseAdmin
    .from(PRODUCT_TAXONOMY_TABLE)
    .select("kind, value")
    .order("value", { ascending: true });

  if (error) {
    if (isMissingTaxonomyTableError(error)) return fallback;
    throw new Error(error.message);
  }

  const rows = Array.isArray(data) ? (data as ProductTaxonomyRow[]) : [];
  return {
    categories: mergeUnique([
      ...fallback.categories,
      ...rows.filter((row) => row.kind === "category").map((row) => row.value),
    ]),
    subCategories: mergeUnique([
      ...fallback.subCategories,
      ...rows.filter((row) => row.kind === "subCategory").map((row) => row.value),
    ]),
  };
}

export async function ensureProductTaxonomyValues(input: {
  categories?: string[];
  subCategories?: string[];
}) {
  const rows: ProductTaxonomyRow[] = [
    ...(input.categories || []).map((value) => ({
      kind: "category" as const,
      value: slugifyValue(value),
    })),
    ...(input.subCategories || []).map((value) => ({
      kind: "subCategory" as const,
      value: slugifyValue(value),
    })),
  ].filter((row) => row.value);

  if (rows.length === 0) {
    return { categories: [] as string[], subCategories: [] as string[] };
  }

  const { error } = await supabaseAdmin
    .from(PRODUCT_TAXONOMY_TABLE)
    .upsert(rows, { onConflict: "kind,value", ignoreDuplicates: true });

  if (error) {
    if (isMissingTaxonomyTableError(error)) {
      throw new Error(missingTableMessage());
    }
    throw new Error(error.message);
  }

  return {
    categories: rows.filter((row) => row.kind === "category").map((row) => row.value),
    subCategories: rows.filter((row) => row.kind === "subCategory").map((row) => row.value),
  };
}
