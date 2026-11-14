"use client";

import { Children, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type Tab = { key: string; label: string; dot: string };

/**
 * Switches between seasonal drops shown in the same spot. Every panel is
 * rendered on the server (so all of them are in the page for search engines);
 * only the chosen one is visible. With a single panel no tabs are shown.
 */
export default function SeasonalTabs({ tabs, children }: { tabs: Tab[]; children: ReactNode }) {
  const panels = Children.toArray(children);
  const [active, setActive] = useState(0);
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  if (panels.length <= 1) return <>{panels}</>;

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    setActive(next);
    buttons.current[next]?.focus();
  }

  return (
    <div className="relative">
      <div className="relative z-10 -mb-5 flex justify-center sm:-mb-6">
        <div
          role="tablist"
          aria-label="Seasonal collections"
          className="inline-flex rounded-full border border-white/10 bg-[#141417]/90 p-1 shadow-lg backdrop-blur"
        >
          {tabs.map((tab, i) => {
            const on = i === active;
            return (
              <button
                key={tab.key}
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${i}`}
                aria-selected={on}
                aria-controls={`${id}-panel-${i}`}
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                  on ? "bg-white/[0.12] text-white" : "text-white/55 hover:text-white/85"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${tab.dot} ${on ? "" : "opacity-50"}`} aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {panels.map((panel, i) => (
        <div
          key={tabs[i]?.key ?? i}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={i !== active}
        >
          {panel}
        </div>
      ))}
    </div>
  );
}
