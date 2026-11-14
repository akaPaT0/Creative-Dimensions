"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { variantCustomization, type ProductColour } from "@/app/lib/product-variants";
import type { ProductPersonalization, ProductPriceOption } from "@/app/data/products";
import { validatePersonalizationText } from "@/app/lib/product-personalization";
import type { CartCustomization } from "@/app/lib/cart-items";
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

  /** Choices with their own price, and the one picked. */
  priceOptions: ProductPriceOption[];
  selectedOption: ProductPriceOption | null;
  selectOption: (option: ProductPriceOption) => void;
  needsOption: boolean;

  /** Text the customer types (e.g. a name), when the product asks for it. */
  personalization: ProductPersonalization | null;
  personalText: string;
  setPersonalText: (value: string) => void;
  personalError: string;
  /** Called when Add to cart is pressed without the needed choice. */
  flagOption: () => void;
  flagPersonal: (message: string) => void;
};

const ProductSelectionContext = createContext<ProductSelectionValue | null>(null);

export function useProductSelection() {
  return useContext(ProductSelectionContext);
}

/**
 * Cart options for the current choices. Returns null (and flags what's
 * missing) when a colour, option or required name hasn't been given yet.
 */
export function useVariantCartOptions() {
  const sel = useProductSelection();
  return useCallback((): AddToCartOptions | null => {
    if (!sel) return {};
    let missing = false;

    if (sel.variants.length > 0 && !sel.selected) {
      sel.setNeedsColour(true);
      missing = true;
    }
    if (sel.priceOptions.length > 0 && !sel.selectedOption) {
      sel.flagOption();
      missing = true;
    }
    let text = "";
    if (sel.personalization) {
      const result = validatePersonalizationText(sel.personalization, sel.personalText);
      if ("error" in result) {
        sel.flagPersonal(result.error);
        missing = true;
      } else {
        text = result.text;
      }
    }
    if (missing) return null;

    const colour = sel.selected ? variantCustomization(sel.selected) : null;
    const customization: CartCustomization | undefined =
      colour || sel.selectedOption || text
        ? {
            summary: colour?.summary ?? "",
            slots: colour?.slots ?? [],
            ...(sel.selectedOption ? { option: { label: sel.selectedOption.label } } : {}),
            ...(text && sel.personalization
              ? { personalization: { label: sel.personalization.label, text } }
              : {}),
          }
        : undefined;

    // Show the photo the customer is looking at if it belongs to the colour.
    let preview: string | undefined;
    if (sel.selected) {
      const current = sel.images[sel.activeIndex];
      preview = sel.selected.images.includes(current) ? current : sel.selected.images[0];
    }

    return {
      ...(customization ? { customization } : {}),
      ...(preview ? { previewImageUrl: preview } : {}),
    };
  }, [sel]);
}

export function ProductSelectionProvider({
  images,
  variants,
  priceOptions = [],
  personalization = null,
  children,
}: {
  images: string[];
  variants: ProductColour[];
  priceOptions?: ProductPriceOption[];
  personalization?: ProductPersonalization | null;
  children: ReactNode;
}) {
  const colourOf = useCallback(
    (index: number) => variants.find((v) => v.images.includes(images[index])) ?? null,
    [images, variants]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [selected, setSelected] = useState<ProductColour | null>(() => colourOf(0));
  const [needsColour, setNeedsColour] = useState(false);
  // A single option needs no choice.
  const [selectedOption, setSelectedOption] = useState<ProductPriceOption | null>(
    () => (priceOptions.length === 1 ? priceOptions[0] : null)
  );
  const [needsOption, setNeedsOption] = useState(false);
  const [personalText, setPersonalTextState] = useState("");
  const [personalError, setPersonalError] = useState("");
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

  const selectOption = useCallback((option: ProductPriceOption) => {
    setSelectedOption(option);
    setNeedsOption(false);
  }, []);

  const setPersonalText = useCallback((value: string) => {
    setPersonalTextState(value);
    setPersonalError("");
  }, []);

  const flagOption = useCallback(() => setNeedsOption(true), []);
  const flagPersonal = useCallback((message: string) => setPersonalError(message), []);

  const value = useMemo<ProductSelectionValue>(
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
      priceOptions,
      selectedOption,
      selectOption,
      needsOption,
      personalization,
      personalText,
      setPersonalText,
      personalError,
      flagOption,
      flagPersonal,
    }),
    [
      images,
      variants,
      activeIndex,
      selected,
      registerGallery,
      reportIndex,
      selectVariant,
      needsColour,
      priceOptions,
      selectedOption,
      selectOption,
      needsOption,
      personalization,
      personalText,
      setPersonalText,
      personalError,
      flagOption,
      flagPersonal,
    ]
  );

  return <ProductSelectionContext.Provider value={value}>{children}</ProductSelectionContext.Provider>;
}
