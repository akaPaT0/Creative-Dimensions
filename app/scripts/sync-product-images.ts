import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const PRODUCTS_TABLE = "products";
const BUCKET = "product_images";

type ProductRow = {
  SKU?: string;
  slug?: string;
  category?: string;
  subCategory?: string;
};

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildPublicUrl(path: string) {
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function imageSort(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function normalizeForMatch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

async function main() {
  const { data: products, error } = await supabaseAdmin
    .from(PRODUCTS_TABLE)
    .select("SKU, slug, category, subCategory");

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  if (!products?.length) {
    console.log("No products found.");
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const raw of products as ProductRow[]) {
    const sku = asText(raw.SKU);
    const slugRaw = asText(raw.slug);
    const slug = normalizeForMatch(slugRaw);
    const category = asText(raw.category).toLowerCase();
    const subCategory = asText(raw.subCategory).toLowerCase();

    if (!sku || !slug || !category || !subCategory) {
      console.log(`Skipping missing fields: SKU=${sku}, slug=${slugRaw}`);
      skipped++;
      continue;
    }

    const folder = `${category}/${subCategory}`;

    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(BUCKET)
      .list(folder, {
        limit: 100,
        sortBy: { column: "name", order: "asc" },
      });

    if (listError) {
      console.log(`List failed for ${folder}: ${listError.message}`);
      skipped++;
      continue;
    }

    const matched = (files || [])
      .filter((file) => {
        const name = asText(file.name).toLowerCase();
        return (
          name.startsWith(`${slug}-`) &&
          (name.endsWith(".jpg") ||
            name.endsWith(".jpeg") ||
            name.endsWith(".png") ||
            name.endsWith(".webp"))
        );
      })
      .sort(imageSort);

    const imageUrls = matched.map((file) =>
      buildPublicUrl(`${folder}/${file.name}`)
    );

    if (!imageUrls.length) {
      console.log(`No images found for ${slugRaw} in ${folder}`);
      skipped++;
      continue;
    }

    const { error: updateError } = await supabaseAdmin
      .from(PRODUCTS_TABLE)
      .update({
        images: JSON.stringify(imageUrls),
      })
      .eq("SKU", sku);

    if (updateError) {
      console.log(`Update failed for ${slugRaw}: ${updateError.message}`);
      skipped++;
      continue;
    }

    console.log(`Updated ${slugRaw}: ${imageUrls.length} image(s)`);
    updated++;
  }

  console.log(`Done. Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});