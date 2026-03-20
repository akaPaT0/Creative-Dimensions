import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { uploadProductAsset } from "@/app/lib/product-assets";
import { getProducts, upsertProduct } from "@/app/lib/products-db";
import type { Product } from "@/app/data/products";

function json(res: unknown, status = 200) {
  return NextResponse.json(res, { status });
}

function normalizeSlug(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, "-");
}

function slugifyFolder(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function guessImageExt(filename: string, mime: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png") || mime === "image/png") return "png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || mime === "image/jpeg") return "jpg";
  if (lower.endsWith(".webp") || mime === "image/webp") return "webp";
  return "webp";
}

function isGlbFile(file: File) {
  const name = file.name.toLowerCase();
  const mime = (file.type || "").toLowerCase();
  return (
    name.endsWith(".glb") || mime === "model/gltf-binary" || mime === "application/octet-stream"
  );
}

function safeModelBaseName(slug: string, fallback: string) {
  const normalized = slugifyFolder(slug);
  if (normalized) return normalized;
  const fb = slugifyFolder(fallback);
  return fb || "model";
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

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.res;

    const form = await req.formData();
    const id = String(form.get("id") || "").trim();
    const name = String(form.get("name") || "").trim();
    const slugRaw = String(form.get("slug") || name || "");
    const slug = normalizeSlug(slugRaw);
    const categoryRaw = String(form.get("category") || "").trim();
    const subCategoryRaw = String(form.get("subCategory") || "").trim();
    const category = slugifyFolder(categoryRaw);
    const subCategory = slugifyFolder(subCategoryRaw);
    const priceUSDStr = String(form.get("priceUSD") || "").trim();
    const description = String(form.get("description") || "").trim();
    const isNew = String(form.get("isNew") || "true") === "true";
    const featured = String(form.get("featured") || "false") === "true";
    const files = form.getAll("images") as File[];
    const model = form.get("model");
    const modelFile = model instanceof File && model.size > 0 ? model : null;

    if (!id || !name || !slug || !category || !subCategory || !priceUSDStr || !description) {
      return json(
        { error: "Missing: id, name, category, subCategory, priceUSD, description" },
        400
      );
    }
    if (files.length === 0) return json({ error: "Missing: images" }, 400);
    if (modelFile && !isGlbFile(modelFile)) return json({ error: "3D model must be a .glb file" }, 400);

    const priceUSD = Number(priceUSDStr);
    if (!Number.isFinite(priceUSD)) return json({ error: "priceUSD must be a number" }, 400);

    const existing = await getProducts();
    if (existing.some((p) => p.id === id)) {
      return json({ error: `Product id already exists: ${id}` }, 409);
    }

    const images: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = guessImageExt(file.name, file.type);
      const assetPath = `products/${category}/${subCategory}/${slug}-${i + 1}.${ext}`;
      const assetUrl = await uploadProductAsset(assetPath, file, { addRandomSuffix: false });
      images.push(assetUrl);
    }

    let modelUrl: string | undefined;
    if (modelFile) {
      const modelBase = safeModelBaseName(slug, id);
      const modelPath = `models/${category}/${subCategory}/${modelBase}.glb`;
      modelUrl = await uploadProductAsset(modelPath, modelFile, {
        addRandomSuffix: false,
        contentType: modelFile.type || "model/gltf-binary",
      });
    }

    const product: Product = {
      id,
      name,
      slug,
      category,
      subCategory,
      priceUSD,
      description,
      images,
      isNew,
      featured,
      ...(modelUrl
        ? {
            customizeColors: {
              modelUrl,
              defaultHexes: ["#ffffff"],
            },
          }
        : {}),
    };

    await upsertProduct(product);

    return json({ ok: true, product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
}

