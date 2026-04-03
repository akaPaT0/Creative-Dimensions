import { NextResponse } from "next/server";
import { uploadPublicAsset } from "@/app/lib/supabase/storage";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/custom-request" });
}

export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    const files = fd.getAll("files").filter(Boolean) as File[];

    if (!files.length) return NextResponse.json({ urls: [] });

    const urls: string[] = [];

    for (const file of files) {
      const safeName = `${Date.now()}-${file.name}`.replace(/[^a-zA-Z0-9._-]/g, "_");
      const url = await uploadPublicAsset({
        path: `custom-requests/${safeName}`,
        file,
        contentType: file.type || undefined,
      });
      urls.push(url);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
