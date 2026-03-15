import { NextRequest, NextResponse } from "next/server";

function extractMeta(content: string, property: string) {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const match = content.match(regex);
  return match?.[1] || null;
}

function extractTitle(content: string) {
  const match = content.match(/<title[^>]*>(.*?)<\/title>/i);
  return match?.[1]?.trim() || null;
}

function makeAbsoluteUrl(value: string | null, baseUrl: string) {
  if (!value) return null;

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 86400 },
    });

    const html = await response.text();

    const ogImage = makeAbsoluteUrl(extractMeta(html, "og:image"), url);
    const twitterImage = makeAbsoluteUrl(extractMeta(html, "twitter:image"), url);
    const ogTitle = extractMeta(html, "og:title");
    const ogDescription = extractMeta(html, "og:description");
    const title = ogTitle || extractTitle(html);

    let favicon: string | null = null;
    try {
      favicon = new URL("/favicon.ico", url).toString();
    } catch {}

    return NextResponse.json({
      title,
      description: ogDescription,
      image: ogImage || twitterImage || favicon,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch preview" },
      { status: 500 }
    );
  }
}