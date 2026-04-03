import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { products as snapshotProducts, type Product } from "@/app/data/products";
import { getProductsFromDb, saveProducts } from "@/app/lib/products-db";
import { uploadPublicAsset as uploadToStorage } from "@/app/lib/supabase/storage";

function json(res: unknown, status = 200) {
  return NextResponse.json(res, { status });
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function guessContentType(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".glb")) return "model/gltf-binary";
  return "application/octet-stream";
}

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, res: json({ error: "Unauthorized" }, 401) };

  const user = await currentUser();
  if (!user) return { ok: false as const, res: json({ error: "Unauthorized" }, 401) };

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const primaryEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    "";
  const userEmail = primaryEmail.trim().toLowerCase();

  if (!adminEmail || userEmail !== adminEmail) {
    return { ok: false as const, res: json({ error: "Forbidden" }, 403) };
  }
  return { ok: true as const };
}

async function uploadPublicAsset(assetPath: string, cache: Map<string, string>) {
  const clean = assetPath.replace(/^\//, "");
  if (!clean || cache.has(clean)) return cache.get(clean) || assetPath;

  const absolutePath = path.join(process.cwd(), "public", clean);
  const content = await readFile(absolutePath);
  const uploaded = await uploadToStorage({
    path: clean,
    bytes: content,
    contentType: guessContentType(clean),
  });
  cache.set(clean, uploaded);
  return uploaded;
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.res;

    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "1";
    const existing = await getProductsFromDb();
    if (existing.length > 0 && !force) {
      return json({
        ok: true,
        migrated: false,
        reason: "Products already exist in DB. Use ?force=1 to overwrite.",
        count: existing.length,
      });
    }

    const cache = new Map<string, string>();
    const migrated: Product[] = [];

    for (const product of snapshotProducts) {
      const images = (product.images || [])
        .map((x) => asText(x))
        .filter(Boolean);
      const migratedImages: string[] = [];
      for (const imagePath of images) {
        if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
          migratedImages.push(imagePath);
          continue;
        }
        try {
          migratedImages.push(await uploadPublicAsset(imagePath, cache));
        } catch {
          migratedImages.push(imagePath);
        }
      }

      let modelUrl = asText(product.customizeColors?.modelUrl);
      if (modelUrl && !modelUrl.startsWith("http://") && !modelUrl.startsWith("https://")) {
        try {
          modelUrl = await uploadPublicAsset(modelUrl, cache);
        } catch {
          // keep old value if file missing
        }
      }

      migrated.push({
        ...product,
        images: migratedImages.length ? migratedImages : product.images,
        customizeColors: product.customizeColors
          ? {
              ...product.customizeColors,
              modelUrl: modelUrl || product.customizeColors.modelUrl,
            }
          : undefined,
      });
    }

    await saveProducts(migrated);
    return json({
      ok: true,
      migrated: true,
      count: migrated.length,
      uploadedAssets: cache.size,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to migrate products";
    return json({ error: message }, 500);
  }
}

