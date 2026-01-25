import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/custom-request" });
}

export async function POST(req: Request) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Missing BLOB_READ_WRITE_TOKEN (check Vercel env + .env.local and restart dev server)" },
        { status: 500 }
      );
    }

    const fd = await req.formData();
    const files = fd.getAll("files").filter(Boolean) as File[];

    if (!files.length) return NextResponse.json({ urls: [] });

    const urls: string[] = [];

    for (const f of files) {
      const safeName = `${Date.now()}-${f.name}`.replace(/[^a-zA-Z0-9._-]/g, "_");
      const blob = await put(`custom-requests/${safeName}`, f, {
        access: "public",
        token, // ✅ explicit, works local + Vercel
      });
      urls.push(blob.url);
    }

    return NextResponse.json({ urls });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upload failed" }, { status: 500 });
  }
}
