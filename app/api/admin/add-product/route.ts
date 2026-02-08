// app/api/admin/add-product/route.ts
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

function json(res: any, status = 200) {
  return NextResponse.json(res, { status });
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

function isGlbFile(file: File) {
  const name = file.name.toLowerCase();
  const mime = (file.type || "").toLowerCase();
  return name.endsWith(".glb") || mime === "model/gltf-binary" || mime === "application/octet-stream";
}

function safeModelBaseName(slug: string, fallback: string) {
  const normalized = slugifyFolder(slug);
  if (normalized) return normalized;
  const fb = slugifyFolder(fallback);
  return fb || "model";
}

// GitHub contents API: encode each segment, keep slashes
function encodeRepoPath(p: string) {
  return p.split("/").map(encodeURIComponent).join("/");
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
  const idx = fileText.lastIndexOf("];");
  if (idx === -1) throw new Error("Could not find array end '];' in products.ts");

  const before = fileText.slice(0, idx).trimEnd();
  const after = fileText.slice(idx);

  const needsComma = !before.endsWith("[") && !before.endsWith(",");

  const insertion = `\n${needsComma ? "," : ""}\n${productObjLiteral}\n`;
  return before + insertion + after;
}

export async function POST(req: Request) {
  try {
    // auth
    const { userId } = await auth();
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const user = await currentUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const primaryEmail =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
      user.emailAddresses[0]?.emailAddress ||
      "";
    const userEmail = primaryEmail.trim().toLowerCase();

    if (!adminEmail || userEmail !== adminEmail) return json({ error: "Forbidden" }, 403);

    // repo config
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const productsFilePath = process.env.PRODUCTS_FILE_PATH; // app/data/products.ts

    if (!owner || !repo || !productsFilePath) {
      return json(
        { error: "Missing env: GITHUB_OWNER, GITHUB_REPO, PRODUCTS_FILE_PATH" },
        500
      );
    }

    // read form
    const form = await req.formData();

    const id = String(form.get("id") || "").trim();
    const name = String(form.get("name") || "").trim();
    const slugRaw = String(form.get("slug") || name || "");
    const slug = normalizeSlug(slugRaw);
    const modelBase = safeModelBaseName(slug, id);

    const categoryRaw = String(form.get("category") || "").trim();
    const subCategoryRaw = String(form.get("subCategory") || "").trim();

    // folder-safe
    const category = slugifyFolder(categoryRaw);
    const subCategory = slugifyFolder(subCategoryRaw);

    const priceUSDStr = String(form.get("priceUSD") || "").trim();
    const description = String(form.get("description") || "").trim();

    // MULTI
    const files = form.getAll("images") as File[];
    const model = form.get("model");
    const modelFile = model instanceof File && model.size > 0 ? model : null;

    if (!id || !name || !slug || !category || !subCategory || !priceUSDStr || !description) {
      return json(
        { error: "Missing: id, name, category, subCategory, priceUSD, description" },
        400
      );
    }
    if (!files || files.length === 0) {
      return json({ error: "Missing: images" }, 400);
    }
    if (modelFile && !isGlbFile(modelFile)) {
      return json({ error: "3D model must be a .glb file" }, 400);
    }

    const priceUSD = Number(priceUSDStr);
    if (!Number.isFinite(priceUSD)) {
      return json({ error: "priceUSD must be a number" }, 400);
    }

    // 1) upload images to: public/products/<category>/<subCategory>/<slug>-N.<ext>
    const publicPaths: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = guessExt(file.name, file.type);
      const n = i + 1;

      // ✅ slug-number naming (example: keychain-brabus-2.webp)
      const imageRepoPath = `public/products/${category}/${subCategory}/${slug}-${n}.${ext}`;
      const imagePublicPath = `/products/${category}/${subCategory}/${slug}-${n}.${ext}`;

      const imgB64 = Buffer.from(await file.arrayBuffer()).toString("base64");
      const existingSha = await tryGetSha(owner, repo, imageRepoPath, branch);

      await putFile({
        owner,
        repo,
        path: imageRepoPath,
        branch,
        message: `Add product image ${n}: ${category}/${subCategory}/${slug}`,
        contentBase64: imgB64,
        sha: existingSha,
      });

      publicPaths.push(imagePublicPath);
    }

    let modelUrl: string | undefined;
    if (modelFile) {
      const modelRepoPath = `public/models/${category}/${subCategory}/${modelBase}.glb`;
      modelUrl = `/models/${category}/${subCategory}/${modelBase}.glb`;
      const modelB64 = Buffer.from(await modelFile.arrayBuffer()).toString("base64");
      const existingSha = await tryGetSha(owner, repo, modelRepoPath, branch);
      await putFile({
        owner,
        repo,
        path: modelRepoPath,
        branch,
        message: `Add product model: ${category}/${subCategory}/${slug}`,
        contentBase64: modelB64,
        sha: existingSha,
      });
    }

    // 2) append to products.ts
    const { sha: productsSha, text: productsText } = await getFile(
      owner,
      repo,
      productsFilePath,
      branch
    );

    const imagesArrayLiteral = publicPaths.map((p) => JSON.stringify(p)).join(", ");

    const customizeColorsLiteral = modelUrl
      ? `
  customizeColors: {
    modelUrl: ${JSON.stringify(modelUrl)},
    defaultHexes: ["#ffffff"]
  },`
      : "";

    const productLiteral = `{
  id: ${JSON.stringify(id)},
  name: ${JSON.stringify(name)},
  slug: ${JSON.stringify(slug)},
  category: ${JSON.stringify(category)},
  subCategory: ${JSON.stringify(subCategory)},
  priceUSD: ${priceUSD},
  description: ${JSON.stringify(description)},
  images: [${imagesArrayLiteral}],
${customizeColorsLiteral}
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
      message: `Add product: ${category}/${subCategory}/${slug}`,
      contentBase64: updatedB64,
      sha: productsSha,
    });

    return json({
      ok: true,
      product: { id, name, slug, category, subCategory, images: publicPaths, modelUrl },
    });
  } catch (e: any) {
    return json({ error: e?.message || "Unknown error" }, 500);
  }
}
