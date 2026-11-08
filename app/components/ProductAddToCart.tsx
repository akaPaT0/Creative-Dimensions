"use client";

import AddToCartButton from "./AddToCartButton";
import { useVariantCartOptions } from "./ProductSelection";

/** Product page Add to cart that includes the chosen colour. */
export default function ProductAddToCart({ productId, className }: { productId: string; className?: string }) {
  const getOptions = useVariantCartOptions();
  return <AddToCartButton productId={productId} className={className} getOptions={getOptions} />;
}
