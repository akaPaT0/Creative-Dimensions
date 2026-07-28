import { NextResponse } from "next/server";
import { getProducts, saveProducts } from "@/app/lib/products-db";
import type { Product } from "@/app/data/products";
import { deletePublicAssetByUrl, uploadPublicAsset } from "@/app/lib/supabase/storage";
import { requireSupabaseAdmin } from "@/app/lib/supabase/auth-server";

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

function parseStringArray(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const out = parsed.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
    return out;
  } catch {
    return null;
  }
}

async function safeDelete(url: string) {
  if (!url) return;
  try {
    await deletePublicAssetByUrl(url);
  } catch {
    // ignore delete failures
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireSupabaseAdmin(req);
    if ("response" in admin) return admin.response;

    const { id } = await ctx.params;
    const form = await req.formData();

    const name = String(form.get("name") || "").trim();
    const slugRaw = String(form.get("slug") || "").trim();
    const categoryRaw = String(form.get("category") || "").trim();
    const subCategoryRaw = String(form.get("subCategory") || "").trim();
    const priceUSDStr = String(form.get("priceUSD") || "").trim();
    const description = String(form.get("description") || "").trim();
    const isNew = String(form.get("isNew") || "false") === "true";
    const featured = String(form.get("featured") || "false") === "true";
    const imagesOrderRaw = String(form.get("imagesOrder") || "").trim();
    const imageFiles = form.getAll("images") as File[];
    const model = form.get("model");
    const modelFile = model instanceof File && model.size > 0 ? model : null;

    if (!name || !categoryRaw || !subCategoryRaw || !priceUSDStr || !description) {
      return json({ error: "Missing required fields" }, 400);
    }
    if (modelFile && !isGlbFile(modelFile)) return json({ error: "3D model must be a .glb file" }, 400);

    const priceUSD = Number(priceUSDStr);
    if (!Number.isFinite(priceUSD)) return json({ error: "priceUSD must be a number" }, 400);

    const slug = normalizeSlug(slugRaw || name);
    const category = slugifyFolder(categoryRaw);
    const subCategory = slugifyFolder(subCategoryRaw);
    const modelBase = safeModelBaseName(slug, id);

    const products = await getProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return json({ error: `Product not found: ${id}` }, 404);

    const prev = products[idx];
    const prevImages = Array.isArray(prev.images) ? prev.images : [];
    const prevModelUrl = prev.customizeColors?.modelUrl || "";

    let nextImages = prevImages;
    if (imageFiles.length > 0) {
      const uploaded: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const ext = guessImageExt(file.name, file.type);
        const assetPath = `${category}/${subCategory}/${slug}-${String(i + 1).padStart(3, "0")}.${ext}`;
        const result = await uploadPublicAsset({
          path: assetPath,
          file,
          contentType: file.type || undefined,
        });
        uploaded.push(result);
      }
      for (const oldUrl of prevImages) await safeDelete(oldUrl);
      nextImages = uploaded;
    } else if (imagesOrderRaw) {
      const ordered = parseStringArray(imagesOrderRaw);
      if (!ordered) return json({ error: "imagesOrder must be valid JSON array of strings" }, 400);
      const prevSet = new Set(prevImages);
      for (const url of ordered) {
        if (!prevSet.has(url)) return json({ error: `imagesOrder contains unknown image: ${url}` }, 400);
      }
      const removed = prevImages.filter((x) => !ordered.includes(x));
      for (const url of removed) await safeDelete(url);
      nextImages = ordered;
    }

    let nextCustomizeColors = prev.customizeColors;
    if (modelFile) {
      const modelPath = `models/${category}/${subCategory}/${modelBase}.glb`;
      const uploaded = await uploadPublicAsset({
        path: modelPath,
        file: modelFile,
        contentType: "model/gltf-binary",
      });
      if (prevModelUrl && prevModelUrl !== uploaded) await safeDelete(prevModelUrl);
      nextCustomizeColors = {
        modelUrl: uploaded,
        defaultHexes:
          prev.customizeColors?.defaultHexes && prev.customizeColors.defaultHexes.length
            ? prev.customizeColors.defaultHexes
            : ["#ffffff"],
        slotLabels: prev.customizeColors?.slotLabels,
      };
    }

    const updated: Product = {
      ...prev,
      id,
      name,
      slug,
      category,
      subCategory,
      priceUSD,
      description,
      isNew,
      featured,
      images: nextImages,
      ...(nextCustomizeColors ? { customizeColors: nextCustomizeColors } : {}),
    };

    const next = [...products];
    next[idx] = updated;
    await saveProducts(next);

    return json({ ok: true, product: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireSupabaseAdmin(_req);
    if ("response" in admin) return admin.response;
    const { id } = await ctx.params;

    const products = await getProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return json({ error: `Product not found: ${id}` }, 404);

    const target = products[idx];
    const next = [...products];
    next.splice(idx, 1);
    await saveProducts(next);

    for (const url of target.images || []) await safeDelete(url);
    if (target.customizeColors?.modelUrl) await safeDelete(target.customizeColors.modelUrl);

    return json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
}

