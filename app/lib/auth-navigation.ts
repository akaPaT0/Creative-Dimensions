export const PRODUCTION_AUTH_ORIGIN = "https://www.creativedimensionslb.com";

// Never let callback parameters redirect a signed-in user to another website.
export function getAuthReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(decoded)) return "/";
    const url = new URL(value, PRODUCTION_AUTH_ORIGIN);
    if (url.origin !== PRODUCTION_AUTH_ORIGIN || /^\/(?:auth|api)(?:\/|$)/.test(url.pathname)) {
      return "/";
    }
    return url.pathname + url.search;
  } catch {
    return "/";
  }
}

export function getAuthOrigin(
  requestUrl: string,
  nodeEnv = process.env.NODE_ENV,
  vercelEnv = process.env.VERCEL_ENV,
): string {
  const url = new URL(requestUrl);
  if (nodeEnv === "development" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    return url.origin;
  }
  if (vercelEnv === "preview" && url.protocol === "https:" && url.hostname.endsWith(".vercel.app")) {
    return url.origin;
  }
  return PRODUCTION_AUTH_ORIGIN;
}
