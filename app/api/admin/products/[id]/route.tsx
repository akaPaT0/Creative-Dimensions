import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import vm from "node:vm";

function json(res: any, status = 200) {
  return NextResponse.json(res, { status });
}

function encodeRepoPath(p: string) {
  return p.split("/").map(encodeURIComponent).join("/");
}

function normalizeSlug(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, "-");
}

function slugifyFolder(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function guessExt(filename: string, mime: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png") || mime === "image/png") return "png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || mime === "image/jpeg") return "jpg";
  if (lower.endsWith(".webp") || mime === "image/webp") return "webp";
  return "webp";
}

async function ghFetch(path: string, init?: RequestInit) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("Missing GITHUB_TOKEN");

  const r = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const text = await r.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!r.ok) {
    throw new Error(
      `GitHub API error ${r.status}: ${typeof data === "string" ? data : JSON.stringify(data)}`
    );
  }
  return data;
}

async function getFile(owner: string, repo: string, filePath: string, branch: string) {
  const encoded = encodeRepoPath(filePath);
  const data = await ghFetch(
    `/repos/${owner}/${repo}/contents/${encoded}?ref=${encodeURIComponent(branch)}`
  );

  const contentB64 = (data.content || "").replace(/\n/g, "");
  const buff = Buffer.from(contentB64, "base64");
  return { sha: data.sha as string, text: buff.toString("utf8") as string };
}

async function tryGetSha(owner: string, repo: string, filePath: string, branch: string) {
  try {
    const encoded = encodeRepoPath(filePath);
    const data = await ghFetch(
      `/repos/${owner}/${repo}/contents/${encoded}?ref=${encodeURIComponent(branch)}`
    );
    return data?.sha as string;
  } catch {
    return undefined;
  }
}

