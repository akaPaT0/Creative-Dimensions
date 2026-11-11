import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { uploadPublicAsset } from "@/app/lib/supabase/storage";
import { checkRateLimit, getClientIp, recordFailedAttempt } from "@/app/lib/security/rate-limiter";
import { verifyTurnstileToken } from "@/app/lib/security/turnstile";

export const runtime = "nodejs";

const CUSTOM_REQUEST_FOLDER = "custom-requests";
const MAX_FILES = 6;
const MAX_FILE_BYTES = 4 * 1024 * 1024;

type Kind = "png" | "jpeg" | "webp" | "zip" | "model";

// The stored content type comes from this table, never from the uploader, so a
// file can't be served back as a web page or script from our storage.
const ALLOWED: Record<string, { kind: Kind; contentType: string }> = {
  png: { kind: "png", contentType: "image/png" },
  jpg: { kind: "jpeg", contentType: "image/jpeg" },
  jpeg: { kind: "jpeg", contentType: "image/jpeg" },
  webp: { kind: "webp", contentType: "image/webp" },
  zip: { kind: "zip", contentType: "application/zip" },
  "3mf": { kind: "zip", contentType: "application/octet-stream" },
  stl: { kind: "model", contentType: "application/octet-stream" },
  obj: { kind: "model", contentType: "application/octet-stream" },
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function extensionOf(name: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  return signature.every((byte, i) => bytes[offset + i] === byte);
}

/** The file's first bytes must match what its extension claims. */
function contentMatches(kind: Kind, bytes: Uint8Array) {
  if (kind === "png") return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (kind === "jpeg") return startsWith(bytes, [0xff, 0xd8, 0xff]);
  if (kind === "webp") {
    return startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8);
  }
  if (kind === "zip") return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]);

  // STL / OBJ have no fixed signature: refuse anything that is clearly another format.
  if (startsWith(bytes, [0x4d, 0x5a])) return false; // Windows program
  if (startsWith(bytes, [0x7f, 0x45, 0x4c, 0x46])) return false; // Linux program
  if (startsWith(bytes, [0x50, 0x4b])) return false; // zip archive
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return false; // PDF
  if (startsWith(bytes, [0x23, 0x21])) return false; // script
  const head = Buffer.from(bytes.subarray(0, 512)).toString("latin1").trimStart().toLowerCase();
  if (head.startsWith("<")) return false; // HTML / SVG / XML
  return true;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    const ipKey = `custom-request:ip:${ip}`;
    const limit = checkRateLimit(ipKey);
    if (!limit.allowed) {
      const minutes = Math.ceil((limit.retryAfterSeconds || 300) / 60);
      return json({ error: `Too many uploads. Please wait ${minutes} minute${minutes > 1 ? "s" : ""}` }, 429);
    }

    const fd = await req.formData().catch(() => null);
    if (!fd) return json({ error: "Invalid upload" }, 400);

    const files = fd.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
    if (!files.length) return json({ urls: [] });
    if (files.length > MAX_FILES) return json({ error: `Attach at most ${MAX_FILES} files` }, 400);

    // Check every file before storing any of them.
    const prepared: Array<{ name: string; bytes: Uint8Array; contentType: string }> = [];
    for (const file of files) {
      const ext = extensionOf(file.name);
      const rule = ALLOWED[ext];
      if (!rule) return json({ error: "Only PNG, JPG, WebP, STL, 3MF, OBJ or ZIP files are accepted" }, 400);
      if (file.size > MAX_FILE_BYTES) return json({ error: "Each file must be 4 MB or smaller" }, 400);
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!contentMatches(rule.kind, bytes)) {
        return json({ error: `"${file.name.slice(0, 60)}" doesn't look like a real .${ext} file` }, 400);
      }
      prepared.push({
        name: `${randomBytes(4).toString("hex")}.${ext}`,
        bytes,
        contentType: rule.contentType,
      });
    }

    // Bot check, same rule as the review form: always required on the live site.
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    const tokenEntry = fd.get("turnstileToken");
    const turnstileToken = typeof tokenEntry === "string" ? tokenEntry : "";
    const production = process.env.NODE_ENV === "production";
    if (production && (!turnstileSecret || /^[123]x0+AA$/.test(turnstileSecret))) {
      return json({ error: "Uploads are temporarily unavailable" }, 503);
    }
    if (turnstileSecret || turnstileToken) {
      const check = await verifyTurnstileToken(turnstileToken, ip, "custom_request");
      if (!check.success) return json({ error: check.error || "Security check failed" }, 403);
    }

    recordFailedAttempt(ipKey);

    const origin = new URL(req.url).origin;
    const urls: string[] = [];
    for (const file of prepared) {
      await uploadPublicAsset({
        path: `${CUSTOM_REQUEST_FOLDER}/${file.name}`,
        bytes: file.bytes,
        contentType: file.contentType,
        upsert: false,
      });
      // Short link on our own domain; /f/[name] forwards to the stored file.
      urls.push(`${origin}/f/${file.name}`);
    }

    return json({ urls });
  } catch (error) {
    console.error("Custom request upload failed:", error);
    return json({ error: "Upload failed" }, 500);
  }
}
