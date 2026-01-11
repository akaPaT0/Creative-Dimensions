import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import vm from "node:vm";

function json(res: any, status = 200) {
  return NextResponse.json(res, { status });
}

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

function extractProductsArrayLiteral(tsText: string) {
  const anchor = "export const products";
  const i = tsText.indexOf(anchor);
  if (i === -1) throw new Error("Could not find 'export const products' in products.ts");

  const startBracket = tsText.indexOf("[", i);
  if (startBracket === -1) throw new Error("Could not find products array '['");

  const end = tsText.indexOf("];", startBracket);
  if (end === -1) throw new Error("Could not find products array closing '];'");

  return tsText.slice(startBracket, end + 1); // includes final ']'
}

function parseProducts(tsText: string) {
  const arr = extractProductsArrayLiteral(tsText);
  const script = `module.exports = ${arr};`;
  const sandbox: any = { module: { exports: null } };
  vm.createContext(sandbox);
  vm.runInContext(script, sandbox, { timeout: 500 });
  if (!Array.isArray(sandbox.module.exports)) throw new Error("Parsed products is not an array");
  return sandbox.module.exports;
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

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.res;

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const productsFilePath = process.env.PRODUCTS_FILE_PATH;

    if (!owner || !repo || !productsFilePath) {
      return json({ error: "Missing env: GITHUB_OWNER, GITHUB_REPO, PRODUCTS_FILE_PATH" }, 500);
    }

    const { text } = await getFile(owner, repo, productsFilePath, branch);
    const products = parseProducts(text);

    return json({ ok: true, products });
  } catch (e: any) {
    return json({ error: e?.message || "Unknown error" }, 500);
  }
}
