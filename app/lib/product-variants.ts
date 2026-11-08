/**
 * Stored per photo: the colour shown in one product image. Several photos can
 * share a colour name; they are grouped into one colour option.
 */
export type ProductVariantEntry = {
  label: string;
  /** Swatch colour, e.g. "#ffffff". */
  hex: string;
  /** Optional second swatch colour for two-tone items (e.g. white-black). */
  hex2?: string;
  /** URL of the product image showing this colour. */
  image: string;
};

/** A colour option with all of its photos (in gallery order). */
export type ProductColour = {
  label: string;
  hex: string;
  hex2?: string;
  images: string[];
};

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Parse stored entries, keeping valid ones whose image is still one of the
 * product's images (one entry per image).
 */
export function normalizeVariants(raw: unknown, images: string[] = []): ProductVariantEntry[] {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];

  const allowed = new Set(images);
  const seenImages = new Set<string>();
  const out: ProductVariantEntry[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const label = typeof row.label === "string" ? row.label.trim().slice(0, 40) : "";
    const hex = typeof row.hex === "string" ? row.hex.trim() : "";
    const hex2 = typeof row.hex2 === "string" ? row.hex2.trim() : "";
    const image = typeof row.image === "string" ? row.image.trim() : "";
    if (!label || !image) continue;
    if (allowed.size && !allowed.has(image)) continue;
    if (seenImages.has(image)) continue;
    seenImages.add(image);
    out.push({
      label,
      hex: HEX.test(hex) ? hex.toLowerCase() : "#9ca3af",
      ...(HEX.test(hex2) ? { hex2: hex2.toLowerCase() } : {}),
      image,
    });
  }

  return out;
}

/**
 * Group per-photo entries by colour name (case-insensitive). Colours and their
 * photos follow the gallery order; the swatch uses the first photo's colour.
 */
export function groupColours(entries: ProductVariantEntry[], images: string[]): ProductColour[] {
  const order = new Map(images.map((src, i) => [src, i]));
  const sorted = [...entries].sort(
    (a, b) => (order.get(a.image) ?? Infinity) - (order.get(b.image) ?? Infinity)
  );
  const groups = new Map<string, ProductColour>();
  for (const entry of sorted) {
    const key = entry.label.toLowerCase();
    const group = groups.get(key);
    if (group) group.images.push(entry.image);
    else
      groups.set(key, {
        label: entry.label,
        hex: entry.hex,
        ...(entry.hex2 ? { hex2: entry.hex2 } : {}),
        images: [entry.image],
      });
  }
  return [...groups.values()];
}

/** Cart customization payload for a chosen colour. */
export function variantCustomization(colour: Pick<ProductColour, "label" | "hex">) {
  return {
    summary: `Colour: ${colour.label}`,
    slots: [
      {
        slot: "colour",
        label: "Colour",
        filamentId: `variant:${colour.label.toLowerCase()}`,
        filamentLabel: colour.label,
        colorValue: colour.hex,
      },
    ],
  };
}

const NAMED_COLOURS: Record<string, string> = {
  white: "#f5f5f5",
  black: "#111111",
  gray: "#8a8a8a",
  grey: "#8a8a8a",
  silver: "#c0c0c0",
  gold: "#d4af37",
  red: "#d93636",
  blue: "#2f6fe0",
  navy: "#1f2f5c",
  green: "#2e9e55",
  yellow: "#f2c94c",
  orange: "#f2802f",
  pink: "#f28cb8",
  purple: "#7b4bc4",
  lilac: "#b46eaf",
  brown: "#7a4e2d",
  beige: "#d9c7a3",
  transparent: "#e6f2f5",
  clear: "#e6f2f5",
};

/**
 * Suggest swatch colours from a name such as "white-black" or "Dark Gray":
 * first recognised colour word fills the swatch, a second one makes it two-tone.
 */
export function suggestSwatch(label: string): { hex: string; hex2?: string } | null {
  const words = label.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const found = words.map((w) => NAMED_COLOURS[w]).filter((x): x is string => Boolean(x));
  if (!found.length) return null;
  return found[1] && found[1] !== found[0] ? { hex: found[0], hex2: found[1] } : { hex: found[0] };
}

/** CSS background for a swatch: solid, or split diagonally for two-tone. */
export function swatchBackground(colour: { hex: string; hex2?: string }) {
  return colour.hex2
    ? `linear-gradient(135deg, ${colour.hex} 0 50%, ${colour.hex2} 50% 100%)`
    : colour.hex;
}
