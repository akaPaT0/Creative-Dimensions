"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/app/data/products";
import CustomizeColorsModal from "./CustomizeColorsModal";

type Props = {
  product: Product;
  className?: string;
};

function normalizeHex(input: string) {
  const s = input.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  return "#ffffff";
}

export default function ProductCustomizeColorsAction({ product, className = "" }: Props) {
  const config = product.customizeColors;
  const [open, setOpen] = useState(false);
  const defaultHexes = useMemo(
    () => (config?.defaultHexes?.length ? config.defaultHexes.map(normalizeHex) : ["#ffffff"]),
    [config?.defaultHexes]
  );
  const [savedHexes, setSavedHexes] = useState<string[]>(defaultHexes);
  const [draftHexes, setDraftHexes] = useState<string[]>(defaultHexes);

  if (!config) return null;

  function handleOpen() {
    setDraftHexes(savedHexes.length ? savedHexes : defaultHexes);
    setOpen(true);
  }

  function handleReset() {
    setDraftHexes(defaultHexes);
  }

  function handleSave() {
    setSavedHexes(draftHexes.length ? draftHexes : defaultHexes);
    setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={handleOpen} className={className}>
        Customize Colors
      </button>

      <CustomizeColorsModal
        open={open}
        onClose={() => setOpen(false)}
        productName={product.name}
        config={config}
        selectedHexes={draftHexes}
        onChangeHexes={setDraftHexes}
        onReset={handleReset}
        onSave={handleSave}
      />
    </>
  );
}

