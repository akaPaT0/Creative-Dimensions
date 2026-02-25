import { NextResponse } from "next/server";
import {
  isSupportedModelFile,
  saveToLocalTmp,
  uploadToS3Compatible,
} from "@/app/lib/custom-quote-storage";

export const runtime = "nodejs";

const MAX_FILE_MB = 100;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const input = form.get("file");
    if (!(input instanceof File)) {
      return json({ error: "Missing file." }, 400);
    }

    if (input.size <= 0) return json({ error: "File is empty." }, 400);
    if (input.size > MAX_FILE_BYTES) {
      return json({ error: `File too large. Max ${MAX_FILE_MB}MB.` }, 400);
    }

    if (!isSupportedModelFile(input.name, input.type)) {
      return json({ error: "Unsupported file type. Use STL or 3MF." }, 400);
    }

    if (process.env.NODE_ENV === "production") {
      const uploaded = await uploadToS3Compatible(input);
      return json({ ok: true, fileUrl: uploaded.url, storage: "s3" });
    }

    const saved = await saveToLocalTmp(input);
    const requestUrl = new URL(req.url);
    const fileUrl = `${requestUrl.origin}/api/custom-quote/files/${encodeURIComponent(saved.storageName)}`;
    return json({ ok: true, fileUrl, storage: "tmp" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return json({ error: message }, 500);
  }
}
