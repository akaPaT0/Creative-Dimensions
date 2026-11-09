import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireSupabaseUser } from "@/app/lib/supabase/auth-server";
import { deletePublicAssetByUrl, getStorageObjectFromPublicUrl, uploadPublicAsset } from "@/app/lib/supabase/storage";

export const runtime = "nodejs";

// The browser resizes and compresses before upload; this is a safety cap.
const MAX_BYTES = 400 * 1024;
const TYPES: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

/** Upload a profile photo to avatars/<userId>/ and remove the user's previous one. */
export async function POST(req: Request) {
  const auth = await requireSupabaseUser(req);
  if ("response" in auth) return auth.response;

  try {
    const form = await req.formData();
    const file = form.get("file");
    const previous = String(form.get("previous") || "");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
    }
    const ext = TYPES[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Use a JPG, PNG or WebP photo." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "That photo is too large." }, { status: 400 });
    }

    const folder = `avatars/${auth.userId}/`;
    const url = await uploadPublicAsset({
      path: `${folder}${Date.now()}-${randomBytes(3).toString("hex")}.${ext}`,
      file,
      contentType: file.type,
      upsert: false,
    });

    // Only ever delete this user's own previous avatar.
    if (previous) {
      const prev = getStorageObjectFromPublicUrl(previous);
      if (prev?.path.startsWith(folder)) {
        await deletePublicAssetByUrl(previous).catch(() => {});
      }
    }

    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : error && typeof error === "object" && "message" in error
          ? String((error as { message: unknown }).message)
          : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
