/**
 * The cart lives in localStorage under one key and is read and re-saved from
 * several pages. They all share this parser so no page drops fields that
 * another page added, such as a customer's name for a personalised item.
 */

export const CART_STORAGE_KEY = "cd_cart_v1";
export const CART_UPDATED_EVENT = "cd-cart-updated";

export type CartSlot = {
  slot: string;
  label: string;
  filamentId: string;
  filamentLabel: string;
  colorValue: string;
};

/** Text the customer typed for a personalised product, e.g. { label: "Name", text: "Emma" }. */
export type CartPersonalization = {
  label: string;
  text: string;
};

/** A priced option the customer picked, e.g. { label: "Full set of 5" }. Price comes from the product. */
export type CartPriceOption = {
  label: string;
};

export type CartCustomization = {
  /** Describes the colour choices only; option and personalisation are shown separately. */
  summary: string;
  slots: CartSlot[];
  personalization?: CartPersonalization;
  option?: CartPriceOption;
};

export type StoredCartItem = {
  productId: string;
  quantity: number;
  previewImageUrl?: string;
  customization?: CartCustomization;
};

export const PERSONALIZATION_TEXT_LIMIT = 60;

/** Trim, collapse whitespace and drop control characters from typed text. */
export function cleanPersonalizationText(value: unknown, maxLength = PERSONALIZATION_TEXT_LIMIT) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, Math.max(1, Math.min(maxLength, PERSONALIZATION_TEXT_LIMIT)));
}

function str(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function parseCustomization(raw: unknown): CartCustomization | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Record<string, unknown>;

  const slots = Array.isArray(row.slots)
    ? row.slots
        .map((slot): CartSlot | null => {
          if (!slot || typeof slot !== "object") return null;
          const s = slot as Record<string, unknown>;
          const filamentId = str(s.filamentId);
          if (!filamentId) return null;
          return {
            slot: str(s.slot),
            label: str(s.label),
            filamentId,
            filamentLabel: str(s.filamentLabel),
            colorValue: str(s.colorValue),
          };
        })
        .filter((x): x is CartSlot => Boolean(x))
    : [];

  const p = row.personalization && typeof row.personalization === "object"
    ? (row.personalization as Record<string, unknown>)
    : null;
  const text = cleanPersonalizationText(p?.text);
  const personalization = text
    ? { label: cleanPersonalizationText(p?.label, 40) || "Name", text }
    : undefined;

  const o = row.option && typeof row.option === "object" ? (row.option as Record<string, unknown>) : null;
  const optionLabel = cleanPersonalizationText(o?.label, 40);
  const option = optionLabel ? { label: optionLabel } : undefined;

  if (!slots.length && !personalization && !option) return undefined;
  return {
    summary: str(row.summary),
    slots,
    ...(personalization ? { personalization } : {}),
    ...(option ? { option } : {}),
  };
}

export function parseStoredCart(raw: unknown): StoredCartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: StoredCartItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const productId = str(row.productId);
    if (!productId) continue;
    const qtyRaw =
      typeof row.quantity === "number" && Number.isFinite(row.quantity)
        ? row.quantity
        : typeof row.qty === "number" && Number.isFinite(row.qty)
          ? row.qty
          : 1;
    const customization = parseCustomization(row.customization);
    out.push({
      productId,
      quantity: Math.max(1, Math.floor(qtyRaw)),
      ...(typeof row.previewImageUrl === "string" ? { previewImageUrl: row.previewImageUrl } : {}),
      ...(customization ? { customization } : {}),
    });
  }
  return out;
}

/**
 * Identifies one cart line: same product, same colours and same typed text.
 * "Emma" and "Lucas" ornaments stay separate lines.
 */
export function cartLineKey(item: Pick<StoredCartItem, "productId" | "customization">) {
  return JSON.stringify({
    productId: item.productId,
    slots: (item.customization?.slots || []).map((x) => ({ slot: x.slot, filamentId: x.filamentId })),
    text: item.customization?.personalization?.text || "",
    option: item.customization?.option?.label || "",
  });
}

/** One line for cart, checkout and orders, e.g. "Full set of 5 · Colour: Red · Name: Emma". */
export function describeCustomization(customization?: CartCustomization) {
  if (!customization) return "";
  const parts: string[] = [];
  if (customization.option) parts.push(customization.option.label);
  if (customization.summary) parts.push(customization.summary);
  if (customization.personalization) {
    parts.push(`${customization.personalization.label}: ${customization.personalization.text}`);
  }
  return parts.join(" · ");
}

export function readStoredCart(): StoredCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? parseStoredCart(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function writeStoredCart(items: StoredCartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}
