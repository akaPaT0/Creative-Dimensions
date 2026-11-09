import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import assert from "node:assert/strict";

// Dry run by default. Supply HALLOWEEN_ASSET_DIR and server-only Supabase env.
// Only inserts this manifest's products; never replaces or deletes the catalog.
const apply = process.argv.includes("--apply");
const manifest = JSON.parse(await readFile(new URL("../catalog/halloween-2026.json", import.meta.url), "utf8"));
const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const assetDir = process.env.HALLOWEEN_ASSET_DIR;
assert.equal(new URL(base).hostname, "ypevaawhxhupjxjgkwdp.supabase.co");
assert(key && assetDir, "Missing server credentials or HALLOWEEN_ASSET_DIR");
const headers = { apikey: key, Authorization: `Bearer ${key}` };
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path}: ${response.status} ${await response.text()}`);
  return response;
}

const snapshotDir = resolve(".vercel/halloween-release");
await mkdir(snapshotDir, { recursive: true });
const before = await (await request("/rest/v1/products?select=*&limit=1000")).json();
assert.equal(manifest.products.length, 8);
assert.equal(manifest.assets.length, 22);
assert.equal(new Set(manifest.products.map((p) => p.SKU)).size, 8);
const existing = [];
for (const product of manifest.products) {
  assert.equal(product.category, "halloween");
  const matches = before.filter((p) => p.SKU === product.SKU || p.slug === product.slug);
  assert(matches.length <= 1, `Duplicate product: ${product.slug}`);
  if (matches.length) {
    for (const [field, value] of Object.entries(product)) {
      assert.deepEqual(matches[0][field], value, `Existing product differs: ${product.slug}.${field}`);
    }
    existing.push(product.SKU);
  }
}
const assetBytes = new Map();
for (const asset of manifest.assets) {
  const bytes = await readFile(resolve(assetDir, asset.file));
  assert.equal(hash(bytes), asset.sha256, `Asset mismatch: ${asset.file}`);
  assetBytes.set(asset.file, bytes);
}
console.log(JSON.stringify({ apply, existingCatalog: before.length, existingBatchProducts: existing.length, products: 8, assets: 22 }));
if (!apply) process.exit(0);

await writeFile(resolve(snapshotDir, `catalog-before-${Date.now()}.json`), JSON.stringify(before, null, 2));
for (const asset of manifest.assets) {
  const path = `/storage/v1/object/product_images/${asset.storagePath}`;
  const publicPath = `/storage/v1/object/public/product_images/${asset.storagePath}`;
  const stored = await fetch(`${base}${publicPath}`);
  if (stored.ok) {
    assert.equal(hash(Buffer.from(await stored.arrayBuffer())), asset.sha256, `Stored asset differs: ${asset.file}`);
  } else {
    assert([400, 404].includes(stored.status), `Unexpected storage response: ${stored.status}`);
    await request(path, {
      method: "POST",
      headers: { "Content-Type": "image/webp", "Cache-Control": "max-age=31536000", "x-upsert": "false" },
      body: assetBytes.get(asset.file),
    });
    const check = await fetch(`${base}${publicPath}`);
    assert(check.ok, `Uploaded asset not public: ${asset.file}`);
    assert.equal(hash(Buffer.from(await check.arrayBuffer())), asset.sha256);
  }
  console.log(`Verified image: ${asset.file}`);
}

// One PostgREST insert statement is atomic for all new rows.
const pending = manifest.products.filter((p) => !existing.includes(p.SKU));
if (pending.length) {
  const inserted = await (await request("/rest/v1/products", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(pending),
  })).json();
  assert.equal(inserted.length, pending.length);
}
const after = await (await request("/rest/v1/products?select=*&limit=1000")).json();
const newIds = new Set(manifest.products.map((p) => p.SKU));
for (const original of before.filter((p) => !newIds.has(p.SKU))) {
  assert.deepEqual(after.find((p) => p.SKU === original.SKU), original, `Unrelated product changed: ${original.SKU}`);
}
for (const expected of manifest.products) {
  const actual = after.find((p) => p.SKU === expected.SKU);
  assert(actual, `Missing published product: ${expected.SKU}`);
  for (const [field, value] of Object.entries(expected)) assert.deepEqual(actual[field], value);
}
const receipt = { category: "halloween", products: 8, images: 22, totalProducts: after.length, unchangedExistingProducts: before.filter((p) => !newIds.has(p.SKU)).length, publishedAt: new Date().toISOString() };
await writeFile(resolve(snapshotDir, "receipt.json"), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt));
