import type { Product, ProductPriceOption } from "@/app/data/products";
import type { CartCustomization } from "@/app/lib/cart-items";

export const MAX_PRICE_OPTIONS = 12;

/** Parse the stored `priceOptions` column: keep valid, uniquely named options with a price. */
export function normalizePriceOptions(raw: unknown): ProductPriceOption[] {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const out: ProductPriceOption[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const label = typeof row.label === "string" ? row.label.replace(/\s+/g, " ").trim().slice(0, 40) : "";
    const price = Number(row.priceUSD);
    if (!label || !Number.isFinite(price) || price < 0) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label, priceUSD: Math.round(price * 100) / 100 });
    if (out.length >= MAX_PRICE_OPTIONS) break;
  }
  return out;
}

export function findPriceOption(product: Pick<Product, "priceOptions">, label: string | undefined) {
  if (!label || !product.priceOptions?.length) return null;
  const key = label.toLowerCase();
  return product.priceOptions.find((o) => o.label.toLowerCase() === key) ?? null;
}

/**
 * Price for one unit of a cart line: the chosen option's price, otherwise the
 * product's base price. Prices always come from the product, never from the cart.
 */
export function unitPriceFor(
  product: Pick<Product, "priceUSD" | "priceOptions">,
  customization?: Pick<CartCustomization, "option">
) {
  return findPriceOption(product, customization?.option?.label)?.priceUSD ?? product.priceUSD;
}

/**
 * "From " when options cost different amounts, else "". Listings show it before
 * the base price, which the admin save sets to the cheapest option.
 */
export function pricePrefix(product: { priceOptions?: { priceUSD: number }[] | null }) {
  const prices = new Set((product.priceOptions ?? []).map((o) => o.priceUSD));
  return prices.size > 1 ? "From " : "";
}

/** Price label for listings: "$4" or "From $4" when options cost different amounts. */
export function priceLabel(product: Pick<Product, "priceUSD" | "priceOptions">) {
  const options = product.priceOptions ?? [];
  if (!options.length) return `$${product.priceUSD}`;
  const prices = options.map((o) => o.priceUSD);
  const min = Math.min(...prices);
  return min === Math.max(...prices) ? `$${min}` : `From $${min}`;
}
