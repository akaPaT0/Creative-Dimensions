const FALLBACK_SITE_URL = "https://creativedimensionslb.com";

function normalizeSiteUrl(raw?: string) {
  const value = (raw || FALLBACK_SITE_URL).trim();
  try {
    return new URL(value).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

