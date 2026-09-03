import type { Metadata } from "next";
import type { Product } from "@/app/data/products";
import { SITE_URL } from "@/app/lib/site";

export function slugify(s: string) {
  try {
    return decodeURIComponent(s).trim().toLowerCase().replace(/[\s_]+/g, "-");
  } catch {
    return s.trim().toLowerCase().replace(/[\s_]+/g, "-");
  }
}

export const CATEGORY_LABELS: Record<string, string> = {
  keychains: "Keychains",
  "desk-add-ons": "Desk Add-ons",
  accessories: "Everyday Accessories",
  fanboys: "Collectibles & Fan Prints",
  "new-arrivals": "New Arrivals",
  tools: "Tools & Utilities",
};

export function getProductImages(p: Product): string[] {
  if (Array.isArray(p.images) && p.images.length) return p.images;
  if (typeof p.image === "string" && p.image) return [p.image];
  if (p.category && p.slug) return [`/products/${p.category}/${slugify(p.slug)}-1.jpg`];
  return ["/products/placeholder.jpg"];
}

export function buildProductMetadata(p: Product, category: string): Metadata {
  const categoryLabel = CATEGORY_LABELS[category] || "3D Prints";
  const title = `${p.name} | 3D Printed ${categoryLabel} | Creative Dimensions Lebanon`;
  const customDesc =
    typeof p.description === "string" && p.description.trim() ? p.description.trim() : "";
  const desc = customDesc
    ? `${customDesc.slice(0, 155)}${customDesc.length > 155 ? "..." : ""} - 3D printed on demand in Lebanon.`
    : `Buy ${p.name} - premium precision 3D printed ${categoryLabel.toLowerCase()} by Creative Dimensions in Lebanon. Made to order with high-end finishes and fast delivery nationwide.`;
  const cleanSlug = slugify(p.slug);
  const url = `${SITE_URL}/shop/${category}/${encodeURIComponent(cleanSlug)}`;
  const images = getProductImages(p).map((img) =>
    String(img).startsWith("http") ? String(img) : `${SITE_URL}${img}`
  );

  return {
    title,
    description: desc,
    keywords: [
      p.name,
      `${p.name} 3D print`,
      `${categoryLabel} Lebanon`,
      "3D printing Lebanon",
      "Creative Dimensions",
      "custom 3D prints",
      "buy 3D printed products Lebanon",
      "3D printed gifts Lebanon",
    ],
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: "Creative Dimensions",
      type: "website",
      images: images.map((imgUrl) => ({
        url: imgUrl,
        width: 1200,
        height: 630,
        alt: `${p.name} 3D Printed in Lebanon`,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [images[0] || `${SITE_URL}/products/placeholder.jpg`],
    },
  };
}

export function buildProductJsonLd(p: Product, category: string) {
  const categoryLabel = CATEGORY_LABELS[category] || "3D Prints";
  const cleanSlug = slugify(p.slug);
  const productUrl = `${SITE_URL}/shop/${category}/${encodeURIComponent(cleanSlug)}`;
  const productImages = getProductImages(p).map((img) =>
    String(img).startsWith("http") ? String(img) : `${SITE_URL}${img}`
  );
  const hasPrice = typeof p.priceUSD === "number" && Number.isFinite(p.priceUSD);
  const priceValue = hasPrice ? Number(p.priceUSD).toFixed(2) : "0.00";

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description || `${p.name} 3D printed with premium quality in Lebanon.`,
    image: productImages,
    sku: p.id || cleanSlug,
    mpn: p.id || cleanSlug,
    category: categoryLabel,
    brand: {
      "@type": "Brand",
      name: "Creative Dimensions",
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "USD",
      price: priceValue,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Creative Dimensions",
        url: SITE_URL,
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "LB",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "3.00",
          currency: "USD",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "LB",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          businessDays: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: [
              "https://schema.org/Monday",
              "https://schema.org/Tuesday",
              "https://schema.org/Wednesday",
              "https://schema.org/Thursday",
              "https://schema.org/Friday",
              "https://schema.org/Saturday",
            ],
          },
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "DAY",
          },
        },
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: `${SITE_URL}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryLabel,
        item: `${SITE_URL}/shop/${category}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: p.name,
        item: productUrl,
      },
    ],
  };

  return { productSchema, breadcrumbSchema };
}
