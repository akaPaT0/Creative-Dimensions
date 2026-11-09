import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { normalizeVariants, groupColours, variantCustomization } from "../app/lib/product-variants.ts";

const base = process.argv[2] || "http://localhost:3015";
const canonicalBase = "https://www.creativedimensionslb.com";
const manifest = JSON.parse(await readFile(new URL("../catalog/halloween-2026.json", import.meta.url), "utf8"));
const lanternGallery = JSON.parse(await readFile(new URL("../catalog/halloween-lantern-gallery-v3.json", import.meta.url), "utf8"));
Object.assign(manifest.products.find((p) => p.SKU === lanternGallery.SKU), lanternGallery.patch);

async function html(path) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, path);
  return response.text();
}
function schemas(text) {
  return [...text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
}
function canonical(text, path) {
  assert(text.includes(`rel="canonical" href="${canonicalBase}${path}"`), `Canonical ${path}`);
}

const category = await html("/shop/halloween");
canonical(category, "/shop/halloween");
const collection = schemas(category).find((s) => s["@type"] === "CollectionPage");
assert.equal(collection.mainEntity.itemListElement.length, 8);
const sitemap = await html("/sitemap.xml");
assert(sitemap.includes(`${canonicalBase}/shop/halloween</loc>`));
for (const product of manifest.products) {
  const path = `/shop/halloween/${product.slug}`;
  const text = await html(path);
  canonical(text, path);
  assert(category.includes(`href="${path}"`));
  assert(sitemap.includes(`${canonicalBase}${path}</loc>`));
  const schema = schemas(text).find((s) => s["@type"] === "Product");
  assert.equal(schema.name, product.Name);
  assert.equal(Number(schema.offers.price), product.priceUSD);
  assert.deepEqual(schema.image, JSON.parse(product.images));
  assert.equal(schema.category, "Halloween");
  const entries = normalizeVariants(product.variants, JSON.parse(product.images));
  const options = groupColours(entries, JSON.parse(product.images));
  assert.equal(options.length, product.SKU === "HA008" ? 3 : 1);
  for (const option of options) assert.equal(variantCustomization(option).slots[0].filamentLabel, option.label);
  if (product.SKU === "HA008") {
    for (const label of ["Green Bats", "Orange Ghosts", "Red Spiderweb"]) assert(text.includes(label));
  }
  console.log(`Verified page: ${product.slug} ($${product.priceUSD})`);
}
for (const path of ["/shop", "/shop/keychains", "/privacy", "/terms"]) await html(path);
const image = manifest.products[0].variants[0].image;
const optimized = await fetch(`${base}/_next/image?url=${encodeURIComponent(image)}&w=640&q=75`);
assert.equal(optimized.status, 200, "Next image optimization");
assert(optimized.headers.get("content-type").startsWith("image/"));
const imageCount = manifest.products.reduce((count, p) => count + JSON.parse(p.images).length, 0);
console.log(`PASS: 8 products, category, canonical URLs, prices, ${imageCount} image references, variant/cart mapping, sitemap, existing pages and image optimization.`);
