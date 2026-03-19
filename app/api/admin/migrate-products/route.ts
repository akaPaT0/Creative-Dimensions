import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { access } from "node:fs/promises";
import path from "node:path";
import { getProducts, saveProducts } from "@/app/lib/products-db";
import { normalizeAssetReference, saveBytesToPublic } from "@/app/lib/local-assets";
import type { Product } from "@/app/data/products";

function json(res: unknown, status = 200) {
  return NextResponse.json(res, { status });
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isBlobHttpUrl(value: string) {
  if (!value.startsWith("http://") && !value.startsWith("https://")) return false;
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "blob.vercel-storage.com" || host.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

async function publicPathExists(urlPath: string) {
  const relative = urlPath.replace(/^\/+/, "");
  const absolute = path.join(process.cwd(), "public", ...relative.split("/"));
  try {
    await access(absolute);
    return true;
  } catch {
    return false;
  }
}

async function maybeDownloadBlobAsset(
  value: string,
  cache: Map<string, string>,
  failures: string[]
): Promise<string> {
  const raw = asText(value);
  if (!raw) return "";
  if (!isBlobHttpUrl(raw)) return normalizeAssetReference(raw);
  if (cache.has(raw)) return cache.get(raw) || normalizeAssetReference(raw);

  const normalized = normalizeAssetReference(raw);
  if (!normalized.startsWith("/")) return normalized;
  if (await publicPathExists(normalized)) {
    cache.set(raw, normalized);
    return normalized;
  }

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    const attempts: Array<RequestInit | undefined> = [
      token ? { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" } : undefined,
      { cache: "no-store" },
    ];
    for (const init of attempts) {
      const res = await fetch(raw, init);
      if (!res.ok) continue;
      const bytes = Buffer.from(await res.arrayBuffer());
      const local = await saveBytesToPublic(normalized, bytes, { addRandomSuffix: false });
      cache.set(raw, local);
      return local;
    }
    throw new Error("download failed");
  } catch {
    failures.push(raw);
    cache.set(raw, normalized);
    return normalized;
  }
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

export async function POST() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.res;

    const source = await getProducts();
    const cache = new Map<string, string>();
    const failures: string[] = [];

    const migrated: Product[] = [];
    for (const product of source) {
      const currentImages = (product.images || []).map((x) => asText(x)).filter(Boolean);
      const migratedImages: string[] = [];
      for (const imageRef of currentImages) {
        migratedImages.push(await maybeDownloadBlobAsset(imageRef, cache, failures));
      }

      const modelRef = asText(product.customizeColors?.modelUrl);
      const migratedModel = modelRef
        ? await maybeDownloadBlobAsset(modelRef, cache, failures)
        : modelRef;

      migrated.push({
        ...product,
        image: product.image ? normalizeAssetReference(product.image) : product.image,
        images: migratedImages.length ? migratedImages : product.images,
        customizeColors: product.customizeColors
          ? {
              ...product.customizeColors,
              modelUrl: migratedModel || product.customizeColors.modelUrl,
            }
          : undefined,
      });
    }

    await saveProducts(migrated);
    return json({
      ok: true,
      migrated: migrated.length,
      blobUrlRewrites: cache.size,
      failedDownloads: failures.length,
      failures,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to migrate products";
    return json({ error: message }, 500);
  }
}
