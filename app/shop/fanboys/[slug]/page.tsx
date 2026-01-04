import Link from "next/link";
import Image from "next/image";
import Navbar from "../../../components/Navbar";
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

  // ✅ Similar logic (fixed):
  // - If category has any subCategory items, don't recommend items without subCategory
  // - If same subCategory >= MIN_SUB => ONLY show sameSub (no fillers)
  const LIMIT = 8;
  const MIN_SUB = 3;

  const categoryItems = products.filter((x: any) => x.category === p.category);
  const hasAnySubCatsInCategory = categoryItems.some((x: any) => !!x.subCategory);

  const basePool = hasAnySubCatsInCategory
    ? categoryItems.filter((x: any) => !!x.subCategory)
    : categoryItems;

  const sameSub =
    (p as any).subCategory
      ? basePool.filter(
          (x: any) =>
            x.slug !== p.slug && x.subCategory === (p as any).subCategory
        )
      : [];

  let similar: any[] = sameSub;

  // Only fill if we DON'T have enough sameSub
  if (similar.length < MIN_SUB) {
    const keyOf = (x: any) => `${x.category}-${x.slug}-${x.id ?? "x"}`;
    const used = new Set(similar.map(keyOf));

    const fillers = basePool.filter((x: any) => {
      if (x.slug === p.slug) return false;
      const k = keyOf(x);
      if (used.has(k)) return false;
      return true;
    });

    similar = [...similar, ...fillers];
  }

  similar = similar.slice(0, LIMIT);

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

        <div className="mt-6 grid gap-5 lg:grid-cols-2 lg:items-start">
          {/* Gallery */}
          <ProductGallery images={imgs} name={p.name} />

          {/* Details */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-6">
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
                href="/shop/fanboys"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white/80 hover:bg-white/10 transition"
              >
                More Fanboys
              </Link>
            </div>

            {/* ✅ Check similar (single horizontal row scroll) */}
            {similar.length > 0 && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-white/85 font-semibold">Check similar</div>

                <div className="mt-3 -mx-2 px-2 overflow-x-auto">
                  <div className="flex gap-3 flex-nowrap snap-x snap-mandatory">
                    {similar.map((x: any) => {
                      const img = getCardImage(x);

                      return (
                        <Link
                          key={x.id ?? `${x.category}-${x.slug}`}
                          href={`/shop/fanboys/${encodeURIComponent(x.slug)}`}
                          className="
                            group shrink-0 snap-start
                            w-[110px] sm:w-[130px] md:w-[150px]
                            rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-2
                          "
                        >
                          <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                            <Image
                              src={img}
                              alt={x.name}
                              fill
                              className="object-cover"
                              sizes="150px"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                          </div>

                          <div className="mt-2 text-center text-white/85 text-[11px] sm:text-sm font-semibold leading-tight line-clamp-1">
                            {x.name}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
