"use client";

/* eslint-disable @next/next/no-img-element */

import { suggestSwatch, swatchBackground } from "@/app/lib/product-variants";
import { ui } from "../ui";

export type VariantDraft = {
  label: string;
  hex: string;
  /** Second colour for two-tone items; empty when single colour. */
  hex2?: string;
  /** Set once the swatch is picked by hand, so typing the name stops auto-filling it. */
  manual?: boolean;
};

const EMPTY: VariantDraft = { label: "", hex: "#ffffff" };

/**
 * Optional colour per product photo. Photos left blank are just extra
 * angles; photos with a colour name become selectable colour options.
 */
export default function VariantEditor({
  images,
  value,
  onChange,
  disabled = false,
}: {
  images: string[];
  value: Record<string, VariantDraft>;
  onChange: (next: Record<string, VariantDraft>) => void;
  disabled?: boolean;
}) {
  if (!images.length) return null;

  const set = (url: string, next: VariantDraft) => onChange({ ...value, [url]: next });

  const setLabel = (url: string, label: string) => {
    const current = value[url] ?? EMPTY;
    const suggestion = current.manual ? null : suggestSwatch(label);
    set(url, {
      ...current,
      label,
      ...(suggestion ? { hex: suggestion.hex, hex2: suggestion.hex2 } : {}),
    });
  };

  const colourCount = new Set(
    images.map((url) => value[url]?.label.trim().toLowerCase()).filter(Boolean)
  ).size;

  return (
    <div className={`${ui.inset} p-4 space-y-3`}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-white/80 text-sm font-medium">Colour variants</div>
        <div className={ui.note}>
          {colourCount ? `${colourCount} colour${colourCount === 1 ? "" : "s"}` : "None set"}
        </div>
      </div>
      <p className={ui.note}>
        Name the colour shown in each photo. Give several photos the same name to group them under one
        colour; leave blank for photos that aren&rsquo;t a colour option. Names like &ldquo;white-black&rdquo; or
        &ldquo;gray&rdquo; fill the swatch automatically (two colour words make a split swatch). Adjust the pickers
        if needed; the second one is optional.
      </p>

      {disabled ? (
        <p className="text-amber-200/80 text-xs">
          You&rsquo;re replacing the photos, so colours will be cleared. Save first, then set colours on the new photos.
        </p>
      ) : (
        <div className="space-y-2">
          {images.map((url, i) => {
            const draft = value[url] ?? EMPTY;
            const named = !!draft.label.trim();
            return (
              <div key={url} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2">
                <img src={url} alt={`Photo ${i + 1}`} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                <span className="w-5 shrink-0 text-center text-xs text-white/40">{i + 1}</span>
                <input
                  value={draft.label}
                  onChange={(e) => setLabel(url, e.target.value)}
                  placeholder="Colour name (optional)"
                  maxLength={40}
                  className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
                />

                {named && (
                  <span
                    className="h-7 w-7 shrink-0 rounded-full border border-white/25"
                    style={{ background: swatchBackground(draft) }}
                    title="Swatch preview"
                    aria-hidden="true"
                  />
                )}

                <input
                  type="color"
                  value={draft.hex}
                  onChange={(e) => set(url, { ...draft, hex: e.target.value, manual: true })}
                  aria-label={`Main swatch colour for photo ${i + 1}`}
                  title="Main colour"
                  className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border border-white/15 bg-transparent p-0.5"
                />

                {draft.hex2 ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <input
                      type="color"
                      value={draft.hex2}
                      onChange={(e) => set(url, { ...draft, hex2: e.target.value, manual: true })}
                      aria-label={`Second swatch colour for photo ${i + 1}`}
                      title="Second colour"
                      className="h-9 w-10 cursor-pointer rounded-lg border border-white/15 bg-transparent p-0.5"
                    />
                    <button
                      type="button"
                      onClick={() => set(url, { ...draft, hex2: undefined, manual: true })}
                      aria-label={`Remove second colour for photo ${i + 1}`}
                      title="Make single colour"
                      className="h-9 w-7 rounded-lg text-white/50 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => set(url, { ...draft, hex2: "#111111", manual: true })}
                    title="Add a second colour (two-tone)"
                    className="h-9 shrink-0 rounded-lg border border-dashed border-white/20 px-2 text-xs text-white/55 hover:border-white/40 hover:text-white"
                  >
                    + 2nd
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
