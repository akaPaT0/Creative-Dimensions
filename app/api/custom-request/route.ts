import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { uploadPublicAsset } from "@/app/lib/supabase/storage";

export const runtime = "nodejs";

const CUSTOM_REQUEST_FOLDER = "custom-requests";

function shortFileName(original: string) {
  const dot = original.lastIndexOf(".");
  const ext =
    dot > 0 ? original.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) : "";
  const id = randomBytes(4).toString("hex"); // 8 chars, a-f0-9
  return ext ? `${id}.${ext}` : id;
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/custom-request" });
}

export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    const files = fd.getAll("files").filter(Boolean) as File[];

    if (!files.length) return NextResponse.json({ urls: [] });

    const origin = new URL(req.url).origin;
    const urls: string[] = [];

    for (const file of files) {
      const name = shortFileName(file.name);
      await uploadPublicAsset({
        path: `${CUSTOM_REQUEST_FOLDER}/${name}`,
        file,
        contentType: file.type || undefined,
        upsert: false,
      });
      // Short link on our own domain; /f/[name] forwards to the stored file.
      urls.push(`${origin}/f/${name}`);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
