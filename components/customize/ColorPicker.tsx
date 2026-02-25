"use client";

import type { FilamentOption, MaterialSlot } from "@/types/customize";

type Props = {
  slots: MaterialSlot[];
  selectedFilamentIds: string[];
  filamentOptions: FilamentOption[];
  defaultHexes?: string[];
  onSelectSlotFilament: (slotIndex: number, filamentId: string) => void;
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function ColorPicker({
  slots,
  selectedFilamentIds,
  filamentOptions,
  defaultHexes = [],
  onSelectSlotFilament,
}: Props) {
  if (!filamentOptions.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/70">
        No active filament options available.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">Materials</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Available Filaments</h3>
        </div>
        <div className="rounded-lg border border-white/15 bg-black/20 px-3 py-1.5 text-xs text-white/70">
          {filamentOptions.length} active
        </div>
      </div>
      <div className="space-y-3.5">
        {slots.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/70">
            Detecting material slots from model...
          </div>
        ) : (
          slots.map((slot, index) => {
            const selectedId = selectedFilamentIds[index] || "";
            const selectedOption = filamentOptions.find((x) => x.id === selectedId);
            const swatch = selectedOption?.hex || defaultHexes[index] || "#ffffff";
            const letter = LETTERS[index] || String(index + 1);
            return (
              <label
                key={slot.key}
                className="block rounded-xl border border-white/10 bg-black/20 p-3"
              >
                <div className="mb-2 text-xs text-white/75">
                  Slot {letter}: {slot.label}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="w-full rounded-xl border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white outline-none focus:border-[#FF8B64]"
                    value={selectedId}
                    onChange={(e) => onSelectSlotFilament(index, e.target.value)}
                  >
                    {filamentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span
                    className="h-9 w-9 rounded-lg border border-white/20"
                    style={{ backgroundColor: swatch }}
                    title={selectedOption?.label || swatch}
                  />
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
