"use client";

import { parseVariantSource, pickVariantWidth } from "@/app/lib/image-variants";
import { getStaticCatalogImage } from "@/app/lib/static-catalog-images";

// Bundled catalog photos go straight to the CDN. New, unbundled photos use the existing resize route.
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  const source = parseVariantSource(src);
  if (!source) return src;

  const variantWidth = pickVariantWidth(width);
  return getStaticCatalogImage(source.key, variantWidth)
    ?? `/api/img?src=${encodeURIComponent(src)}&w=${variantWidth}`;
}
