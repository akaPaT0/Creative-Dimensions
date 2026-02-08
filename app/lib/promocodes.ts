export type PromoType = "percent" | "fixed" | "free_shipping";

export type PromoCodeRecord = {
  code: string;
  label: string;
  description: string;
  active: boolean;
  type: PromoType;
  value: number;
  minSubtotal: number;
  maxDiscount: number;
  updatedAt: string;
  createdAt: string;
};

export type PromoApplyResult = {
  discountUSD: number;
  shippingOverrideUSD: number | null;
  appliedCode: string;
};

export const PROMO_CODES_KEY = "admin:promocodes";

const DEFAULT_PROMOS: PromoCodeRecord[] = [
  {
    code: "CD10",
    label: "10% Off",
    description: "10% discount on subtotal (min $10).",
    active: true,
    type: "percent",
    value: 10,
    minSubtotal: 10,
    maxDiscount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    code: "SAVE5",
    label: "$5 Off",
    description: "$5 discount on subtotal (min $20).",
    active: true,
    type: "fixed",
    value: 5,
    minSubtotal: 20,
    maxDiscount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return value;
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value !== "boolean") return fallback;
  return value;
}

function sanitizeType(value: unknown): PromoType {
  return value === "fixed" || value === "free_shipping" ? value : "percent";
}

export function normalizePromoCode(value: unknown) {
  return asText(value).toUpperCase();
}

export function normalizePromoRecords(raw: unknown): PromoCodeRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => {
      const code = normalizePromoCode(x.code);
      const label = asText(x.label) || code;
      const type = sanitizeType(x.type);
      const value = Math.max(0, asNumber(x.value, 0));
      const minSubtotal = Math.max(0, asNumber(x.minSubtotal, 0));
      const maxDiscount = Math.max(0, asNumber(x.maxDiscount, 0));
      const createdAt = asText(x.createdAt) || new Date().toISOString();
      const updatedAt = asText(x.updatedAt) || createdAt;
      return {
        code,
        label,
        description: asText(x.description),
        active: asBoolean(x.active, true),
        type,
        value,
        minSubtotal,
        maxDiscount,
        createdAt,
        updatedAt,
      };
    })
    .filter((x) => x.code);
}

export function withPromoDefaults(records: PromoCodeRecord[]) {
  if (records.length > 0) return records;
  return DEFAULT_PROMOS;
}

export function applyPromoRule({
  subtotalUSD,
  shippingUSD,
  promoCode,
  records,
}: {
  subtotalUSD: number;
  shippingUSD: number;
  promoCode: string;
  records: PromoCodeRecord[];
}): PromoApplyResult {
  const code = normalizePromoCode(promoCode);
  if (!code) {
    return { discountUSD: 0, shippingOverrideUSD: null, appliedCode: "" };
  }

  const promo = records.find((x) => x.code === code && x.active);
  if (!promo) throw new Error("Invalid promo code");
  if (promo.minSubtotal > 0 && subtotalUSD < promo.minSubtotal) {
    throw new Error(`Promo code requires at least $${promo.minSubtotal} subtotal`);
  }

  if (promo.type === "free_shipping") {
    return {
      discountUSD: 0,
      shippingOverrideUSD: 0,
      appliedCode: promo.code,
    };
  }

  let discountUSD =
    promo.type === "percent"
      ? (subtotalUSD * promo.value) / 100
      : promo.value;

  discountUSD = Math.max(0, Math.min(subtotalUSD, discountUSD));
  if (promo.maxDiscount > 0) {
    discountUSD = Math.min(discountUSD, promo.maxDiscount);
  }

  return {
    discountUSD,
    shippingOverrideUSD: shippingUSD,
    appliedCode: promo.code,
  };
}
