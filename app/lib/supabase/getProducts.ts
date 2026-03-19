import { supabase } from "./clients";

export type VanessaProduct = {
  SKU: string;
  name: string;
  slug: string;
  category: string;
  subCategory?: string;
  priceUSD?: number;
  description?: string;
  images?: string[];
  isNew?: boolean;
  featured?: boolean;
};

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }
  return undefined;
}

function normalizeImagePath(value: string) {
  const raw = value.trim();
  if (!raw) return "";

  const lower = raw.toLowerCase();
  if (lower === "placeholder" || lower === "placehoder" || lower === "palaceholder") {
    return "";
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return raw;
  return `/${raw.replace(/^\/+/, "")}`;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value
    .map((x) => (typeof x === "string" ? normalizeImagePath(x) : ""))
    .filter(Boolean);
}

function parseImages(value: unknown) {
  const direct = asStringArray(value);
  if (direct.length > 0) return direct;

  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return [] as string[];

    if (raw.startsWith("[") && raw.endsWith("]")) {
      try {
        return asStringArray(JSON.parse(raw));
      } catch {
        return [] as string[];
      }
    }

    const single = normalizeImagePath(raw);
    return single ? [single] : ([] as string[]);
  }

  return [] as string[];
}

function normalizeRow(input: unknown): VanessaProduct | null {
  if (!input || typeof input !== "object") return null;
  const row = input as Record<string, unknown>;

  const slug = asText(row.slug || row.Slug);
  const category = asText(row.category || row.Category);
  if (!slug || !category) return null;

  const sku = asText(row.SKU || row.sku || row.id);
  const name = asText(row.name || row.Name || row.title || row.Title);
  const subCategory = asText(row.subCategory || row.subcategory || row.SubCategory);
  const description = asText(
    row.description || row.Description || row.desc || row.shortDescription
  );
  const priceUSD = asNumber(row.priceUSD ?? row.PriceUSD ?? row.price);
  const isNew = asBoolean(row.isNew ?? row.IsNew);
  const featured = asBoolean(row.featured ?? row.Featured);

  const images = parseImages(row.images);
  if (images.length === 0) {
    const fallbackImage = normalizeImagePath(asText(row.image || row.Image));
    if (fallbackImage) images.push(fallbackImage);
  }

  return {
    SKU: sku || slug,
    name: name || slug.replace(/-/g, " "),
    slug,
    category,
    ...(subCategory ? { subCategory } : {}),
    ...(typeof priceUSD === "number" ? { priceUSD } : {}),
    ...(description ? { description } : {}),
    ...(images.length ? { images } : {}),
    ...(typeof isNew === "boolean" ? { isNew } : {}),
    ...(typeof featured === "boolean" ? { featured } : {}),
  };
}

export async function getProducts(): Promise<VanessaProduct[]> {
  const { data, error } = await supabase.from("vanessa").select("*");

  if (error) {
    throw new Error(error.message);
  }

  if (!Array.isArray(data)) return [];
  return data.map((row) => normalizeRow(row)).filter((x): x is VanessaProduct => Boolean(x));
}
