import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    const files = fd.getAll("files").filter(Boolean) as File[];

    if (!files.length) {
      return NextResponse.json({ urls: [] });
    }

    const urls: string[] = [];

    for (const f of files) {
      const safeName = `${Date.now()}-${f.name}`.replace(/[^a-zA-Z0-9._-]/g, "_");

      const blob = await put(`custom-requests/${safeName}`, f, {
        access: "public",
      });

      urls.push(blob.url);
    }

    return NextResponse.json({ urls });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
