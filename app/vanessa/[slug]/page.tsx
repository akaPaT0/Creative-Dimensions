import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Background from "../../components/Background";
import ProductGallery from "../../components/ProductGallery";
import ShareButton from "../../components/ShareButton";
import CustomRequestModal from "../../components/CustomRequestModal";
import { SITE_URL } from "../../lib/site";
import {
  getProducts,
  type VanessaProduct,
} from "../../lib/supabase/getProducts";

export const revalidate = 300;

function normalizeSlug(s: string) {
  try {
    return decodeURIComponent(s).trim().toLowerCase();
  } catch {
    return s.trim().toLowerCase();
  }
}

function getTitle(p: VanessaProduct) {
  return p.name || String(p.slug).replace(/-/g, " ");
}

function getDescription(p: VanessaProduct) {
  const desc = p.description?.trim();
  if (desc) return desc;
  return "Custom 3D print item.";
}

function getPriceLabel(p: VanessaProduct) {
  if (typeof p.priceUSD === "number" && Number.isFinite(p.priceUSD)) {
    return `$${p.priceUSD}`;
  }
  return "DM for price";
}

function getImages(p: VanessaProduct) {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images;
  return ["/products/placeholder.jpg"];
}

function getCardImage(p: VanessaProduct) {
  return getImages(p)[0] || "/products/placeholder.jpg";
}

function toAbsoluteAssetUrl(src: string) {
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return `${SITE_URL}${src}`;
  return `${SITE_URL}/${src.replace(/^\/+/, "")}`;
}

async function getProductBySlug(rawSlug: string) {
  const products = await getProducts();
  const targetSlug = normalizeSlug(rawSlug);
  const product =
    products.find((x) => normalizeSlug(String(x.slug)) === targetSlug) || null;

  return { product, products };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const { product } = await getProductBySlug(rawSlug);

  if (!product) {
    return {
      title: "Vanessa Product Not Found | Creative Dimensions",
      robots: { index: false, follow: false },
    };
  }

  const title = `${getTitle(product)} | Vanessa | Creative Dimensions`;
  const description = getDescription(product).slice(0, 200);
  const canonical = `${SITE_URL}/vanessa/${encodeURIComponent(product.slug)}`;
  const images = getImages(product).map((src) => ({
    url: toAbsoluteAssetUrl(String(src)),
    width: 1200,
    height: 630,
    alt: getTitle(product),
  }));

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Creative Dimensions",
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [images[0]?.url || `${SITE_URL}/products/placeholder.jpg`],
    },
  };
}

export default async function VanessaProductSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const { product: p, products } = await getProductBySlug(rawSlug);

  if (!p) {
    return (
      <div className="relative min-h-screen">
        <Background />
        <Navbar />
        <main className="relative z-10 mx-auto max-w-[1480px] px-6 lg:px-8 pt-24 pb-16 text-white">
          <Link
            href="/vanessa"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition"
          >
            <ChevronLeft size={16} strokeWidth={2.25} />
            Back to Vanessa
          </Link>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-6">
            Product not found.
          </div>
        </main>
      </div>
    );
  }

  const imgs = getImages(p);
  const productUrl = `${SITE_URL}/vanessa/${encodeURIComponent(p.slug)}`;
  const productImages = imgs.map((img) => toAbsoluteAssetUrl(String(img)));
  const hasPrice = typeof p.priceUSD === "number" && Number.isFinite(p.priceUSD);
  const related = products
    .filter(
      (x) =>
        normalizeSlug(String(x.slug)) !== normalizeSlug(String(p.slug)) &&
        x.category === p.category
    )
    .slice(0, 4);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: getTitle(p),
    description: getDescription(p),
    image: productImages,
    brand: {
      "@type": "Brand",
      name: "Creative Dimensions",
    },
    ...(hasPrice
      ? {
          offers: {
            "@type": "Offer",
            url: productUrl,
            priceCurrency: "USD",
            price: String(p.priceUSD),
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
          },
        }
      : {}),
  };

  return (
    <div className="relative min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-[1480px] px-6 lg:px-8 pt-24 pb-16">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/vanessa"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition"
          >
            <ChevronLeft size={16} strokeWidth={2.25} />
            Back to Vanessa
          </Link>

          {p.isNew && (
            <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white/80 text-sm">
              New
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2 lg:items-stretch">
          <div>
            <ProductGallery images={imgs} name={getTitle(p)} />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-6 h-full flex flex-col">
            <div className="text-white/70 text-sm capitalize">
              {p.category}
              {p.subCategory ? ` / ${p.subCategory}` : ""}
            </div>
            <h1 className="mt-2 text-4xl sm:text-5xl font-semibold text-white leading-tight">
              {getTitle(p)}
            </h1>
            <div className="mt-4 text-white/75 whitespace-pre-line leading-relaxed">
              {getDescription(p)}
            </div>

            <div className="mt-auto">
              <div className="mt-6 text-white font-semibold text-2xl">
                {getPriceLabel(p)}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <ShareButton
                  url={productUrl}
                  title={getTitle(p)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white/80 hover:bg-white/10 transition"
                />

                <CustomRequestModal
                  productName={getTitle(p)}
                  productUrl={productUrl}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white/80 hover:bg-white/10 transition"
                />

                <Link
                  href="/vanessa"
                  className="sm:col-span-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white/80 hover:bg-white/10 transition"
                >
                  More Vanessa Products
                </Link>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-6">
            <h2 className="text-white/90 text-lg font-semibold">
              Similar in {p.category}
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <Link
                  key={`${item.slug}-${item.SKU}`}
                  href={`/vanessa/${encodeURIComponent(item.slug)}`}
                  className="group rounded-2xl border border-white/10 bg-black/20 p-3 hover:bg-black/30 transition"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    <Image
                      src={getCardImage(item)}
                      alt={getTitle(item)}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  <div className="mt-3 text-white/90 text-sm font-medium line-clamp-2">
                    {getTitle(item)}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <Footer />
      </main>
    </div>
  );
}
