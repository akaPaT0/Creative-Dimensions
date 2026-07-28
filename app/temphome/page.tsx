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
  return "DM";
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
    <main className="min-h-screen relative text-white selection:bg-[#FF8B64]/30 selection:text-[#FF8B64]">
      <Background />
      <Navbar />

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-20">

        {/* ── HERO (Photoshop Specification) ─────────────────────────── */}
        <section className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Custom 3D Prints Made Different
          </h1>

          <p className="mt-4 text-white/60 text-sm sm:text-base lg:text-lg max-w-md mx-auto leading-relaxed">
            Unique keychains, figurines &amp; accessories -
            <br className="hidden sm:inline" /> printed on demand in Lebanon.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#all"
              className="rounded-2xl bg-[#FF8B64] px-8 py-3.5 text-sm sm:text-base font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              Shop All
            </a>

            <TemphomeCustomRequestCta
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-[#232326] px-8 py-3.5 text-sm sm:text-base font-semibold text-[#FF8B64] hover:bg-[#2c2c30] transition hover:scale-[1.02] active:scale-[0.98]"
              buttonLabel="Custom Request"
            />
          </div>
        </section>

        {/* ── FEATURED CONTAINER (Exact Photoshop Colors, Glows & Spacing) ──── */}
        {featured.length > 0 && (
          <section
            id="featured"
            className="mt-16 rounded-[36px] border border-white/10 bg-[#161618]/90 backdrop-blur-2xl p-7 sm:p-9 lg:p-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] relative overflow-hidden"
          >
            {/* Subtle Inner Glow Overlay */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,139,100,0.05),transparent_75%)]" />

            {/* Pill Badge */}
            <div className="relative z-10 mb-7 sm:mb-9">
              <a
                href="#all"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#252528] px-5 py-2 text-sm font-semibold text-[#FF8B64] border border-white/15 hover:border-white/30 transition shadow-sm"
              >
                <span>Featured</span>
                <span>→</span>
              </a>
            </div>

            {/* 5 1:1 Square Cards Row */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 sm:gap-6 lg:gap-8">
              {featured.slice(0, 5).map((p: Product) => (
                <Link
                  key={`f-${getStableKey(p)}`}
                  href={getProductHref(p)}
                  className="group relative aspect-square w-full overflow-hidden rounded-[24px] bg-[#252528] border border-white/5 hover:border-white/20 transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02]"
                >
                  <Image
                    src={getCardImage(p)}
                    alt={getTitle(p)}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />

                  {/* Price Pill Overlay */}
                  <div className="absolute bottom-3.5 right-3.5 sm:bottom-4 sm:right-4 rounded-full bg-[#1C1C1E]/90 backdrop-blur-md px-4 py-1.5 text-[#FF8B64] font-bold text-xs sm:text-sm border border-white/10 shadow-lg">
                    {getPriceLabel(p)}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── ALL PRODUCTS CATALOG ───────────────────────────────────── */}
        <ShopCatalogClient products={products} />

        {/* ── CUSTOM REQUEST BANNER ───────────────────────────────────── */}
        <section className="mt-16 rounded-[36px] border border-white/10 bg-[#161618]/90 p-8 sm:p-10 text-center backdrop-blur-2xl shadow-xl">
          <p className="text-white/80 text-base sm:text-lg font-medium">
            Need a custom design or special 3D print?
          </p>
          <div className="mt-5">
            <TemphomeCustomRequestCta
              className="inline-flex items-center justify-center rounded-2xl bg-[#FF8B64] px-8 py-3.5 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition shadow-lg"
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
