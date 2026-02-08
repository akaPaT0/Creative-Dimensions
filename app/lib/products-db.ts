import { kv } from "@vercel/kv";
import type { Product } from "@/app/data/products";

const PRODUCTS_KEY = "catalog:products:v1";

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
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
  const id = asText(row.id);
  const name = asText(row.name);
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
  return raw.map((x) => normalizeProduct(x)).filter((x): x is Product => Boolean(x));
}

export async function getProductsFromDb() {
  const raw = await kv.get<unknown>(PRODUCTS_KEY);
  return normalizeProducts(raw);
}

export async function getProducts() {
  return getProductsFromDb();
}

export async function saveProducts(products: Product[]) {
  await kv.set(PRODUCTS_KEY, products);
}

export async function upsertProduct(product: Product) {
  const all = await getProducts();
  const idx = all.findIndex((p) => p.id === product.id);
  if (idx === -1) {
    await saveProducts([product, ...all]);
    return product;
  }
  const next = [...all];
  next[idx] = product;
  await saveProducts(next);
  return product;
}

export async function removeProduct(productId: string) {
  const all = await getProducts();
  const target = all.find((x) => x.id === productId) || null;
  const next = all.filter((x) => x.id !== productId);
  await saveProducts(next);
  return target;
}