async function putFile(params: {
  owner: string;
  repo: string;
  path: string;
  branch: string;
  message: string;
  contentBase64: string;
  sha?: string;
}) {
  const encoded = encodeRepoPath(params.path);
  const body: any = { message: params.message, content: params.contentBase64, branch: params.branch };
  if (params.sha) body.sha = params.sha;

  return ghFetch(`/repos/${params.owner}/${params.repo}/contents/${encoded}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

async function deleteFile(params: {
  owner: string;
  repo: string;
  path: string;
  branch: string;
  message: string;
  sha: string;
}) {
  const encoded = encodeRepoPath(params.path);
  return ghFetch(`/repos/${params.owner}/${params.repo}/contents/${encoded}`, {
    method: "DELETE",
    body: JSON.stringify({
      message: params.message,
      sha: params.sha,
      branch: params.branch,
    }),
  });
}

function extractProductsArrayLiteral(tsText: string) {
  const anchor = "export const products";
  const i = tsText.indexOf(anchor);
  if (i === -1) throw new Error("Could not find 'export const products' in products.ts");

  const startBracket = tsText.indexOf("[", i);
  if (startBracket === -1) throw new Error("Could not find products array '['");

  const end = tsText.indexOf("];", startBracket);
  if (end === -1) throw new Error("Could not find products array closing '];'");

  return tsText.slice(startBracket, end + 1);
}

function parseProducts(tsText: string) {
  const arr = extractProductsArrayLiteral(tsText);
  const script = `module.exports = ${arr};`;
  const sandbox: any = { module: { exports: null } };
  vm.createContext(sandbox);
  vm.runInContext(script, sandbox, { timeout: 800 });
  if (!Array.isArray(sandbox.module.exports)) throw new Error("Parsed products is not an array");
  return sandbox.module.exports;
}

function renderProductsTs(products: any[]) {
  // Minimal, stable file output (keeps your types flexible)
  const lines: string[] = [];
  lines.push(`export type Category = string;`);
  lines.push(``);
  lines.push(`export type SubCategory = string;`);
  lines.push(``);
  lines.push(`export type Product = {`);
  lines.push(`  id: string;`);
  lines.push(`  name: string;`);
  lines.push(`  slug: string;`);
  lines.push(`  category: Category;`);
  lines.push(`  subCategory?: SubCategory;`);
  lines.push(`  priceUSD: number;`);
  lines.push(`  description: string;`);
  lines.push(`  isNew?: boolean;`);
  lines.push(`  featured?: boolean;`);
  lines.push(`  image?: string;`);
  lines.push(`  images?: string[];`);
  lines.push(`};`);
  lines.push(``);
  lines.push(`export const products: Product[] = ${JSON.stringify(products, null, 2)};`);
  lines.push(``);
  return lines.join("\n");
}

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return { ok: false, res: json({ error: "Unauthorized" }, 401) };

  const user = await currentUser();
  if (!user) return { ok: false, res: json({ error: "Unauthorized" }, 401) };

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const primaryEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    "";
  const userEmail = primaryEmail.trim().toLowerCase();

  if (!adminEmail || userEmail !== adminEmail) return { ok: false, res: json({ error: "Forbidden" }, 403) };
  return { ok: true as const };
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.res;

    const { id } = await ctx.params;

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const productsFilePath = process.env.PRODUCTS_FILE_PATH;

    if (!owner || !repo || !productsFilePath) {
      return json({ error: "Missing env: GITHUB_OWNER, GITHUB_REPO, PRODUCTS_FILE_PATH" }, 500);
    }

    const form = await req.formData();

    const name = String(form.get("name") || "").trim();
    const slugRaw = String(form.get("slug") || "").trim();
    const categoryRaw = String(form.get("category") || "").trim();
    const subCategoryRaw = String(form.get("subCategory") || "").trim();
    const priceUSDStr = String(form.get("priceUSD") || "").trim();
    const description = String(form.get("description") || "").trim();

    const isNew = String(form.get("isNew") || "false") === "true";
    const featured = String(form.get("featured") || "false") === "true";

    const files = form.getAll("images") as File[]; // optional

    if (!name || !categoryRaw || !subCategoryRaw || !priceUSDStr || !description) {
      return json({ error: "Missing required fields" }, 400);
    }

    const priceUSD = Number(priceUSDStr);
    if (!Number.isFinite(priceUSD)) return json({ error: "priceUSD must be a number" }, 400);

    const slug = normalizeSlug(slugRaw || name);
    const category = slugifyFolder(categoryRaw);
    const subCategory = slugifyFolder(subCategoryRaw);

    // read products from GitHub
    const { sha: productsSha, text: productsText } = await getFile(owner, repo, productsFilePath, branch);
    const products = parseProducts(productsText);

    const idx = products.findIndex((p: any) => p?.id === id);
    if (idx === -1) return json({ error: `Product not found: ${id}` }, 404);

    const old = products[idx];
    const oldImages: string[] = Array.isArray(old?.images) ? old.images : (old?.image ? [old.image] : []);

    // If new images uploaded: upload new, update images array, and delete old image files
    let newImages: string[] | undefined = undefined;

    if (files && files.length > 0) {
      const uploaded: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = guessExt(file.name, file.type);
        const n = i + 1;

        const imageRepoPath = `public/products/${category}/${subCategory}/${slug}-${n}.${ext}`;
        const imagePublicPath = `/products/${category}/${subCategory}/${slug}-${n}.${ext}`;

        const imgB64 = Buffer.from(await file.arrayBuffer()).toString("base64");
        const existingSha = await tryGetSha(owner, repo, imageRepoPath, branch);

        await putFile({
          owner,
          repo,
          path: imageRepoPath,
          branch,
          message: `Update product image ${n}: ${category}/${subCategory}/${slug}`,
          contentBase64: imgB64,
          sha: existingSha,
        });

        uploaded.push(imagePublicPath);
      }

      newImages = uploaded;

      // delete old images referenced (best-effort)
      for (const pubPath of oldImages) {
        const repoPath = `public${pubPath}`.replace(/^public\/public\//, "public/");
        const sha = await tryGetSha(owner, repo, repoPath, branch);
        if (!sha) continue;
        try {
          await deleteFile({
            owner,
            repo,
            path: repoPath,
            branch,
            message: `Delete old product image: ${id}`,
            sha,
          });
        } catch {
          // ignore delete failures
        }
      }
    }

    products[idx] = {
      ...old,
      id,
      name,
      slug,
      category,
      subCategory,
      priceUSD,
      description,
      isNew,
      featured,
      ...(newImages ? { images: newImages } : {}),
    };

    const updatedText = renderProductsTs(products);
    const updatedB64 = Buffer.from(updatedText, "utf8").toString("base64");

    await putFile({
      owner,
      repo,
      path: productsFilePath,
      branch,
      message: `Edit product: ${id}`,
      contentBase64: updatedB64,
      sha: productsSha,
    });

    return json({ ok: true, product: products[idx] });
  } catch (e: any) {
    return json({ error: e?.message || "Unknown error" }, 500);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.res;

    const { id } = await ctx.params;

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const productsFilePath = process.env.PRODUCTS_FILE_PATH;

    if (!owner || !repo || !productsFilePath) {
      return json({ error: "Missing env: GITHUB_OWNER, GITHUB_REPO, PRODUCTS_FILE_PATH" }, 500);
    }

    const { sha: productsSha, text: productsText } = await getFile(owner, repo, productsFilePath, branch);
    const products = parseProducts(productsText);

    const idx = products.findIndex((p: any) => p?.id === id);
    if (idx === -1) return json({ error: `Product not found: ${id}` }, 404);

    const product = products[idx];
    const images: string[] = Array.isArray(product?.images) ? product.images : (product?.image ? [product.image] : []);

    // remove product
    products.splice(idx, 1);

    // write updated products.ts
    const updatedText = renderProductsTs(products);
    const updatedB64 = Buffer.from(updatedText, "utf8").toString("base64");

    await putFile({
      owner,
      repo,
      path: productsFilePath,
      branch,
      message: `Delete product: ${id}`,
      contentBase64: updatedB64,
      sha: productsSha,
    });

    // delete images (best-effort)
    for (const pubPath of images) {
      const repoPath = `public${pubPath}`.replace(/^public\/public\//, "public/");
      const sha = await tryGetSha(owner, repo, repoPath, branch);
      if (!sha) continue;
      try {
        await deleteFile({
          owner,
          repo,
          path: repoPath,
          branch,
          message: `Delete product image: ${id}`,
          sha,
        });
      } catch {
        // ignore
      }
    }

    return json({ ok: true });
  } catch (e: any) {
    return json({ error: e?.message || "Unknown error" }, 500);
  }
}
