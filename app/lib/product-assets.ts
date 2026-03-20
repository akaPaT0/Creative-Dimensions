import type { FileOptions } from "@supabase/storage-js";
import { deletePublicAsset } from "@/app/lib/local-assets";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

const PRODUCT_ASSETS_BUCKET = "product_images";

function toPosixPath(input: string) {
  return input.replace(/\\/g, "/");
}

function withRandomSuffix(relativePath: string) {
  const extIndex = relativePath.lastIndexOf(".");
  if (extIndex <= 0) {
    return `${relativePath}-${crypto.randomUUID().slice(0, 8)}`;
  }
  const base = relativePath.slice(0, extIndex);
  const ext = relativePath.slice(extIndex);
  return `${base}-${crypto.randomUUID().slice(0, 8)}${ext}`;
}

function normalizeStoragePath(relativePath: string) {
  return toPosixPath(relativePath).replace(/^\/+/, "");
}

function extractStoragePath(value: string) {
  const raw = value.trim();
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) return "";

  try {
    const url = new URL(raw);
    const publicPrefix = `/storage/v1/object/public/${PRODUCT_ASSETS_BUCKET}/`;
    const signedPrefix = `/storage/v1/object/sign/${PRODUCT_ASSETS_BUCKET}/`;

    if (url.pathname.startsWith(publicPrefix)) {
      return decodeURIComponent(url.pathname.slice(publicPrefix.length));
    }
    if (url.pathname.startsWith(signedPrefix)) {
      return decodeURIComponent(url.pathname.slice(signedPrefix.length));
    }
  } catch {
    return "";
  }

  return "";
}

function inferContentType(source: File | Uint8Array | Buffer, fallback?: string) {
  if (fallback?.trim()) return fallback.trim();
  if (source instanceof File && source.type.trim()) return source.type.trim();
  return undefined;
}

async function toBytes(source: File | Uint8Array | Buffer) {
  if (source instanceof File) {
    return Buffer.from(await source.arrayBuffer());
  }
  return Buffer.isBuffer(source) ? source : Buffer.from(source);
}

export function getProductAssetPublicUrl(relativePath: string) {
  const storagePath = normalizeStoragePath(relativePath);
  const { data } = supabaseAdmin.storage.from(PRODUCT_ASSETS_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function uploadProductAsset(
  relativePath: string,
  source: File | Uint8Array | Buffer,
  options?: {
    addRandomSuffix?: boolean;
    contentType?: string;
    upsert?: boolean;
  }
) {
  const basePath = normalizeStoragePath(relativePath);
  const storagePath = options?.addRandomSuffix ? withRandomSuffix(basePath) : basePath;
  const bytes = await toBytes(source);
  const uploadOptions: FileOptions = {
    contentType: inferContentType(source, options?.contentType),
    upsert: options?.upsert ?? true,
  };

  const { error } = await supabaseAdmin
    .storage
    .from(PRODUCT_ASSETS_BUCKET)
    .upload(storagePath, bytes, uploadOptions);

  if (error) {
    throw new Error(error.message);
  }

  return getProductAssetPublicUrl(storagePath);
}

export async function deleteProductAsset(value: string) {
  const raw = value.trim();
  if (!raw) return;

  const storagePath = extractStoragePath(raw);
  if (storagePath) {
    const { error } = await supabaseAdmin
      .storage
      .from(PRODUCT_ASSETS_BUCKET)
      .remove([storagePath]);

    if (!error) return;
  }

  await deletePublicAsset(raw);
}
