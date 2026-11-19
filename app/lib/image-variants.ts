// Shared by the browser image loader and the /api/img route.
// We make our own resized copies of photos instead of using Vercel Image Optimization,
// whose free plan stops after 5,000 resized copies a month (see DECISIONS.md).

/** The only widths we ever produce. Requests round up to the next one. */
export const VARIANT_WIDTHS = [160, 400, 800, 1600] as const;

/** Folder inside the product_images bucket where resized copies are kept. */
export const VARIANT_FOLDER = "_variants";

const STORAGE_HOST = "ypevaawhxhupjxjgkwdp.supabase.co";
const STORAGE_PREFIX = "/storage/v1/object/public/product_images/";
const RESIZABLE = /\.(png|jpe?g|webp)$/i;

export function pickVariantWidth(width: number) {
  return VARIANT_WIDTHS.find((w) => w >= width) ?? VARIANT_WIDTHS[VARIANT_WIDTHS.length - 1];
}

export type VariantSource = {
  /** Where the original file can be downloaded (relative URLs are site files). */
  sourceUrl: string;
  /** Unique, safe storage name for this original. */
  key: string;
};

/**
 * Accepts only our own photos: product_images files in Supabase, or image files under /public.
 * Anything else returns null and is shown as-is.
 */
export function parseVariantSource(src: string): VariantSource | null {
  if (src.startsWith("/") && !src.startsWith("//")) {
    const [path] = src.split(/[?#]/);
    if (!/^\/[A-Za-z0-9_\-./]+$/.test(path) || path.includes("..") || !RESIZABLE.test(path)) return null;
    if (path.startsWith("/api/") || path.startsWith("/_next/")) return null;
    return { sourceUrl: path, key: `site${path}` };
  }

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== STORAGE_HOST) return null;
  if (!url.pathname.startsWith(STORAGE_PREFIX)) return null;

  let path: string;
  try {
    path = decodeURIComponent(url.pathname.slice(STORAGE_PREFIX.length));
  } catch {
    return null;
  }
  if (!path || path.includes("..") || path.startsWith(`${VARIANT_FOLDER}/`) || !RESIZABLE.test(path)) return null;

  // Replaced photos keep their file name, so uploads add ?v=<time> to tell versions apart.
  const version = url.searchParams.get("v");
  const suffix = version && /^\d{1,16}$/.test(version) ? `@${version}` : "";
  return { sourceUrl: `${url.origin}${url.pathname}`, key: `${path}${suffix}` };
}
