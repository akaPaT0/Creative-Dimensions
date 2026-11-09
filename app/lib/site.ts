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

// Default social share image (WhatsApp, Facebook, X, etc.), 1200x630.
export const DEFAULT_OG_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Creative Dimensions: custom 3D printing in Lebanon",
};

