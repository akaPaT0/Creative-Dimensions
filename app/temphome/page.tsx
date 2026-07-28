import Navbar from "../components/Navbar";
import Background from "../components/Background";
import Footer from "../components/Footer";
import Link from "next/link";
import Image from "next/image";
import { getProducts } from "../lib/products-db";
import ShopCatalogClient from "../shop/ShopCatalogClient";
import type { Product } from "../shop/ShopCatalogClient";
import TemphomeCustomRequestCta from "../components/TemphomeCustomRequestCta";

function getCardImage(p: Product) {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.image === "string" && p.image) return p.image;

  const cat = p?.category;
  const sub = p?.subCategory || "other";
  const slug = p?.slug;
  if (cat && slug) return `/products/${cat}/${sub}/${slug}-1.webp`;

  return "/products/placeholder.jpg";
}

function getTitle(p: Product) {
  return (
    p.title ||
    p.name ||
    p.label ||
    (p.slug ? String(p.slug).replace(/-/g, " ") : "Product")
  );
}

function getPriceLabel(p: Product) {
  const price = p.price ?? p.priceUSD;
  const currency = p.currency || "USD";

  if (typeof price === "number") return `$${price}`;
  if (typeof price === "string" && price.trim()) return price;
  return "DM for price";
}

function getProductHref(p: Product) {
  if (p?.category && p?.slug) return `/shop/${p.category}/${p.slug}`;
  if (p?.category) return `/shop/${p.category}`;
  return "/shop";
}

function getStableKey(p: Product) {
  return `${p.category ?? "x"}-${p.slug ?? "no-slug"}-${p.id ?? "no-id"}`;
}

export default async function TempHomePage() {
  const products = await getProducts();
  const featured = products.filter((p) => p.featured === true);

  return (
    <main className="min-h-screen relative text-white">
      <Background />
      <Navbar />

      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-20">

        {/* ── HERO (Matching Photoshop Design) ─────────────────────────── */}
        <section className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            Custom 3D Prints Made Different
          </h1>

          <p className="mt-4 text-white/60 text-sm sm:text-base lg:text-lg max-w-md mx-auto leading-relaxed">
            Unique keychains, figurines &amp; accessories -
            <br className="hidden sm:inline" /> printed on demand in Lebanon.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#all"
              className="rounded-2xl bg-[#FF8B64] px-8 py-3.5 text-sm sm:text-base font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition shadow-lg"
            >
              Shop All
            </a>

            <TemphomeCustomRequestCta
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-[#232326] px-8 py-3.5 text-sm sm:text-base font-semibold text-[#FF8B64] hover:bg-[#2c2c30] transition"
              buttonLabel="Custom Request"
            />
          </div>
        </section>

        {/* ── FEATURED CONTAINER (Matching Photoshop Design) ───────────── */}
        {featured.length > 0 && (
          <section
            id="featured"
            className="mt-16 rounded-[28px] border border-white/10 bg-[#161618]/85 backdrop-blur-md p-6 sm:p-8"
          >
            {/* Pill Badge */}
            <div className="mb-6">
              <span className="inline-flex items-center rounded-full bg-[#27272A] px-4 py-1.5 text-xs sm:text-sm font-semibold text-[#FF8B64] border border-white/5">
                Featured
              </span>
            </div>

            {/* Featured Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {featured.slice(0, 5).map((p: Product) => (
                <Link
                  key={`f-${getStableKey(p)}`}
                  href={getProductHref(p)}
                  className="group flex flex-col rounded-2xl border border-white/5 bg-[#242427] p-3 hover:bg-[#2d2d31] hover:border-white/15 transition duration-200"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#1A1A1C]">
                    <Image
                      src={getCardImage(p)}
                      alt={getTitle(p)}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  </div>

                  <div className="mt-3 flex flex-col justify-between flex-1">
                    <div className="text-white text-xs font-semibold line-clamp-2 leading-snug group-hover:text-[#FF8B64] transition">
                      {getTitle(p)}
                    </div>
                    <div className="mt-2 text-[#FF8B64] font-semibold text-xs">
                      {getPriceLabel(p)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── ALL PRODUCTS CATALOG ───────────────────────────────────── */}
        <ShopCatalogClient products={products} />

        {/* ── CUSTOM REQUEST BANNER ───────────────────────────────────── */}
        <section className="mt-16 rounded-[24px] border border-white/10 bg-[#161618]/85 p-8 text-center backdrop-blur-md">
          <p className="text-white/80 text-base sm:text-lg font-medium">
            Need a custom design or special 3D print?
          </p>
          <div className="mt-4">
            <TemphomeCustomRequestCta
              className="inline-flex items-center justify-center rounded-2xl bg-[#FF8B64] px-8 py-3 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition"
              buttonLabel="Custom request"
            />
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────── */}
        <div className="mt-16">
          <Footer />
        </div>

      </section>
    </main>
  );
}
