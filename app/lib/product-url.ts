/** Use the same product URL in navigation, metadata, and sitemaps. */
export function slugify(value: string) {
  try {
    return decodeURIComponent(value).trim().toLowerCase().replace(/[\s_]+/g, "-");
  } catch {
    return value.trim().toLowerCase().replace(/[\s_]+/g, "-");
  }
}

export function getProductPath(product: { category?: string; slug?: string }) {
  if (!product.category) return "/shop";
  const category = encodeURIComponent(product.category);
  if (!product.slug) return `/shop/${category}`;
  return `/shop/${category}/${encodeURIComponent(slugify(product.slug))}`;
}
