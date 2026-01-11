import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

function json(res: any, status = 200) {
  return NextResponse.json(res, { status });
}

function normalizeSlug(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, "-");
}

function guessExt(filename: string, mime: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png") || mime === "image/png") return "png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || mime === "image/jpeg") return "jpg";
  if (lower.endsWith(".webp") || mime === "image/webp") return "webp";
  return "webp";
}

// GitHub contents API: encode each segment, keep slashes
function encodeRepoPath(p: string) {
  return p.split("/").map(encodeURIComponent).join("/");
}

const allowedCategories = new Set([
  "new-arrivals",
  "keychains",
  "tools",
  "accessories",
  "fanboys",
]);

const allowedSubCategories = new Set([
  "cute",
  "minecraft",
  "cars",
  "anime",
  "tools",
  "other",
]);

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
    throw new Error(`GitHub API error ${r.status}: ${typeof data === "string" ? data : JSON.stringify(data)}`);
  }

  return data;
}

async function getFile(owner: string, repo: string, filePath: string, branch: string) {
  const encoded = encodeRepoPath(filePath);
  const data = await ghFetch(`/repos/${owner}/${repo}/contents/${encoded}?ref=${encodeURIComponent(branch)}`);

  const contentB64 = (data.content || "").replace(/\n/g, "");
  const buff = Buffer.from(contentB64, "base64");
  return { sha: data.sha as string, text: buff.toString("utf8") as string };
}

async function tryGetSha(owner: string, repo: string, filePath: string, branch: string) {
  try {
    const encoded = encodeRepoPath(filePath);
    const data = await ghFetch(`/repos/${owner}/${repo}/contents/${encoded}?ref=${encodeURIComponent(branch)}`);
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

  const body: any = {
    message: params.message,
    content: params.contentBase64,
    branch: params.branch,
  };
  if (params.sha) body.sha = params.sha;

  return ghFetch(`/repos/${params.owner}/${params.repo}/contents/${encoded}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

function appendProductToProductsTs(fileText: string, productObjLiteral: string) {
  // Your file ends with `];`
  const idx = fileText.lastIndexOf("];");
  if (idx === -1) throw new Error("Could not find array end '];' in products.ts");

  const before = fileText.slice(0, idx).trimEnd();
  const after = fileText.slice(idx);

  // If last non-space char before insert is "[" then no comma needed
  const needsComma = !before.endsWith("[") && !before.endsWith(",");

  const insertion = `\n${needsComma ? "," : ""}\n${productObjLiteral}\n`;
  return before + insertion + after;
}

export async function POST(req: Request) {
  try {
    // Signed in?
    const { userId } = await auth();
    if (!userId) return json({ error: "Unauthorized" }, 401);

    // Only admin email?
    const user = await currentUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const primaryEmail =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
      user.emailAddresses[0]?.emailAddress ||
      "";
    const userEmail = primaryEmail.trim().toLowerCase();

    if (!adminEmail || userEmail !== adminEmail) return json({ error: "Forbidden" }, 403);

    // Repo config
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const productsFilePath = process.env.PRODUCTS_FILE_PATH; // app/data/products.ts

    if (!owner || !repo || !productsFilePath) {
      return json({ error: "Missing env: GITHUB_OWNER, GITHUB_REPO, PRODUCTS_FILE_PATH" }, 500);
    }

    // Read form
    const form = await req.formData();

    const id = String(form.get("id") || "").trim();
    const name = String(form.get("name") || "").trim();
    const slugRaw = String(form.get("slug") || name || "");
    const slug = normalizeSlug(slugRaw);

    const category = String(form.get("category") || "").trim().toLowerCase();
    const subCategory = String(form.get("subCategory") || "").trim().toLowerCase();
    const priceUSDStr = String(form.get("priceUSD") || "").trim();
    const description = String(form.get("description") || "").trim();

    const file = form.get("image") as File | null;

    if (!id || !name || !slug || !category || !priceUSDStr || !description || !file) {
      return json({ error: "Missing: id, name, category, priceUSD, description, image" }, 400);
    }

    if (!allowedCategories.has(category)) {
      return json({ error: `Invalid category: ${category}` }, 400);
    }
    if (subCategory && !allowedSubCategories.has(subCategory)) {
      return json({ error: `Invalid subCategory: ${subCategory}` }, 400);
    }

    const priceUSD = Number(priceUSDStr);
    if (!Number.isFinite(priceUSD)) {
      return json({ error: "priceUSD must be a number" }, 400);
    }

    // Store new images in a clean convention:
    // public/products/<category>/<slug>-1.webp
    const ext = guessExt(file.name, file.type);
    const imageRepoPath = `public/products/${category}/${slug}-1.${ext}`;
    const imagePublicPath = `/products/${category}/${slug}-1.${ext}`;

    // 1) Upload/overwrite image
    const imgB64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const existingImageSha = await tryGetSha(owner, repo, imageRepoPath, branch);

    await putFile({
      owner,
      repo,
      path: imageRepoPath,
      branch,
      message: `Add product image: ${category}/${slug}`,
      contentBase64: imgB64,
      sha: existingImageSha,
    });

    // 2) Append to products.ts
    const { sha: productsSha, text: productsText } = await getFile(owner, repo, productsFilePath, branch);

    const productLiteral =
`{
  id: ${JSON.stringify(id)},
  name: ${JSON.stringify(name)},
  slug: ${JSON.stringify(slug)},
  category: ${JSON.stringify(category)},
${subCategory ? `  subCategory: ${JSON.stringify(subCategory)},\n` : ""}  priceUSD: ${priceUSD},
  description: ${JSON.stringify(description)},
  images: [${JSON.stringify(imagePublicPath)}],
  isNew: true,
  featured: false,
},`;

    const updatedProducts = appendProductToProductsTs(productsText, productLiteral);
    const updatedB64 = Buffer.from(updatedProducts, "utf8").toString("base64");

    await putFile({
      owner,
      repo,
      path: productsFilePath,
      branch,
      message: `Add product: ${category}/${slug}`,
      contentBase64: updatedB64,
      sha: productsSha,
    });

    return json({
      ok: true,
      product: { id, name, slug, category, image: imagePublicPath },
    });
  } catch (e: any) {
    return json({ error: e?.message || "Unknown error" }, 500);
  }
}
