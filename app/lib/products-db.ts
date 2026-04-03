import type { Product } from "@/app/data/products";
import { supabase } from "@/app/lib/supabase/clients";

const TABLE = "products";

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
  return value === true;
}

function asStringArray(value: unknown) {
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

  return {
    id,
    name,
    slug,
    category,
    subCategory: subCategory || undefined,
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
    image: product.image ?? null,
    images: product.images ?? [],
    customizeColors: product.customizeColors ?? null,
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

export async function getProducts() {
  return getProductsFromDb();
}

export async function saveProducts(products: Product[]) {
  const current = await getProducts();
  const incomingIds = new Set(products.map((p) => p.id));
  const idsToDelete = current
    .map((p) => p.id)
    .filter((id) => !incomingIds.has(id));

  if (idsToDelete.length) {
    const { error: deleteError } = await supabase
      .from(TABLE)
      .delete()
      .in("SKU", idsToDelete);

    if (deleteError) {
      throw deleteError;
    }
  }

  if (!products.length) return;

  const rows = products.map(toDbRow);

  const { error: upsertError } = await supabase
    .from(TABLE)
    .upsert(rows, { onConflict: "SKU" });

  if (upsertError) {
    throw upsertError;
  }
}

export async function upsertProduct(product: Product) {
  const row = toDbRow(product);

  const { error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: "SKU" });

  if (error) {
    throw error;
  }

  return product;
}

export async function removeProduct(productId: string) {
  const all = await getProducts();
  const target = all.find((x) => x.id === productId) || null;

  const { error } = await supabase.from(TABLE).delete().eq("SKU", productId);

  if (error) {
    throw error;
  }

  return target;
}
