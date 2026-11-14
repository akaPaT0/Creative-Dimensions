import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const origin = process.argv[2] || 'https://www.creativedimensionslb.com';
const manifest = JSON.parse(await readFile(new URL('../catalog/christmas-2026.json', import.meta.url), 'utf8'));
async function html(path) {
  const res = await fetch(origin + path);
  assert.equal(res.status, 200, path);
  return res.text();
}
const category = await html('/shop/christmas');
const sitemap = await html('/sitemap.xml');
assert(category.includes('Christmas'));
for (const product of manifest.products) {
  const path = '/shop/christmas/' + product.slug;
  assert(category.includes(path), 'Category missing ' + product.slug);
  assert(sitemap.includes(path), 'Sitemap missing ' + product.slug);
  const body = await html(path);
  assert(body.includes(product.Name), 'Name missing ' + product.slug);
  assert(body.includes('https://www.creativedimensionslb.com' + path), 'Canonical missing');
  const schemas = [...body.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m => JSON.parse(m[1]));
  const schema = schemas.find(s => s['@type'] === 'Product');
  assert(schema, 'Missing product schema');
  assert.equal(Number(schema.offers.price), product.priceUSD);
  assert.equal(schema.category, 'Christmas');
  for (const url of JSON.parse(product.images)) assert(body.includes(url), 'Missing image');
  for (const variant of product.variants || []) {
    assert(body.includes(variant.label), 'Missing colour option ' + variant.label);
    assert(JSON.parse(product.images).includes(variant.image), 'Variant must use gallery image');
  }
  console.log('Verified ' + path + ' $' + product.priceUSD);
}
for (const asset of manifest.assets) {
  const url = 'https://ypevaawhxhupjxjgkwdp.supabase.co/storage/v1/object/public/product_images/' + asset.storagePath;
  const res = await fetch(url); assert(res.ok);
  const hash = createHash('sha256').update(Buffer.from(await res.arrayBuffer())).digest('hex');
  assert.equal(hash, asset.sha256);
}
console.log(`${manifest.products.length} products, prices, canonicals, sitemap and image hashes verified.`);
