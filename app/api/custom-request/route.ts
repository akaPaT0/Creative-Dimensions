import { NextResponse } from "next/server";
import { saveFileToPublic } from "@/app/lib/local-assets";

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
    for (const f of files) {
      const safeName = `${Date.now()}-${f.name}`.replace(/[^a-zA-Z0-9._-]/g, "_");
      const localUrl = await saveFileToPublic(`custom-requests/${safeName}`, f, {
        addRandomSuffix: false,
      });
      urls.push(localUrl);
    }

    return NextResponse.json({ urls });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
