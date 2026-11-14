// Seasonal "drop" shown on the home page, right under the hero.
//
// Each season is saved below. To switch, change ACTIVE_HOME_EVENT to another
// key, or to null to turn the section off (the hero then falls back to the
// regular product collage). `slugs` picks the five pieces in the lineup; the
// first one is the large centre piece, then inner-left, inner-right,
// outer-left, outer-right. Missing slugs are filled from the same category.

export type HomeEventTheme = "halloween" | "christmas";

export type HomeEventConfig = {
  theme: HomeEventTheme;
  word: string;
  eyebrow: string;
  blurb: string;
  ctaLabel: string;
  href: string;
  category: string;
  slugs: string[];
};

export const HOME_EVENTS: Record<HomeEventTheme, HomeEventConfig> = {
  halloween: {
    theme: "halloween",
    word: "Halloween",
    eyebrow: "The Halloween drop is live",
    blurb:
      "Candy bowls, skulls and coffin lanterns, designed and printed in-house in Lebanon. A limited run for this season.",
    ctaLabel: "Shop the Halloween drop",
    href: "/shop/halloween",
    category: "halloween",
    slugs: [
      "screaming-ghost-candy-bowl",
      "halloween-coffin-lantern",
      "pumpkin-candy-bowl",
      "ghost-candy-bowl",
      "stitched-skull-candy-bowl",
    ],
  },
  christmas: {
    theme: "christmas",
    word: "Christmas",
    eyebrow: "The Christmas collection is here",
    blurb:
      "Reindeer, gnomes, ornaments and gifts with your names on them, designed and printed in-house in Lebanon. Order early for the holidays.",
    ctaLabel: "Shop Christmas",
    href: "/shop/christmas",
    category: "christmas",
    slugs: [
      "knit-style-christmas-reindeer",
      "christmas-tree-advent-calendar",
      "santa-bowl",
      "red-hat-christmas-gnome",
      "nutcracker-decoration",
    ],
  },
};

export const ACTIVE_HOME_EVENT: HomeEventTheme | null = "christmas";

export const HOME_EVENT = ACTIVE_HOME_EVENT
  ? { enabled: true, ...HOME_EVENTS[ACTIVE_HOME_EVENT] }
  : { enabled: false, ...HOME_EVENTS.christmas };
