import { products as fallbackProducts, type Product } from "@/app/data/products";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

const PRODUCTS_TABLE = "products";

type ProductCustomizeColors = NonNullable<Product["customizeColors"]>;

type SupabaseProductRow = {
  SKU: string;
  Name: string;
  slug: string;
  category: string;
  subCategory: string;
  priceUSD: number;
  description: string;
  images: string | null;
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
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
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

function normalizeCustomizeColors(value: unknown): ProductCustomizeColors | undefined {
  if (!value || typeof value !== "object") return undefined;

  const row = value as Record<string, unknown>;
  const modelUrl = asText(row.modelUrl);
  if (!modelUrl) return undefined;

  const defaultHexes = asStringArray(row.defaultHexes);
  const slotLabels = asStringArray(row.slotLabels);

  return {
    modelUrl,
    defaultHexes: defaultHexes.length ? defaultHexes : ["#ffffff"],
    ...(slotLabels.length ? { slotLabels } : {}),
  };
}

function parseImageList(value: unknown) {
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

function parseStoredAssetsObject(value: Record<string, unknown>) {
  const image = asText(value.image || value.Image);
  const imageList = parseImageList(value.images ?? value.Images);
  const finalImages =
    imageList.length > 0
      ? imageList
      : isValidImagePath(image)
        ? [image]
        : [];
  const fallbackImage = isValidImagePath(image) ? image : finalImages[0] || "";

  return {
    image: fallbackImage || undefined,
    images: finalImages.length ? finalImages : undefined,
    customizeColors: normalizeCustomizeColors(value.customizeColors),
  };
}

function parseStoredAssets(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return parseStoredAssetsObject(value as Record<string, unknown>);
  }

  if (typeof value === "string") {
    const raw = value.trim();
    if (raw.startsWith("{") && raw.endsWith("}")) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parseStoredAssetsObject(parsed as Record<string, unknown>);
        }
      } catch {
        // fall through to the legacy string parser below
      }
    }
  }

  const images = parseImageList(value);
  return {
    image: images[0] || undefined,
    images: images.length ? images : undefined,
    customizeColors: undefined,
  };
}

function serializeAssetsField(product: Product) {
  const image = asText(product.image);
  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images.filter(isValidImagePath)
      : isValidImagePath(image)
        ? [image]
        : [];
  const customizeColors = normalizeCustomizeColors(product.customizeColors);

  if (!images.length && !customizeColors) {
    return "placeholder";
  }

  if (!customizeColors && !image) {
    return JSON.stringify(images);
  }

  const payload: Record<string, unknown> = {};
  if (images.length) payload.images = images;
  if (isValidImagePath(image) && image !== images[0]) payload.image = image;
  if (customizeColors) payload.customizeColors = customizeColors;

  return JSON.stringify(payload);
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

  const storedAssets = parseStoredAssets(row.images ?? row.Images);
  const image = storedAssets.image || asText(row.image || row.Image);
  const images = storedAssets.images || parseImageList(row.images ?? row.Images);
  const subCategory = asText(row.subCategory || row.subcategory || row.SubCategory);
  const fallbackProduct =
    fallbackProducts.find((entry) => entry.id === id) ||
    fallbackProducts.find((entry) => entry.category === category && entry.slug === slug);
  const customizeColors =
    storedAssets.customizeColors ||
    normalizeCustomizeColors(row.customizeColors) ||
    fallbackProduct?.customizeColors;

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
    image: isValidImagePath(image) ? image : images[0] || undefined,
    images: images.length ? images : undefined,
    customizeColors,
  };
}

function normalizeProducts(raw: unknown): Product[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => normalizeProduct(entry)).filter((entry): entry is Product => Boolean(entry));
}

function toSupabaseRow(product: Product): SupabaseProductRow {
  return {
    SKU: asText(product.id),
    Name: asText(product.name),
    slug: asText(product.slug),
    category: asText(product.category),
    subCategory: asText(product.subCategory),
    priceUSD: asNumber(product.priceUSD, 0),
    description: asText(product.description),
    images: serializeAssetsField(product),
    isNew: product.isNew === true ? true : null,
    featured: product.featured === true ? true : null,
  };
}

async function queryProducts() {
  const { data, error } = await supabaseAdmin
    .from(PRODUCTS_TABLE)
    .select("*")
    .order("category", { ascending: true })
    .order("slug", { ascending: true });

  if (error) throw new Error(error.message);
  return normalizeProducts(data);
}

async function getProductsFromSupabase() {
  return queryProducts();
}

export async function getShopProducts() {
  return queryProducts();
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
      .map((row) => asText((row as Record<string, unknown>).SKU))
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
  const target = all.find((entry) => entry.id === productId) || null;

  const del = await supabaseAdmin.from(PRODUCTS_TABLE).delete().eq("SKU", productId);
  if (del.error) throw new Error(del.error.message);

  return target;
}
