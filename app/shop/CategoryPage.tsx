import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";
import CustomOrderBand from "../components/CustomOrderBand";
import type { Product } from "../data/products";
import { getProducts } from "../lib/products-db";
import { getProductPath } from "../lib/product-url";
import { SITE_URL } from "../lib/site";
import CategoryGrid, { type CategoryGridItem } from "./CategoryGrid";

const LABELS: Record<string, string> = {
  christmas: "Christmas",
  halloween: "Halloween",
  keychains: "Keychains",
  accessories: "Accessories",
  fanboys: "Fanboys",
  "desk-add-ons": "Desk Add-Ons",
  tools: "Tools",
};

function labelFor(value?: string) {
  if (!value) return "";
  if (LABELS[value]) return LABELS[value];
  const words = value.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function getCardImage(p: Product) {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.image === "string" && p.image) return p.image;
  if (p.category && p.slug) return `/products/${p.category}/${p.slug}-1.jpg`;
  return "/products/placeholder.jpg";
}

function getPriceLabel(p: Product) {
  return typeof p.priceUSD === "number" ? `$${p.priceUSD}` : "DM";
}

type Props = {
  title: string;
  intro: string;
  path: string;
  /** Which products to show. */
  select: (p: Product) => boolean;
  /** Name for the CollectionPage structured data; omit to skip it. */
  jsonLdName?: string;
  /** Group by category instead of subcategory (for cross-category pages). */
  labelByCategory?: boolean;
  emptyTitle?: string;
  emptyText?: string;
};

export default async function CategoryPage({
  title,
  intro,
  path,
  select,
  jsonLdName,
  labelByCategory = false,
  emptyTitle = "Coming soon",
  emptyText = "We’re still putting this section together.",
}: Props) {
  const products = await getProducts();
  const list = products.filter(select);

  const groupOf = (p: Product) => (labelByCategory ? p.category : p.subCategory || undefined);
  // A label that is the same on every card adds nothing.
  const showLabels = new Set(list.map(groupOf).filter(Boolean)).size > 1;

  const items: CategoryGridItem[] = list.map((p) => {
    const group = groupOf(p);
    return {
      id: String(p.id),
      href: getProductPath(p),
      title: p.name || "Product",
      price: getPriceLabel(p),
      label: showLabels ? labelFor(group) : undefined,
      image: getCardImage(p),
      hoverImage: Array.isArray(p.images) && p.images.length > 1 ? p.images[1] : undefined,
      isNew: labelByCategory ? false : p.isNew === true,
      hasVariants: !!p.variants?.length,
      group,
      groupLabel: labelFor(group),
    };
  });

  const collectionJsonLd = jsonLdName
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: jsonLdName,
        url: `${SITE_URL}${path}`,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: list
            .filter((p) => p.slug)
            .map((p, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: p.name,
              url: `${SITE_URL}${getProductPath(p)}`,
            })),
        },
      }
    : null;

  return (
    <div className="relative min-h-screen text-white">
      <Background />
      <Navbar />

      {collectionJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
        />
      )}

      <main className="relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 xl:px-14 pt-28 sm:pt-32 pb-16">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm text-white/45">
          <Link href="/shop" className="hover:text-white transition-colors">
            Shop
          </Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span className="text-white/75" aria-current="page">
            {title}
          </span>
        </nav>

        <header className="mt-3 sm:mt-4 mb-6 sm:mb-8 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm sm:text-base text-white/60">{intro}</p>
        </header>

        {items.length > 0 ? (
          <CategoryGrid items={items} />
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
            <p className="text-lg font-semibold text-white">{emptyTitle}</p>
            <p className="mt-1 text-sm text-white/55">{emptyText}</p>
            <Link
              href="/shop"
              className="mt-5 inline-flex rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Browse the shop
            </Link>
          </div>
        )}

        <CustomOrderBand
          className="mt-14 sm:mt-20"
          title={"Can’t find what you need?"}
          text={"Send us a photo, sketch or idea and we’ll make it. You see a preview and a price before we print."}
        />

        <div className="mt-14">
          <Footer />
        </div>
      </main>
    </div>
  );
}
