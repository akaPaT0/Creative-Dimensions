import type { Product } from "@/app/data/products";
import { supabase } from "@/app/lib/supabase/clients";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

const PRODUCTS_TABLE = "products";

type SupabaseProductRow = {
  SKU: string;
  Name: string;
  slug: string;
  category: string;
  subCategory: string;
  priceUSD: number;
  description: string;
  images: string;
  isNew: boolean | null;
  featured: boolean | null;
};

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

function isValidImagePath(value: string) {
  const v = value.trim();
  if (!v) return false;
  if (v.toLowerCase() === "placeholder") return false;
  if (v.toLowerCase() === "placehoder") return false;
  if (v.toLowerCase() === "palaceholder") return false;
  if (v.startsWith("/")) return true;
  if (v.startsWith("http://") || v.startsWith("https://")) return true;
  return false;
}

function parseImagesField(value: unknown) {
  const directArray = asStringArray(value).filter(isValidImagePath);
  if (directArray.length > 0) return directArray;

  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return [] as string[];

    if (raw.startsWith("[") && raw.endsWith("]")) {
      try {
        return asStringArray(JSON.parse(raw)).filter(isValidImagePath);
      } catch {
        return [] as string[];
      }
    }

    return isValidImagePath(raw) ? [raw] : [];
  }

  return [];
}

function normalizeProduct(input: unknown): Product | null {
  if (!input || typeof input !== "object") return null;

  const row = input as Record<string, unknown>;

  const id = asText(row.id || row.SKU || row.sku);
  const name = asText(row.name || row.Name || row.title || row.Title);
  const slug = asText(row.slug || row.Slug);
  const category = asText(row.category || row.Category);
  const description = asText(
    row.description || row.Description || row.desc || row.shortDescription
  );
  const priceUSD = asNumber(row.priceUSD ?? row.PriceUSD ?? row.price, 0);

  if (!id || !name || !slug || !category) return null;

  const image = asText(row.image || row.Image);
  const images = parseImagesField(row.images);
  const subCategory = asText(row.subCategory || row.subcategory || row.SubCategory);

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
  return raw.map((x) => normalizeProduct(x)).filter((x): x is Product => Boolean(x));
}

function toSupabaseRow(product: Product): SupabaseProductRow {
  const imgArray =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [];

  const images = imgArray.length > 0 ? JSON.stringify(imgArray) : "placeholder";

  return {
    SKU: asText(product.id),
    Name: asText(product.name),
    slug: asText(product.slug),
    category: asText(product.category),
    subCategory: asText(product.subCategory),
    priceUSD: asNumber(product.priceUSD, 0),
    description: asText(product.description),
    images,
    isNew: product.isNew === true ? true : null,
    featured: product.featured === true ? true : null,
  };
}

async function queryProducts(caller: string) {
  const { data, error } = await supabase.from(PRODUCTS_TABLE).select("*");
  console.log(`[products-db:${caller}] data:`, data);
  console.log(`[products-db:${caller}] error:`, error);

  if (error) return [];
  return normalizeProducts(data);
}

async function getProductsFromSupabase() {
  return queryProducts("getProductsFromSupabase");
}

export async function getShopProducts() {
  return queryProducts("getShopProducts");
}

export async function getProductsFromDb() {
  return getProductsFromSupabase();
}

export async function getProducts() {
  return getProductsFromDb();
}

export async function saveProducts(products: Product[]) {
  const currentRowsRes = await supabaseAdmin.from(PRODUCTS_TABLE).select("SKU");
  if (currentRowsRes.error) throw new Error(currentRowsRes.error.message);

  const currentSkus = new Set(
    (currentRowsRes.data || [])
      .map((r) => asText((r as Record<string, unknown>).SKU))
      .filter(Boolean)
  );

  const nextRows = new Map<string, SupabaseProductRow>();
  for (const product of products) {
    const row = toSupabaseRow(product);
    if (!row.SKU || !row.Name || !row.slug || !row.category) continue;
    nextRows.set(row.SKU, row);
  }

  for (const sku of currentSkus) {
    if (nextRows.has(sku)) continue;
    const del = await supabaseAdmin.from(PRODUCTS_TABLE).delete().eq("SKU", sku);
    if (del.error) throw new Error(del.error.message);
  }

  for (const row of nextRows.values()) {
    const del = await supabaseAdmin.from(PRODUCTS_TABLE).delete().eq("SKU", row.SKU);
    if (del.error) throw new Error(del.error.message);

    const ins = await supabaseAdmin.from(PRODUCTS_TABLE).insert(row);
    if (ins.error) throw new Error(ins.error.message);
  }
}

export async function upsertProduct(product: Product) {
  const row = toSupabaseRow(product);
  if (!row.SKU || !row.Name || !row.slug || !row.category) {
    throw new Error("Invalid product payload for upsert");
  }

  const del = await supabaseAdmin.from(PRODUCTS_TABLE).delete().eq("SKU", row.SKU);
  if (del.error) throw new Error(del.error.message);

  const ins = await supabaseAdmin.from(PRODUCTS_TABLE).insert(row);
  if (ins.error) throw new Error(ins.error.message);

  return product;
}

export async function removeProduct(productId: string) {
  const all = await getProducts();
  const target = all.find((x) => x.id === productId) || null;

  const del = await supabaseAdmin.from(PRODUCTS_TABLE).delete().eq("SKU", productId);
  if (del.error) throw new Error(del.error.message);

  return target;
}