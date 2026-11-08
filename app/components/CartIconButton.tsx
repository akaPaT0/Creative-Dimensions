"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { addToCart } from "./AddToCartButton";

type Props = {
  productId: string;
  productName?: string;
  positionClass?: string;
  /** Product has colours: let the card link open the product page to choose one. */
  needsChoice?: boolean;
};

/** Small add-to-cart button that sits over a product card image. */
export default function CartIconButton({
  productId,
  productName,
  positionClass = "bottom-2 right-2",
  needsChoice = false,
}: Props) {
  const [added, setAdded] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const add = (event: React.SyntheticEvent) => {
    // Colour products: fall through to the card link so the customer picks a colour.
    if (needsChoice) return;
    // The card itself is a link; don't navigate.
    event.preventDefault();
    event.stopPropagation();
    addToCart(productId);
    setAdded(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={
        needsChoice
          ? `Choose a colour for ${productName ?? "this item"}`
          : added
            ? "Added to cart"
            : `Add ${productName ?? "item"} to cart`
      }
      onClick={add}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") add(event);
      }}
      className={`absolute ${positionClass} z-10 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border backdrop-blur-sm transition ${
        added
          ? "border-[#FF8B64] bg-[#FF8B64] text-[#0D0D0D]"
          : "border-white/20 bg-black/35 text-white/90 hover:border-[#FF8B64] hover:bg-[#FF8B64] hover:text-[#0D0D0D]"
      }`}
    >
      {added ? <Check size={14} strokeWidth={2.6} /> : <ShoppingCart size={14} strokeWidth={2} />}
    </span>
  );
}
