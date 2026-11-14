"use client";

import { useId } from "react";
import { useProductSelection } from "./ProductSelection";

/** Price that follows the chosen option ("From $4" until one is picked). */
export function ProductPrice({ basePriceUSD }: { basePriceUSD: number }) {
  const sel = useProductSelection();
  const options = sel?.priceOptions ?? [];
  let text = `$${basePriceUSD}`;
  if (sel?.selectedOption) {
    text = `$${sel.selectedOption.priceUSD}`;
  } else if (options.length) {
    const prices = options.map((o) => o.priceUSD);
    const min = Math.min(...prices);
    text = min === Math.max(...prices) ? `$${min}` : `From $${min}`;
  }
  return (
    <span className="text-3xl font-bold text-[#FF8B64]" aria-live="polite">
      {text}
    </span>
  );
}

/** Buttons for options that each have their own price (e.g. one snowman or the full set). */
export function PriceOptionPicker() {
  const sel = useProductSelection();
  if (!sel || sel.priceOptions.length < 2) return null;
  const { priceOptions, selectedOption, selectOption, needsOption } = sel;

  return (
    <div className="mt-5">
      <div className="text-sm text-white/60">
        Option:{" "}
        <span
          className={selectedOption ? "font-semibold text-white" : needsOption ? "text-[#FF8B64]" : "text-white/40"}
        >
          {selectedOption ? selectedOption.label : "Choose an option"}
        </span>
      </div>
      <div
        className={`mt-2.5 flex flex-wrap gap-2 rounded-2xl transition ${
          needsOption ? "ring-2 ring-[#FF8B64]/70 ring-offset-4 ring-offset-[#0D0D0D]" : ""
        }`}
        role="radiogroup"
        aria-label="Option"
      >
        {priceOptions.map((option) => {
          const on = selectedOption?.label === option.label;
          return (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => selectOption(option)}
              className={`rounded-xl border px-3.5 py-2 text-left text-sm transition ${
                on
                  ? "border-[#FF8B64] bg-[#FF8B64]/12 text-white"
                  : "border-white/15 bg-white/[0.04] text-white/80 hover:border-white/35"
              }`}
            >
              <span className="font-semibold">{option.label}</span>
              <span className={`ml-2 tabular-nums ${on ? "text-[#FF8B64]" : "text-white/50"}`}>
                ${option.priceUSD}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Text box for the name (or other text) printed on a personalised item. */
export function PersonalizationField() {
  const sel = useProductSelection();
  const id = useId();
  if (!sel?.personalization) return null;
  const { personalization, personalText, setPersonalText, personalError } = sel;
  const errorId = `${id}-error`;

  return (
    <div className="mt-5">
      <label htmlFor={id} className="text-sm text-white/60">
        {personalization.label}
        {personalization.required ? "" : " (optional)"}
      </label>
      <input
        id={id}
        type="text"
        value={personalText}
        onChange={(e) => setPersonalText(e.target.value)}
        maxLength={personalization.maxLength}
        placeholder={personalization.placeholder || ""}
        autoComplete="off"
        aria-invalid={personalError ? true : undefined}
        aria-describedby={personalError ? errorId : undefined}
        className={`mt-2 w-full rounded-xl border bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-white/30 outline-none transition focus:border-[#FF8B64] ${
          personalError ? "border-[#FF8B64]" : "border-white/15"
        }`}
      />
      <div className="mt-1.5 flex justify-between gap-3 text-xs">
        <span id={errorId} className="text-[#FF8B64]">
          {personalError || ""}
        </span>
        <span className="shrink-0 tabular-nums text-white/40">
          {personalText.length}/{personalization.maxLength}
        </span>
      </div>
      <p className="mt-1 text-xs text-white/45">
        We print it exactly as typed. Want different names? Add each one to the cart separately.
      </p>
    </div>
  );
}
