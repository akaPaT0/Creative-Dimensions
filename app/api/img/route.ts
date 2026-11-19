import sharp from "sharp";
import { getPublicAssetUrl, uploadPublicAsset } from "@/app/lib/supabase/storage";
import { VARIANT_FOLDER, VARIANT_WIDTHS, parseVariantSource } from "@/app/lib/image-variants";

export const runtime = "nodejs";
export const maxDuration = 30;

// Serves a resized WebP copy of one of our photos. The first request for a size makes the copy
// and keeps it in Supabase; after that Vercel's CDN serves it without running this code.
// The URL changes whenever a photo is replaced (?v=...), so responses never go stale.
const CACHE_FOREVER = "public, max-age=31536000, immutable";

function imageResponse(bytes: ArrayBuffer | Uint8Array) {
  return new Response(bytes as BodyInit, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": CACHE_FOREVER,
      "CDN-Cache-Control": CACHE_FOREVER,
    },
  });
}

function fallbackToOriginal(url: string) {
  // Something went wrong: show the full-size photo rather than a broken image, and retry soon.
  return new Response(null, {
    status: 307,
    headers: { Location: url, "Cache-Control": "public, max-age=60" },
  });
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const width = Number(requestUrl.searchParams.get("w"));
  const source = parseVariantSource(requestUrl.searchParams.get("src") ?? "");

  if (!source || !(VARIANT_WIDTHS as readonly number[]).includes(width)) {
    return new Response("Unsupported image request", { status: 400 });
  }

  const originalUrl = new URL(source.sourceUrl, requestUrl.origin).toString();
  const variantPath = `${VARIANT_FOLDER}/${width}/${source.key}.webp`;

  try {
    const stored = await fetch(getPublicAssetUrl(variantPath), { cache: "no-store" });
    if (stored.ok) return imageResponse(await stored.arrayBuffer());

    const original = await fetch(originalUrl, { cache: "no-store" });
    if (!original.ok) {
      return new Response("Image not found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
    }

    const resized = await sharp(Buffer.from(await original.arrayBuffer()), { failOn: "none" })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    try {
      await uploadPublicAsset({ path: variantPath, bytes: resized, contentType: "image/webp", upsert: true });
    } catch (error) {
      console.error("Could not store image variant", variantPath, error);
    }

    return imageResponse(resized);
  } catch (error) {
    console.error("Image variant failed", variantPath, error);
    return fallbackToOriginal(originalUrl);
  }
}
