"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { variantCustomization, type ProductColour } from "@/app/lib/product-variants";
import type { AddToCartOptions } from "./AddToCartButton";

type GalleryJump = (index: number, opts?: { instant?: boolean }) => void;

type ProductSelectionValue = {
  images: string[];
  variants: ProductColour[];
  /** Index of the image currently shown in the gallery. */
  activeIndex: number;
  /** Colour the customer picked (or the one shown in the current photo). */
  selected: ProductColour | null;
  /** Gallery registers how to jump to an image. */
  registerGallery: (goTo: GalleryJump | null) => void;
  /** Gallery reports which image is showing. */
  reportIndex: (index: number) => void;
  /** Swatch tap: select a colour and show its photo. */
  selectVariant: (variant: ProductColour) => void;
  /** Set when someone tries to add to cart without a colour. */
  needsColour: boolean;
  setNeedsColour: (value: boolean) => void;
};

const ProductSelectionContext = createContext<ProductSelectionValue | null>(null);

export function useProductSelection() {
  return useContext(ProductSelectionContext);
}

/**
 * Cart options for the chosen colour. Returns null (and flags the swatches)
 * when the product has colours but none is chosen yet.
 */
export function useVariantCartOptions() {
  const sel = useProductSelection();
  return useCallback((): AddToCartOptions | null => {
    if (!sel || sel.variants.length === 0) return {};
    if (!sel.selected) {
      sel.setNeedsColour(true);
      return null;
    }
    // Show the photo the customer is looking at if it belongs to the colour.
    const current = sel.images[sel.activeIndex];
    const preview = sel.selected.images.includes(current) ? current : sel.selected.images[0];
    return { customization: variantCustomization(sel.selected), previewImageUrl: preview };
  }, [sel]);
}

export function ProductSelectionProvider({
  images,
  variants,
  children,
}: {
  images: string[];
  variants: ProductColour[];
  children: ReactNode;
}) {
  const colourOf = useCallback(
    (index: number) => variants.find((v) => v.images.includes(images[index])) ?? null,
    [images, variants]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [selected, setSelected] = useState<ProductColour | null>(() => colourOf(0));
  const [needsColour, setNeedsColour] = useState(false);
  const galleryGoTo = useRef<GalleryJump | null>(null);
  const activeRef = useRef(0);

  const reportIndex = useCallback(
    (index: number) => {
      activeRef.current = index;
      setActiveIndex(index);
      // Landing on a colour's photo selects that colour; other photos keep the choice.
      const match = colourOf(index);
      if (match) {
        setSelected(match);
        setNeedsColour(false);
      }
    },
    [colourOf]
  );

  const selectVariant = useCallback(
    (variant: ProductColour) => {
      setSelected(variant);
      setNeedsColour(false);
      // Already showing one of this colour's photos: stay there.
      if (variant.images.includes(images[activeRef.current])) return;
      const index = images.indexOf(variant.images[0]);
      // Jump straight there so we don't pass through other colours' photos.
      if (index >= 0) galleryGoTo.current?.(index, { instant: true });
    },
    [images]
  );

  const registerGallery = useCallback((goTo: GalleryJump | null) => {
    galleryGoTo.current = goTo;
  }, []);

  const value = useMemo(
    () => ({
      images,
      variants,
      activeIndex,
      selected,
      registerGallery,
      reportIndex,
      selectVariant,
      needsColour,
      setNeedsColour,
    }),
    [images, variants, activeIndex, selected, registerGallery, reportIndex, selectVariant, needsColour]
  );

  return <ProductSelectionContext.Provider value={value}>{children}</ProductSelectionContext.Provider>;
}
