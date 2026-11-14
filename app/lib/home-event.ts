// Seasonal "drops" shown on the home page, right under the hero.
//
// Every season is saved in HOME_EVENTS. ACTIVE_HOME_EVENTS lists the ones to
// show, in tab order; with two or more live at once the section shows a tab
// for each. An event with `endsAt` hides itself from that moment (the home
// page refreshes about once a minute), so Berbara disappears after Dec 4 and
// Christmas stays on its own without a redeploy. With nothing live the hero
// falls back to the regular product collage.
//
// `slugs` picks the five pieces in the lineup: centre, inner-left,
// inner-right, outer-left, outer-right. Missing slugs are filled from the
// same category.

export type HomeEventTheme = "halloween" | "christmas";

export type HomeEventConfig = {
  /** Colours and effects, see HeroEventDrop. */
  theme: HomeEventTheme;
  /** Short name on the tab. */
  tabLabel: string;
  word: string;
  eyebrow: string;
  blurb: string;
  ctaLabel: string;
  href: string;
  category: string;
  slugs: string[];
  /** Shown from this moment (ISO time with Lebanon offset). */
  startsAt?: string;
  /** Hidden from this moment (ISO time with Lebanon offset). */
  endsAt?: string;
};

const HALLOWEEN_PIECES = [
  "screaming-ghost-candy-bowl",
  "halloween-coffin-lantern",
  "pumpkin-candy-bowl",
  "ghost-candy-bowl",
  "stitched-skull-candy-bowl",
];

export const HOME_EVENTS = {
  berbara: {
    theme: "halloween",
    tabLabel: "Berbara",
    word: "Berbara",
    eyebrow: "The Berbara drop is live",
    blurb:
      "Candy bowls, skulls and coffin lanterns for Saint Barbara night, designed and printed in-house in Lebanon.",
    ctaLabel: "Shop Berbara",
    href: "/shop/halloween",
    category: "halloween",
    slugs: HALLOWEEN_PIECES,
    // Shows through December 4, Lebanon time.
    endsAt: "2026-12-05T00:00:00+02:00",
  },
  halloween: {
    theme: "halloween",
    tabLabel: "Halloween",
    word: "Halloween",
    eyebrow: "The Halloween drop is live",
    blurb:
      "Candy bowls, skulls and coffin lanterns, designed and printed in-house in Lebanon. A limited run for this season.",
    ctaLabel: "Shop the Halloween drop",
    href: "/shop/halloween",
    category: "halloween",
    slugs: HALLOWEEN_PIECES,
  },
  christmas: {
    theme: "christmas",
    tabLabel: "Christmas",
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
} satisfies Record<string, HomeEventConfig>;

export type HomeEventKey = keyof typeof HOME_EVENTS;

/** Seasons on the home page, in tab order. Empty to hide the section. */
export const ACTIVE_HOME_EVENTS: HomeEventKey[] = ["christmas", "berbara"];

/** The active seasons that are live at `now`. */
export function liveHomeEvents(now: Date = new Date()) {
  const t = now.getTime();
  return ACTIVE_HOME_EVENTS.map((key) => ({ key, ...(HOME_EVENTS[key] as HomeEventConfig) })).filter(
    (e) =>
      (!e.startsAt || t >= new Date(e.startsAt).getTime()) &&
      (!e.endsAt || t < new Date(e.endsAt).getTime())
  );
}
