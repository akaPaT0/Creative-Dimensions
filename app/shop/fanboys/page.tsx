import Link from "next/link";
import Image from "next/image";
import Navbar from "../../components/Navbar";
import Background from "../../components/Background";
import { products } from "../../data/products";

function getCardImage(p: any) {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.image === "string" && p.image) return p.image;
  if (p?.category && p?.slug) return `/products/${p.category}/${p.slug}-1.jpg`;
  return "/products/placeholder.jpg";
}

export default function Page() {
  const fanboys = products.filter((p: any) => p.category === "fanboys");

  // ✅ Same behavior as your keychains page:
  // If ANY item has subCategory, show only those with subCategory.
  // Otherwise show all.
  const hasAnySubCats = fanboys.some((p: any) => !!p.subCategory);
  const list = hasAnySubCats
    ? fanboys.filter((p: any) => !!p.subCategory)
    : fanboys;

  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-28 pb-16">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition"
        >
          <span className="text-lg leading-none">←</span>
          Back to Shop
        </Link>

        <div className="mt-8">
          <h1 className="text-4xl font-semibold text-white">Fanboys</h1>
          <p className="mt-2 text-white/70">Browse our fanboy prints.</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p: any) => (
            <Link
              key={p.id ?? `${p.category}-${p.slug}`}
              href={`/shop/fanboys/${encodeURIComponent(p.slug)}`}
              className="
                group rounded-2xl border border-white/10 bg-white/5 p-5
                transition
                hover:bg-white/10
                lg:hover:-translate-y-[2px] lg:hover:scale-[1.01]
                active:scale-[0.99]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20
              "
            >
              {/* Image */}
              <div
                className="
                  relative aspect-[4/3] w-full overflow-hidden rounded-xl
                  border border-white/10 bg-white/5
                  transition
                  lg:group-hover:scale-[1.02]
                "
              >
                <Image
                  src={getCardImage(p)}
                  alt={p.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-70 transition lg:group-hover:opacity-90" />
              </div>

              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-white font-semibold transition lg:group-hover:text-white">
                    {p.name}
                  </div>
                  <div className="mt-1 text-sm text-white/60 line-clamp-2">
                    {p.description ?? "—"}
                  </div>
                </div>

                <div className="text-sm text-white/80 shrink-0">
                  {p.priceUSD ? `$${p.priceUSD}` : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
