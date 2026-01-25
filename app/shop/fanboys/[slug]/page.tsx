import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Background from "../../../components/Background";
import { products } from "../../../data/products";
import ProductGallery from "../../../components/ProductGallery";
import RecommendedRow from "../../../components/RecommendedRow";
import ShareButton from "../../../components/ShareButton";

const SITE = "https://creative-dimensions.vercel.app";

function normalize(s: string) {
  return decodeURIComponent(s).trim().toLowerCase();
}

function getImages(p: any) {
  if (Array.isArray(p.images) && p.images.length) return p.images;
  if (typeof p.image === "string" && p.image) return [p.image];
  if (p?.category && p?.slug) return [`/products/${p.category}/${p.slug}-1.jpg`];
  return ["/products/placeholder.jpg"];
}

function getCardImage(p: any) {
  if (Array.isArray(p.images) && p.images.length) return p.images[0];
  if (typeof p.image === "string" && p.image) return p.image;
  if (p?.category && p?.slug) return `/products/${p.category}/${p.slug}-1.jpg`;
  return "/products/placeholder.jpg";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = normalize(rawSlug);

  const p = products.find(
    (x: any) => x.category === "fanboys" && normalize(String(x.slug)) === slug
  );

  if (!p) {
    return {
      title: "Product not found",
      robots: { index: false, follow: false },
    };
  }

  const imgs = getImages(p);
  const first = imgs[0] || "/products/placeholder.jpg";
  const ogImage = String(first).startsWith("http") ? String(first) : `${SITE}${first}`;

  const title = `${p.name} | Creative Dimensions`;
  const desc =
    typeof p.description === "string" && p.description.trim()
      ? p.description.trim().slice(0, 200)
      : "Custom 3D printed item in Lebanon.";

  const url = `${SITE}/shop/fanboys/${encodeURIComponent(p.slug)}`;

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: "Creative Dimensions",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: p.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [ogImage],
    },
  };
}

export default async function FanboySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = normalize(rawSlug);

  const p = products.find(
    (x: any) => x.category === "fanboys" && normalize(String(x.slug)) === slug
  );

  if (!p) {
    return (
      <div className="relative min-h-screen">
        <Background />
        <Navbar />

        <main className="relative z-10 mx-auto max-w-3xl px-6 pt-28 pb-16 text-white">
          <Link
            href="/shop/fanboys"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition"
          >
            <span className="text-lg leading-none">←</span>
            Back to Fanboys
          </Link>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-6">
            Not found.
          </div>
        </main>
      </div>
    );
  }

  const imgs = getImages(p);

  // ✅ Recommended logic (final):
  // - default show 4
  // - show >4 ONLY if there are 4+ in same subCategory (excluding current)
  const TOTAL = 4;
  const currentSub = (p as any).subCategory;

  const sameSub: any[] = currentSub
    ? products.filter(
        (x: any) =>
          x.category === p.category &&
          x.slug !== p.slug &&
          x.subCategory === currentSub
      )
    : [];

  let similar: any[] = [];

  if (sameSub.length > 3) {
    similar = sameSub;
  } else {
    similar = sameSub.slice(0, TOTAL);

    if (similar.length < TOTAL) {
      const needed = TOTAL - similar.length;

      const fillers = products.filter(
        (x: any) =>
          x.category === p.category &&
          x.slug !== p.slug &&
          !similar.some((s: any) => (s.id && x.id && s.id === x.id) || s.slug === x.slug)
      );

      similar = [...similar, ...fillers.slice(0, needed)];
    }
  }

  const recommendedItems = similar.map((x: any) => ({
    id: x.id,
    slug: x.slug,
    name: x.name,
    image: getCardImage(x),
  }));

  const productUrl = `${SITE}/shop/fanboys/${encodeURIComponent(p.slug)}`;
  const waText = `Hey! I’m interested in: ${p.name} — ${productUrl}`;

  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-24 pb-16">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/shop/fanboys"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition"
          >
            <span className="text-lg leading-none">←</span>
            Back to Fanboys
          </Link>

          {p.isNew && (
            <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white/80 text-sm">
              New ✨
            </div>
          )}
        </div>

        {/* =========================
            MOBILE LAYOUT (<lg)
           ========================= */}
        <div className="mt-6 space-y-5 lg:hidden">
          <ProductGallery images={imgs} name={p.name} />

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-6">
            <div className="text-white/70 text-sm capitalize">{p.category}</div>

            <h1 className="mt-2 text-3xl font-semibold text-white leading-tight">
              {p.name}
            </h1>

            <div className="mt-4 text-white/75 whitespace-pre-line leading-relaxed">
              {p.description}
            </div>

            <div className="mt-6 flex items-end justify-between gap-4">
              <div className="text-white font-semibold text-2xl">
                {p.priceUSD ? `$${p.priceUSD}` : ""}
              </div>
              <div className="text-white/60 text-sm">Lebanon delivery / pickup</div>
            </div>

            <div className="mt-6 grid gap-3">
              <a
                href={`https://wa.me/96170304007?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center text-white/90 hover:bg-white/15 transition"
              >
                Order / Ask
              </a>

              <ShareButton
                url={productUrl}
                title={p.name}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white/80 hover:bg-white/10 transition"
              />

              <Link
                href="/shop/fanboys"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white/80 hover:bg-white/10 transition"
              >
                More Fanboys
              </Link>
            </div>

            {recommendedItems.length > 0 && <RecommendedRow items={recommendedItems} />}
          </div>
        </div>

        {/* =========================
            DESKTOP LAYOUT (lg+)
           ========================= */}
        <div className="mt-6 hidden lg:grid gap-5 lg:grid-cols-2 lg:items-stretch">
          <ProductGallery images={imgs} name={p.name} />

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-6 h-full flex flex-col">
            <div className="text-white/70 text-sm capitalize">{p.category}</div>

            <h1 className="mt-2 text-4xl sm:text-5xl font-semibold text-white leading-tight">
              {p.name}
            </h1>

            <div className="mt-4 text-white/75 whitespace-pre-line leading-relaxed">
              {p.description}
            </div>

            <div className="mt-6 flex items-end justify-between gap-4">
              <div className="text-white font-semibold text-2xl">
                {p.priceUSD ? `$${p.priceUSD}` : ""}
              </div>

              <div className="text-white/60 text-sm">Lebanon delivery / pickup</div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href={`https://wa.me/96170304007?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center text-white/90 hover:bg-white/15 transition"
              >
                Order / Ask
              </a>

              <ShareButton
                url={productUrl}
                title={p.name}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white/80 hover:bg-white/10 transition"
              />

              <Link
                href="/shop/fanboys"
                className="sm:col-span-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white/80 hover:bg-white/10 transition"
              >
                More Fanboys
              </Link>
            </div>

            {recommendedItems.length > 0 && <RecommendedRow items={recommendedItems} />}
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}
