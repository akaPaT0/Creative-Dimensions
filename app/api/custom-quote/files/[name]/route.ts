import path from "node:path";
import { NextResponse } from "next/server";
import { readFromLocalTmp } from "@/app/lib/custom-quote-storage";

export const runtime = "nodejs";

function contentTypeFor(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".stl")) return "model/stl";
  if (lower.endsWith(".3mf")) return "application/vnd.ms-package.3dmanufacturing-3dmodel+xml";
  return "application/octet-stream";
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await context.params;
    const safe = path.basename(name || "");
    if (!safe) return NextResponse.json({ error: "Missing file name." }, { status: 400 });

    const { bytes } = await readFromLocalTmp(safe);
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "content-type": contentTypeFor(safe),
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
