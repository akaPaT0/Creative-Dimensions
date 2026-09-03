import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Background from "../../../components/Background";
import type { Product } from "../../../data/products";
import { getProducts } from "../../../lib/products-db";
import ProductGallery from "../../../components/ProductGallery";
import RecommendedRow from "../../../components/RecommendedRow";
import ShareButton from "../../../components/ShareButton";
import CustomRequestModal from "../../../components/CustomRequestModal";
import LikeWishlistRow from "../../../components/LikeWishlistRow";
import AddToCartButton from "../../../components/AddToCartButton";
import ProductCustomizeColorsAction from "../../../components/ProductCustomizeColorsAction";
import { SITE_URL } from "../../../lib/site";
import {
  buildProductMetadata,
  buildProductJsonLd,
  slugify,
  getProductImages,
} from "@/app/lib/product-seo";

export const revalidate = 300;

function getImages(p: Product) {
  return getProductImages(p);
}

function getCardImage(p: Product) {
  const imgs = getProductImages(p);
  return imgs[0] || "/products/placeholder.jpg";
}

async function getProduct(slug: string) {
  const products = await getProducts();
  return products.find(
    (x) => x.category === "keychains" && slugify(String(x.slug)) === slug
  );
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products
    .filter((x) => x.category === "keychains" && x.slug)
    .map((x) => ({ slug: slugify(String(x.slug)) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const p = await getProduct(slugify(rawSlug));

  if (!p) {
    return {
      title: "Product Not Found | Creative Dimensions",
      robots: { index: false, follow: false },
    };
  }

  return buildProductMetadata(p, "keychains");
}

export default async function KeychainSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const products = await getProducts();
  const p = products.find(
    (x) => x.category === "keychains" && slugify(String(x.slug)) === slugify(rawSlug)
  );

  if (!p) {
    return (
      <div className="relative min-h-screen">
        <Background />
        <Navbar />
        <main className="relative z-10 mx-auto max-w-[1480px] px-6 lg:px-8 pt-24 pb-16 text-white">
          <Link
            href="/shop/keychains"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition"
          >
            <ChevronLeft size={16} strokeWidth={2.25} />
            Back to Keychains
          </Link>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-6">
            Not found.
          </div>
        </main>
      </div>
    );
  }

  const imgs = getImages(p);
  const total = 4;
  const sameSub = p.subCategory
    ? products.filter(
        (x) =>
          x.category === p.category &&
          x.slug !== p.slug &&
          x.subCategory === p.subCategory
      )
    : [];

  const similar = sameSub.length > total - 1
    ? sameSub
    : [
        ...sameSub.slice(0, total),
        ...products
          .filter(
            (x) =>
              x.category === p.category &&
              x.slug !== p.slug &&
              !sameSub.some((s) => s.id === x.id)
          )
          .slice(0, Math.max(0, total - sameSub.length)),
      ];

  const recommendedItems = similar.map((x) => ({
    id: x.id,
    slug: x.slug,
    name: x.name,
    image: getCardImage(x),
  }));

  const cleanSlug = slugify(p.slug);
  const productUrl = `${SITE_URL}/shop/keychains/${encodeURIComponent(cleanSlug)}`;
  const { productSchema, breadcrumbSchema } = buildProductJsonLd(p, "keychains");

  return (
    <div className="relative min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-[1480px] px-6 lg:px-8 pt-24 pb-16">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/shop/keychains"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition"
          >
            <ChevronLeft size={16} strokeWidth={2.25} />
            Back to Keychains
          </Link>

          {p.isNew && (
            <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white/80 text-sm">
              New
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:hidden">
          <ProductGallery images={imgs} name={p.name} />
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-6">
            <div className="text-white/70 text-sm capitalize">{p.category}</div>
            <h1 className="mt-2 text-3xl font-semibold text-white leading-tight">{p.name}</h1>
            <div className="mt-4 text-white/75 whitespace-pre-line leading-relaxed">{p.description}</div>
            <div className="mt-6 flex items-end justify-between gap-4">
              <div className="text-white font-semibold text-2xl">{p.priceUSD ? `$${p.priceUSD}` : ""}</div>
              <div className="flex flex-col items-end gap-2">
                <LikeWishlistRow productId={String(p.id)} className="!w-auto" />
                <div className="text-white/60 text-sm">Lebanon delivery / pickup</div>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              <AddToCartButton
                productId={String(p.id)}
                className="rounded-xl border border-white/15 bg-[#FF8B64] px-4 py-3 text-center font-medium text-black hover:opacity-90 transition"
              />
              <ProductCustomizeColorsAction
                product={p}
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center text-white/90 hover:bg-white/15 transition"
              />
              <ShareButton
                url={productUrl}
                title={p.name}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white/80 hover:bg-white/10 transition"
              />
              <CustomRequestModal
                productName={p.name}
                productUrl={productUrl}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white/80 hover:bg-white/10 transition"
              />
              <Link
                href="/shop/keychains"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white/80 hover:bg-white/10 transition"
              >
                More Keychains
              </Link>
            </div>
            {recommendedItems.length > 0 && (
              <div className="mt-6">
                <RecommendedRow items={recommendedItems} />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 hidden lg:grid gap-5 lg:grid-cols-2 lg:items-stretch">
          <div>
            <ProductGallery images={imgs} name={p.name} />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-6 h-full flex flex-col">
            <div className="text-white/70 text-sm capitalize">{p.category}</div>
            <h1 className="mt-2 text-4xl sm:text-5xl font-semibold text-white leading-tight">{p.name}</h1>
            <div className="mt-4 text-white/75 whitespace-pre-line leading-relaxed">{p.description}</div>

            <div className="mt-auto">
              <div className="mt-6 flex items-end justify-between gap-4">
                <div className="text-white font-semibold text-2xl">{p.priceUSD ? `$${p.priceUSD}` : ""}</div>
                <div className="flex flex-col items-end gap-2">
                  <LikeWishlistRow productId={String(p.id)} className="!w-auto" />
                  <div className="text-white/60 text-sm">Lebanon delivery / pickup</div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <AddToCartButton
                  productId={String(p.id)}
                  className="sm:col-span-2 rounded-xl border border-white/15 bg-[#FF8B64] px-4 py-3 text-center font-medium text-black hover:opacity-90 transition"
                />
                <ProductCustomizeColorsAction
                  product={p}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center text-white/90 hover:bg-white/15 transition"
                />

                <ShareButton
                  url={productUrl}
                  title={p.name}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white/80 hover:bg-white/10 transition"
                />

                <CustomRequestModal
                  productName={p.name}
                  productUrl={productUrl}
                  className="sm:col-span-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white/80 hover:bg-white/10 transition"
                />

                <Link
                  href="/shop/keychains"
                  className="sm:col-span-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white/80 hover:bg-white/10 transition"
                >
                  More Keychains
                </Link>
              </div>
            </div>
          </div>
        </div>

        {recommendedItems.length > 0 && (
          <div className="mt-5 hidden lg:block rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-6">
            <RecommendedRow items={recommendedItems} />
          </div>
        )}

        <Footer />
      </main>
    </div>
  );
}
