"use client";

import { parseVariantSource, pickVariantWidth } from "@/app/lib/image-variants";

// next/image calls this for each width in a srcset. Our own photos go through /api/img,
// which serves (and on first use creates) a resized copy. Other images are used as they are.
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (!parseVariantSource(src)) return src;
  return `/api/img?src=${encodeURIComponent(src)}&w=${pickVariantWidth(width)}`;
}
