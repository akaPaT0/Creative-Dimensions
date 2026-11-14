import type { Product } from "@/app/data/products";
import { unstable_cache, revalidateTag } from "next/cache";
import { supabase } from "@/app/lib/supabase/clients";
import { normalizeVariants } from "@/app/lib/product-variants";
import { normalizePersonalization } from "@/app/lib/product-personalization";
import { normalizePriceOptions } from "@/app/lib/product-options";

const TABLE = "products";

/**
 * Writes need the service-role client: the products table only allows public
 * reads (RLS). Loaded lazily so read-only pages never depend on the admin key.
 */
async function writeClient() {
  const { supabaseAdmin } = await import("@/app/lib/supabase/admin");
  return supabaseAdmin;
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseJsonSafe(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asBool(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function asStringArray(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [] as string[];

    const parsed = parseJsonSafe(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((x) => (typeof x === "string" ? x.trim() : ""))
        .filter(Boolean);
    }

    return [trimmed];
  }

  if (!Array.isArray(value)) return [] as string[];
  return value
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
}

function normalizeProduct(input: unknown): Product | null {
  if (!input || typeof input !== "object") return null;

  const row = input as Record<string, unknown>;
  const id = asText(row.id) || asText(row.SKU);
  const name = asText(row.name) || asText(row.Name);
  const slug = asText(row.slug);
  const category = asText(row.category);
  const description = asText(row.description);
  const priceUSD = asNumber(row.priceUSD, 0);

  if (!id || !name || !slug || !category) return null;

  const image = asText(row.image);
  const images = asStringArray(row.images);
  const subCategory = asText(row.subCategory);

  const customizeColorsRaw =
    row.customizeColors && typeof row.customizeColors === "object"
      ? (row.customizeColors as Record<string, unknown>)
      : null;

  const customizeColors =
    customizeColorsRaw && asText(customizeColorsRaw.modelUrl)
      ? {
          modelUrl: asText(customizeColorsRaw.modelUrl),
          defaultHexes: asStringArray(customizeColorsRaw.defaultHexes),
          slotLabels: asStringArray(customizeColorsRaw.slotLabels),
        }
      : undefined;

  const variants = normalizeVariants(row.variants, images);
  const personalization = normalizePersonalization(row.personalization);
  const priceOptions = normalizePriceOptions(row.priceOptions);

  return {
    id,
    name,
    slug,
    category,
    subCategory: subCategory || undefined,
    variants: variants.length ? variants : undefined,
    personalization,
    priceOptions: priceOptions.length ? priceOptions : undefined,
    priceUSD,
    description,
    isNew: asBool(row.isNew) || undefined,
    featured: asBool(row.featured) || undefined,
    image: image || undefined,
    images: images.length ? images : undefined,
    customizeColors:
      customizeColors && customizeColors.defaultHexes.length
        ? {
            modelUrl: customizeColors.modelUrl,
            defaultHexes: customizeColors.defaultHexes,
            slotLabels: customizeColors.slotLabels?.length
              ? customizeColors.slotLabels
              : undefined,
          }
        : customizeColors,
  };
}

function normalizeProducts(raw: unknown): Product[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => normalizeProduct(x))
    .filter((x): x is Product => Boolean(x));
}

function toDbRow(product: Product) {
  return {
    SKU: product.id,
    Name: product.name,
    slug: product.slug,
    category: product.category,
    subCategory: product.subCategory ?? null,
    priceUSD: product.priceUSD,
    description: product.description,
    isNew: product.isNew ?? false,
    featured: product.featured ?? false,
    images: JSON.stringify(product.images ?? []),
    // Only write variants when set, so saves that don't know about them keep the stored value.
    ...(product.variants !== undefined
      ? { variants: product.variants.length ? product.variants : null }
      : {}),
    // Only written when set or being switched off (null), so saves that don't
    // know about them keep the stored value, and ordinary products still save
    // before the `personalization` / `priceOptions` columns exist.
    ...(product.personalization !== undefined
      ? { personalization: product.personalization ?? null }
      : {}),
    ...(product.priceOptions !== undefined
      ? { priceOptions: product.priceOptions?.length ? product.priceOptions : null }
      : {}),
  };
}

export async function getProductsFromDb() {
  const { data, error } = await supabase.from(TABLE).select("*");

  if (error) {
    console.error("Failed to load products from Supabase:", error);
    return [];
  }

  return normalizeProducts(data);
}

// Cache product list for 60 s; invalidated whenever a product is mutated
export const getProducts = unstable_cache(
  async () => getProductsFromDb(),
  ["products-list"],
  { revalidate: 60, tags: ["products"] }
);

export async function saveProducts(products: Product[]) {
  const current = await getProductsFromDb(); // bypass cache for accurate diff
  const incomingIds = new Set(products.map((p) => p.id));
  const idsToDelete = current
    .map((p) => p.id)
    .filter((id) => !incomingIds.has(id));

  if (idsToDelete.length) {
    const { error: deleteError } = await (await writeClient())
      .from(TABLE)
      .delete()
      .in("SKU", idsToDelete);

    if (deleteError) {
      throw deleteError;
    }
  }

  // The table's primary key spans many columns (not just SKU), so ON CONFLICT
  // upserts don't work. Update existing rows by SKU (only when changed) and
  // insert new ones.
  const currentRows = new Map(current.map((p) => [p.id, JSON.stringify(toDbRow(p))]));
  const client = await writeClient();

  for (const product of products) {
    const row = toDbRow(product);
    const existing = currentRows.get(product.id);
    if (existing === JSON.stringify(row)) continue;

    const { error } = existing
      ? await client.from(TABLE).update(row).eq("SKU", product.id)
      : await client.from(TABLE).insert(row);
    if (error) throw error;
  }

  (revalidateTag as Function)("products");
}

export async function upsertProduct(product: Product) {
  const row = toDbRow(product);
  const client = await writeClient();

  const { data: existing, error: lookupError } = await client
    .from(TABLE)
    .select("SKU")
    .eq("SKU", product.id)
    .maybeSingle();
  if (lookupError) throw lookupError;

  const { error } = existing
    ? await client.from(TABLE).update(row).eq("SKU", product.id)
    : await client.from(TABLE).insert(row);
  if (error) throw error;

  (revalidateTag as Function)("products");
  return product;
}

/** Update only the New / Featured flags of one product, leaving every other column alone. */
export async function setProductFlags(
  productId: string,
  flags: { isNew?: boolean; featured?: boolean }
) {
  const patch: { isNew?: boolean; featured?: boolean } = {};
  if (typeof flags.isNew === "boolean") patch.isNew = flags.isNew;
  if (typeof flags.featured === "boolean") patch.featured = flags.featured;
  if (Object.keys(patch).length === 0) throw new Error("Nothing to update");

  const { data, error } = await (await writeClient())
    .from(TABLE)
    .update(patch)
    .eq("SKU", productId)
    .select("SKU, isNew, featured");
  if (error) throw error;
  if (!data || data.length === 0) return null;

  (revalidateTag as Function)("products");
  return { isNew: asBool(data[0].isNew), featured: asBool(data[0].featured) };
}

export async function removeProduct(productId: string) {
  const all = await getProductsFromDb(); // bypass cache for accurate lookup
  const target = all.find((x) => x.id === productId) || null;

  const { error } = await (await writeClient()).from(TABLE).delete().eq("SKU", productId);

  if (error) {
    throw error;
  }
  (revalidateTag as Function)("products");
  return target;
}
