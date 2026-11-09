import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { ChevronRight, Truck } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";
import ProductGallery from "../components/ProductGallery";
import FeaturedCarousel from "../components/FeaturedCarousel";
import ShareButton from "../components/ShareButton";
import LikeCartRow from "../components/LikeCartRow";
import ProductAddToCart from "../components/ProductAddToCart";
import { ProductSelectionProvider } from "../components/ProductSelection";
import VariantSwatches from "../components/VariantSwatches";
import TemphomeCustomRequestCta from "../components/TemphomeCustomRequestCta";
import ProductCustomizeColorsAction from "../components/ProductCustomizeColorsAction";
import type { Product } from "../data/products";
import { getProducts } from "../lib/products-db";
import { getProductPath } from "../lib/product-url";
import { SITE_URL } from "../lib/site";
import {
  buildProductMetadata,
  buildProductJsonLd,
  slugify,
  getProductImages,
} from "../lib/product-seo";
import { groupColours } from "../lib/product-variants";

/** Short labels used in the breadcrumb and above the product name. */
const CATEGORY_NAMES: Record<string, string> = {
  halloween: "Halloween",
  keychains: "Keychains",
  accessories: "Accessories",
  "desk-add-ons": "Desk Add-Ons",
  fanboys: "Fanboys",
  tools: "Tools",
};

const MORE_LIKE_THIS = 10;
const CUSTOMIZE_COLORS_ENABLED = process.env.NEXT_PUBLIC_CUSTOMIZE_COLORS === "1";

function findProduct(products: Product[], category: string, slug: string) {
  return products.find((x) => x.category === category && slugify(String(x.slug)) === slug);
}

export async function productStaticParams(category: string) {
  const products = await getProducts();
  return products
    .filter((x) => x.category === category && x.slug)
    .map((x) => ({ slug: slugify(String(x.slug)) }));
}

export async function productMetadata(
  category: string,
  params: Promise<{ slug: string }>
): Promise<Metadata> {
  const { slug } = await params;
  const p = findProduct(await getProducts(), category, slugify(slug));
  if (!p) {
    return {
      title: "Product Not Found | Creative Dimensions",
      robots: { index: false, follow: false },
    };
  }
  return buildProductMetadata(p, category);
}

function pickSimilar(products: Product[], p: Product) {
  const others = products.filter((x) => x.category === p.category && x.slug !== p.slug);
  const sameSub = p.subCategory ? others.filter((x) => x.subCategory === p.subCategory) : [];
  const rest = others.filter((x) => !sameSub.includes(x));
  return [...sameSub, ...rest].slice(0, MORE_LIKE_THIS);
}

function Breadcrumb({ category, name }: { category: string; name?: string }) {
  const categoryName = CATEGORY_NAMES[category] ?? category;
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-xs sm:text-sm text-white/45">
      <Link href="/shop" className="shrink-0 hover:text-white transition-colors">
        Shop
      </Link>
      <ChevronRight size={14} className="shrink-0" aria-hidden="true" />
      {name ? (
        <>
          <Link href={`/shop/${category}`} className="shrink-0 hover:text-white transition-colors">
            {categoryName}
          </Link>
          <ChevronRight size={14} className="shrink-0" aria-hidden="true" />
          <span className="truncate text-white/75" aria-current="page">
            {name}
          </span>
        </>
      ) : (
        <span className="text-white/75" aria-current="page">
          {categoryName}
        </span>
      )}
    </nav>
  );
}

