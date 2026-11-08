import { NextResponse } from "next/server";
import { getPublicAssetUrl } from "@/app/lib/supabase/storage";

export const runtime = "nodejs";

// Short links for files attached to custom requests, e.g. /f/k3x9q2ma.png
const SHORT_NAME = /^[a-z0-9]{8}(\.[a-z0-9]{1,5})?$/;

export async function GET(
  _req: Request,
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params;
  if (!SHORT_NAME.test(name || "")) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  return NextResponse.redirect(getPublicAssetUrl(`custom-requests/${name}`), 302);
}
