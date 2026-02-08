import { list, put } from "@vercel/blob";
import type { Product } from "@/app/data/products";

const CATALOG_PATH = "catalog/products.json";

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
  const rows = await list({ prefix: CATALOG_PATH, limit: 20 });
  const matches = rows.blobs.filter((b) => b.pathname === CATALOG_PATH);
  if (!matches.length) return [];
  matches.sort((a, b) => {
    const aTime = new Date(a.uploadedAt || 0).getTime();
    const bTime = new Date(b.uploadedAt || 0).getTime();
    return bTime - aTime;
  });
  const latest = matches[0];
  const res = await fetch(latest.url, { cache: "no-store" });
  if (!res.ok) return [];
  const raw = (await res.json().catch(() => null)) as unknown;
  return normalizeProducts(raw);
}

export async function getProducts() {
  return getProductsFromDb();
}

export async function saveProducts(products: Product[]) {
  const payload = JSON.stringify(products, null, 2);
  await put(CATALOG_PATH, payload, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
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

