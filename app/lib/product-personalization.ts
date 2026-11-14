import type { ProductPersonalization } from "@/app/data/products";
import { PERSONALIZATION_TEXT_LIMIT, cleanPersonalizationText } from "@/app/lib/cart-items";

export const DEFAULT_PERSONALIZATION: ProductPersonalization = {
  label: "Name",
  placeholder: "e.g. Emma",
  maxLength: 20,
  required: true,
};

/** Parse the stored `personalization` column; anything invalid means "not personalised". */
export function normalizePersonalization(raw: unknown): ProductPersonalization | undefined {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const row = value as Record<string, unknown>;
  if (row.enabled === false) return undefined;

  const label = cleanPersonalizationText(row.label, 40) || DEFAULT_PERSONALIZATION.label;
  const placeholder = cleanPersonalizationText(row.placeholder, 60);
  const max = Number(row.maxLength);
  const maxLength = Number.isFinite(max)
    ? Math.min(PERSONALIZATION_TEXT_LIMIT, Math.max(1, Math.floor(max)))
    : DEFAULT_PERSONALIZATION.maxLength;

  return {
    label,
    ...(placeholder ? { placeholder } : {}),
    maxLength,
    required: row.required !== false,
  };
}

/**
 * Check what the customer typed against the product's settings.
 * Returns the cleaned text ("" when none), or an error message.
 */
export function validatePersonalizationText(
  config: ProductPersonalization,
  raw: unknown
): { text: string } | { error: string } {
  const typed = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim() : "";
  if (typed.length > config.maxLength) {
    return { error: `${config.label} can be up to ${config.maxLength} characters.` };
  }
  const text = cleanPersonalizationText(typed, config.maxLength);
  if (!text && config.required) {
    return { error: `Please enter the ${config.label.toLowerCase()} to print.` };
  }
  return { text };
}
