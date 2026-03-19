import { randomBytes } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const PUBLIC_ROOT = path.join(process.cwd(), "public");

function toPosixPath(input: string) {
  return input.replace(/\\/g, "/");
}

function isBlobHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === "blob.vercel-storage.com" || host.endsWith(".public.blob.vercel-storage.com");
}

function ensureSafePublicPath(relativePath: string) {
  const normalized = toPosixPath(relativePath).replace(/^\/+/, "");
  const resolved = path.resolve(PUBLIC_ROOT, ...normalized.split("/"));
  if (!resolved.startsWith(PUBLIC_ROOT + path.sep) && resolved !== PUBLIC_ROOT) {
    throw new Error(`Unsafe public path: ${relativePath}`);
  }
  return { normalized, resolved };
}

function withRandomSuffix(relativePath: string) {
  const ext = path.extname(relativePath);
  const base = ext ? relativePath.slice(0, -ext.length) : relativePath;
  const suffix = randomBytes(4).toString("hex");
  return `${base}-${suffix}${ext}`;
}

export function normalizeAssetReference(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/")) return trimmed;
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `/${trimmed.replace(/^\/+/, "")}`;
  }
  try {
    const url = new URL(trimmed);
    if (isBlobHost(url.hostname)) return url.pathname || "";
  } catch {
    // keep original for non-URL inputs
  }
  return trimmed;
}

export async function saveBytesToPublic(
  relativePath: string,
  bytes: Uint8Array | Buffer,
  options?: { addRandomSuffix?: boolean }
) {
  const basePath = toPosixPath(relativePath).replace(/^\/+/, "");
  const finalRelative = options?.addRandomSuffix ? withRandomSuffix(basePath) : basePath;
  const { normalized, resolved } = ensureSafePublicPath(finalRelative);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, bytes);
  return `/${normalized}`;
}

export async function saveFileToPublic(
  relativePath: string,
  file: File,
  options?: { addRandomSuffix?: boolean }
) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return saveBytesToPublic(relativePath, buffer, options);
}

export async function deletePublicAsset(value: string) {
  const normalized = normalizeAssetReference(value);
  if (!normalized || normalized.startsWith("http://") || normalized.startsWith("https://")) return;
  const { resolved } = ensureSafePublicPath(normalized);
  await rm(resolved, { force: true });
}
