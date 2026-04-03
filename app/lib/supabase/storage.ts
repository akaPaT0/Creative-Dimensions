import { supabaseAdmin } from "@/app/lib/supabase/admin";

const PUBLIC_STORAGE_PREFIX = "/storage/v1/object/public/";

export const PUBLIC_ASSET_BUCKET = "product_images";

function normalizePath(rawPath: string) {
  return rawPath.replace(/^\/+/, "").replace(/\\/g, "/");
}

export function getPublicAssetUrl(path: string, bucket = PUBLIC_ASSET_BUCKET) {
  const cleanPath = normalizePath(path);
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(cleanPath);
  return data.publicUrl;
}

export async function uploadPublicAsset(params: {
  path: string;
  file?: File;
  bytes?: ArrayBuffer | Uint8Array;
  contentType?: string;
  bucket?: string;
  upsert?: boolean;
}) {
  const bucket = params.bucket || PUBLIC_ASSET_BUCKET;
  const cleanPath = normalizePath(params.path);
  const bytes =
    params.bytes instanceof Uint8Array
      ? params.bytes
      : params.bytes instanceof ArrayBuffer
        ? new Uint8Array(params.bytes)
        : params.file
          ? new Uint8Array(await params.file.arrayBuffer())
          : null;

  if (!bytes) {
    throw new Error(`Missing upload body for ${cleanPath}`);
  }

  const { error } = await supabaseAdmin.storage.from(bucket).upload(cleanPath, bytes, {
    contentType: params.contentType,
    upsert: params.upsert ?? true,
  });

  if (error) {
    throw new Error(error.message);
  }

  return getPublicAssetUrl(cleanPath, bucket);
}

export function getStorageObjectFromPublicUrl(url: string) {
  try {
    const parsed = new URL(url);
    const markerIndex = parsed.pathname.indexOf(PUBLIC_STORAGE_PREFIX);
    if (markerIndex === -1) return null;

    const rest = parsed.pathname.slice(markerIndex + PUBLIC_STORAGE_PREFIX.length);
    const slashIndex = rest.indexOf("/");
    if (slashIndex === -1) return null;

    const bucket = decodeURIComponent(rest.slice(0, slashIndex));
    const path = decodeURIComponent(rest.slice(slashIndex + 1));
    if (!bucket || !path) return null;

    return { bucket, path };
  } catch {
    return null;
  }
}

export async function deletePublicAssetByUrl(url: string) {
  const parsed = getStorageObjectFromPublicUrl(url);
  if (!parsed) return;

  const { error } = await supabaseAdmin.storage.from(parsed.bucket).remove([parsed.path]);
  if (error) {
    throw new Error(error.message);
  }
}
