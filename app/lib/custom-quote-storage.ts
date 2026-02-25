import { createHash, createHmac, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const TMP_DIR = path.join(os.tmpdir(), "creative-dimensions-quotes");

function toHexSha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

function hmacSha256(key: Buffer | string, data: string) {
  return createHmac("sha256", key).update(data).digest();
}

function yyyymmdd(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function amzDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function cleanEndpoint(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function inferExt(originalName: string) {
  const lower = originalName.trim().toLowerCase();
  if (lower.endsWith(".stl")) return ".stl";
  if (lower.endsWith(".3mf")) return ".3mf";
  return "";
}

function buildStorageName(originalName: string) {
  const ext = inferExt(originalName) || ".bin";
  return `${Date.now()}-${randomUUID()}${ext}`;
}

export function isSupportedModelFile(fileName: string, mimeType: string) {
  const ext = inferExt(fileName);
  if (ext === ".stl" || ext === ".3mf") return true;
  const mime = mimeType.trim().toLowerCase();
  return mime === "model/stl" || mime === "application/vnd.ms-package.3dmanufacturing-3dmodel+xml";
}

export async function saveToLocalTmp(file: File) {
  await fs.mkdir(TMP_DIR, { recursive: true });
  const storageName = buildStorageName(file.name);
  const outPath = path.join(TMP_DIR, storageName);
  const bytes = new Uint8Array(await file.arrayBuffer());
  await fs.writeFile(outPath, bytes);
  return { storageName, outPath };
}

export async function readFromLocalTmp(storageName: string) {
  const safe = path.basename(storageName);
  if (!safe) throw new Error("Invalid file path.");
  const outPath = path.join(TMP_DIR, safe);
  const bytes = await fs.readFile(outPath);
  return { outPath, bytes };
}

export async function uploadToS3Compatible(file: File, keyPrefix = "quotes/uploads") {
  const endpointRaw = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT || "";
  const bucket = (process.env.S3_BUCKET || process.env.R2_BUCKET || "").trim();
  const region = (process.env.S3_REGION || process.env.R2_REGION || "auto").trim();
  const accessKeyId = (process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = (process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || "").trim();

  if (!endpointRaw || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing S3/R2 environment variables.");
  }

  const endpoint = cleanEndpoint(endpointRaw);
  const storageName = buildStorageName(file.name);
  const key = `${keyPrefix.replace(/^\/+|\/+$/g, "")}/${storageName}`;
  const url = `${endpoint}/${bucket}/${key}`;

  const date = new Date();
  const shortDate = yyyymmdd(date);
  const requestDate = amzDate(date);
  const service = "s3";
  const host = new URL(endpoint).host;
  const contentType = file.type || "application/octet-stream";
  const payload = new Uint8Array(await file.arrayBuffer());
  const payloadHash = toHexSha256(payload);
  const canonicalUri = `/${bucket}/${key}`;
  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${requestDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest =
    `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const scope = `${shortDate}/${region}/${service}/aws4_request`;
  const stringToSign =
    "AWS4-HMAC-SHA256\n" +
    `${requestDate}\n` +
    `${scope}\n` +
    createHash("sha256").update(canonicalRequest).digest("hex");

  const kDate = hmacSha256(`AWS4${secretAccessKey}`, shortDate);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "content-type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": requestDate,
      authorization,
    },
    body: payload,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Upload failed with status ${res.status}.`);
  }

  const publicBase = (process.env.S3_PUBLIC_BASE_URL || process.env.R2_PUBLIC_BASE_URL || "").trim();
  const publicUrl = publicBase
    ? `${cleanEndpoint(publicBase)}/${key}`
    : `${endpoint}/${bucket}/${key}`;

  return { key, url: publicUrl };
}
