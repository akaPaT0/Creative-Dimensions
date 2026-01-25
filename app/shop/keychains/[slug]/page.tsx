import Link from "next/link";
import Image from "next/image";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Background from "../../../components/Background";
import { products } from "../../../data/products";
import ProductGallery from "../../../components/ProductGallery";

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

const glassCard =
  "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150";

const pill =
  "inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-white/90 hover:bg-white/10 transition";

export default async function KeychainSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = normalize(params.slug);

  const p = products.find(
    (x) => x.category === "keychains" && normalize(String(x.slug)) === slug
  );

  if (!p) {
    return (
      <div className="relative min-h-screen">
        <Background />
        <Navbar />

        <main className="relative z-10 mx-auto max-w-3xl px-6 pt-28 pb-16 text-white">
          <Link href="/shop/keychains" className={pill}>
            <span className="text-lg leading-none">←</span>
            Back to Keychains
          </Link>

          <div className={`mt-6 ${glassCard} p-6`}>Not found.</div>
        </main>
      </div>
    );
  }

  const imgs = getImages(p);

  // ✅ Similar logic (exactly 3)
  const TOTAL = 3;
  const currentSub = (p as any).subCategory;

  const sameSub: any[] = currentSub
    ? products.filter(
        (x: any) =>
          x.category === p.category &&
          x.slug !== p.slug &&
          x.subCategory === currentSub
      )
    : [];

  let similar: any[] = sameSub.slice(0, TOTAL);

  if (similar.length < TOTAL) {
    const needed = TOTAL - similar.length;
    const fillers = products.filter(
      (x: any) =>
        x.category === p.category &&
        x.slug !== p.slug &&
        !similar.some((s: any) => s.id === x.id || s.slug === x.slug)
    );
    similar = [...similar, ...fillers.slice(0, needed)];
  }

  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-24 pb-16">
        {/* top row */}
        <div className="flex items-center justify-between gap-3">
          <Link href="/shop/keychains" className={pill}>
            <span className="text-lg leading-none">←</span>
            Back to Keychains
          </Link>

          {p.isNew && (
            <div className={`${pill} cursor-default hover:bg-white/5`}>
              New ✨
            </div>
          )}
        </div>

        {/* content */}
        <div className="mt-6 grid gap-5 lg:grid-cols-2 lg:items-stretch">
          {/* Gallery wrapper to match the right card */}
          <div className={`${glassCard} p-4 lg:sticky lg:top-24 h-fit`}>
            <ProductGallery images={imgs} name={p.name} />
          </div>

          {/* Details */}
          <div className={`${glassCard} p-6 flex flex-col`}>
            <div className="text-white/70 text-sm capitalize">{p.category}</div>

            <h1 className="mt-2 text-4xl sm:text-5xl font-semibold text-white leading-tight">
              {p.name}
            </h1>

            <div className="mt-4 text-white/75 whitespace-pre-line leading-relaxed">
              {p.description}
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="text-white font-semibold text-2xl">
                {p.priceUSD ? `$${p.priceUSD}` : ""}
              </div>
              <div className="text-white/60 text-sm text-right">
                Lebanon delivery / pickup
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href={`https://wa.me/96170304007?text=${encodeURIComponent(
                  `Hey! I’m interested in: ${p.name}.\n\nI can send a photo/file if needed.\nWhat details do you need, and what size do you recommend?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center text-white/90 hover:bg-white/15 transition"
              >
                Order / Ask
              </a>

              <Link
                href="/shop/keychains"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white/80 hover:bg-white/10 transition"
              >
                More Keychains
              </Link>
            </div>

            {/* Similar */}
            {similar.length > 0 && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-white/85 font-semibold">Check similar</div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  {similar.map((x: any) => {
                    const img = getCardImage(x);

                    return (
                      <Link
                        key={x.id ?? x.slug}
                        href={`/shop/keychains/${encodeURIComponent(x.slug)}`}
                        className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-2 flex flex-col"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                          <Image
                            src={img}
                            alt={x.name}
                            fill
                            className="object-cover"
                            sizes="140px"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        </div>

                        <div className="mt-2 text-center text-white/85 text-xs sm:text-sm font-semibold leading-tight line-clamp-1">
                          {x.name}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* keeps card bottom spacing consistent */}
            <div className="mt-auto" />
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}