export default async function ProductPage({
  category,
  params,
}: {
  category: string;
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const products = await getProducts();
  const p = findProduct(products, category, slugify(rawSlug));

  const shell = (children: React.ReactNode) => (
    <div className="relative min-h-screen text-white">
      <Background />
      <Navbar />
      <main className="relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 xl:px-14 pt-28 sm:pt-32 pb-16">
        {children}
        <div className="mt-14">
          <Footer />
        </div>
      </main>
    </div>
  );

  if (!p) {
    return shell(
      <>
        <Breadcrumb category={category} />
        <div className="mt-6 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
          <p className="text-lg font-semibold">We couldn&rsquo;t find that product.</p>
          <p className="mt-1 text-sm text-white/55">It may have been renamed or removed.</p>
          <Link
            href={`/shop/${category}`}
            className="mt-5 inline-flex rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold hover:bg-white/10 transition"
          >
            Browse {CATEGORY_NAMES[category] ?? "the shop"}
          </Link>
        </div>
      </>
    );
  }

  if (rawSlug !== slugify(p.slug)) permanentRedirect(getProductPath(p));

  const images = getProductImages(p);
  const productUrl = `${SITE_URL}${getProductPath(p)}`;
  const { productSchema, breadcrumbSchema } = buildProductJsonLd(p, category);
  const similar = pickSimilar(products, p);
  const canCustomizeColors = CUSTOMIZE_COLORS_ENABLED && !!p.customizeColors;
  const categoryName = CATEGORY_NAMES[category] ?? category;

  return shell(
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Breadcrumb category={category} name={p.name} />

      <ProductSelectionProvider images={images} variants={groupColours(p.variants ?? [], images)}>
      <div className="mt-4 sm:mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10">
        <div className="min-w-0">
          <ProductGallery images={images} name={p.name} />
        </div>

        <div className="min-w-0 lg:py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/45">
              {categoryName}
            </span>
            {p.isNew && (
              <span className="rounded-full bg-[#FF8B64] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0D0D0D]">
                New
              </span>
            )}
          </div>

          <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1]">
            {p.name}
          </h1>

          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="text-3xl font-bold text-[#FF8B64]">
              {typeof p.priceUSD === "number" ? `$${p.priceUSD}` : "Ask for price"}
            </span>
            <div className="flex items-center gap-2">
              <LikeCartRow productId={String(p.id)} />
              <ShareButton
                url={productUrl}
                title={p.name}
                iconOnly
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/85 hover:bg-white/10 hover:border-white/25 transition"
              />
            </div>
          </div>

          <VariantSwatches />

          {p.description && (
            <p className="mt-5 whitespace-pre-line text-sm sm:text-base leading-relaxed text-white/70">
              {p.description}
            </p>
          )}

          <div className="mt-7 grid gap-3">
            <ProductAddToCart
              productId={String(p.id)}
              className="w-full rounded-2xl bg-[#FF8B64] px-6 py-3.5 text-center text-sm sm:text-base font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition shadow-lg active:scale-[0.99]"
            />
            {canCustomizeColors && (
              <ProductCustomizeColorsAction
                product={p}
                className="w-full rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-3.5 text-center text-sm sm:text-base font-semibold text-white hover:bg-white/10 transition"
              />
            )}
            <TemphomeCustomRequestCta
              productName={p.name}
              productUrl={productUrl}
              buttonLabel="Want it custom? Get a quote"
              className="w-full rounded-2xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-center text-sm sm:text-base font-semibold text-white/90 hover:bg-white/10 hover:border-white/25 transition"
            />
          </div>

          <p className="mt-4 flex items-center gap-2 text-sm text-white/55">
            <Truck size={16} className="text-[#FF8B64]" aria-hidden="true" />
            Delivery across Lebanon or pickup
          </p>
        </div>
      </div>
      </ProductSelectionProvider>

      {similar.length > 0 && (
        <section className="mt-14 sm:mt-20">
          <FeaturedCarousel
            header={
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">More like this</h2>
                <Link
                  href={`/shop/${category}`}
                  className="shrink-0 text-xs sm:text-sm font-semibold text-[#FF8B64] hover:text-[#ffa282] transition-colors md:mr-2"
                >
                  All {categoryName} →
                </Link>
              </div>
            }
            items={similar.map((x) => {
              const imgs = getProductImages(x);
              return {
                key: `similar-${x.id}`,
                id: String(x.id),
                href: getProductPath(x),
                title: x.name,
                price: typeof x.priceUSD === "number" ? `$${x.priceUSD}` : "DM",
                category: "",
                image: imgs[0] || "/products/placeholder.jpg",
                hoverImage: imgs[1],
                isNew: x.isNew === true,
                hasVariants: !!x.variants?.length,
              };
            })}
          />
        </section>
      )}
    </>
  );
}
