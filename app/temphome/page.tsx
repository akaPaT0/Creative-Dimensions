import Navbar from "../components/Navbar";
import Background from "../components/Background";
import Footer from "../components/Footer";
import Link from "next/link";
import Image from "next/image";
import { getProducts } from "../lib/products-db";
import ShopCatalogClient from "../shop/ShopCatalogClient";
import type { Product } from "../shop/ShopCatalogClient";
import TemphomeCustomRequestCta from "../components/TemphomeCustomRequestCta";
import HeroIn from "../components/HeroIn";
import { ArrowRight, ChevronRight } from "lucide-react";

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
  return "Custom Quote";
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
  const flowingFeatured = [...featured, ...featured];

  const categoryCounts = products.reduce((acc, p) => {
    const cat = p.category || "other";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <main className="min-h-screen relative text-white">
      <Background />
      <Navbar />

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <HeroIn duration={600}>
          <section className="py-12 sm:py-16 text-center max-w-3xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-[#FF8B64] font-mono">
              Creative Dimensions Studio
            </span>

            <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              3D Printed Goods &amp; Custom Work.
            </h1>

            <p className="mt-4 text-base sm:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
              Custom keychains, desk accessories &amp; bespoke 3D models — crafted to order in Lebanon.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#all"
                className="inline-flex items-center gap-2 rounded-xl bg-[#FF8B64] px-6 py-3.5 text-sm font-semibold text-black hover:bg-[#ffa282] transition"
              >
                <span>Browse Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <TemphomeCustomRequestCta
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition"
                buttonLabel="Custom Request"
              />
            </div>
          </section>
        </HeroIn>

        {/* ── CATEGORY GRID ────────────────────────────────────────────── */}
        <section className="mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <a
              href="#all"
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 hover:border-white/20 transition duration-200"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono text-[#FF8B64]">01</span>
                <span className="text-xs text-white/40">
                  {categoryCounts["keychains"] || 10}+ Items
                </span>
              </div>
              <h3 className="mt-6 text-xl font-bold text-white group-hover:text-[#FF8B64] transition">
                Keychains
              </h3>
              <p className="mt-1 text-xs text-white/50">
                Car logos, custom text tags &amp; mini keyrings.
              </p>
            </a>

            <a
              href="#all"
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 hover:border-white/20 transition duration-200"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono text-[#FF8B64]">02</span>
                <span className="text-xs text-white/40">
                  {categoryCounts["desk-add-ons"] || 8}+ Items
                </span>
              </div>
              <h3 className="mt-6 text-xl font-bold text-white group-hover:text-[#FF8B64] transition">
                Desk Add-ons
              </h3>
              <p className="mt-1 text-xs text-white/50">
                Holders, stands &amp; desk organizers.
              </p>
            </a>

            <a
              href="#all"
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 hover:border-white/20 transition duration-200"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono text-[#FF8B64]">03</span>
                <span className="text-xs text-white/40">
                  {categoryCounts["accessories"] || 12}+ Items
                </span>
              </div>
              <h3 className="mt-6 text-xl font-bold text-white group-hover:text-[#FF8B64] transition">
                Accessories &amp; Figures
              </h3>
              <p className="mt-1 text-xs text-white/50">
                Collectibles, display models &amp; parts.
              </p>
            </a>

          </div>
        </section>

        {/* ── FEATURED MARQUEE ────────────────────────────────────────── */}
        {featured.length > 0 && (
          <section
            id="featured"
            className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"
          >
            <div className="flex items-center justify-between px-2 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Featured Products
              </h2>
              <a href="#all" className="text-xs text-white/50 hover:text-white flex items-center gap-1">
                <span>View catalog</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Mobile marquee */}
            <div className="flowing-products flowing-products-mobile mt-2 lg:hidden">
              <div
                className="flowing-products-track"
                style={{ animationDuration: "34s" }}
              >
                {flowingFeatured.map((p: Product, index: number) => {
                  const isClone = index >= featured.length;
                  return (
                    <Link
                      key={`m-${getStableKey(p)}-${index}`}
                      href={getProductHref(p)}
                      aria-hidden={isClone}
                      tabIndex={isClone ? -1 : 0}
                      className="group shrink-0 w-[52vw] max-w-[200px] flex h-full flex-col rounded-xl border border-white/10 bg-black/20 p-3 hover:bg-black/40 transition"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-white/5 border border-white/10">
                        <Image
                          src={getCardImage(p)}
                          alt={getTitle(p)}
                          fill
                          className="object-cover group-hover:scale-[1.03] transition duration-300"
                          sizes="(max-width: 1024px) 52vw, 200px"
                        />
                      </div>

                      <div className="mt-3 flex items-start justify-between gap-2">
                        <div className="min-w-0 text-white text-xs font-semibold leading-snug line-clamp-2">
                          {getTitle(p)}
                        </div>
                        <div className="shrink-0 text-[#FF8B64] font-semibold text-xs">
                          {getPriceLabel(p)}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Desktop marquee */}
            <div className="flowing-products mt-3 hidden lg:block">
              <div
                className="flowing-products-track"
                style={{ animationDuration: "42s" }}
              >
                {flowingFeatured.map((p: Product, index: number) => {
                  const isClone = index >= featured.length;
                  return (
                    <Link
                      key={`d-${getStableKey(p)}-${index}`}
                      href={getProductHref(p)}
                      aria-hidden={isClone}
                      tabIndex={isClone ? -1 : 0}
                      className="group shrink-0 w-[300px] flex h-full flex-col rounded-xl border border-white/10 bg-black/20 p-3.5 hover:bg-black/40 hover:border-white/20 transition"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-white/5 border border-white/10">
                        <Image
                          src={getCardImage(p)}
                          alt={getTitle(p)}
                          fill
                          className="object-cover group-hover:scale-[1.03] transition duration-300"
                          sizes="300px"
                        />
                      </div>

                      <div className="mt-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 text-white font-semibold text-sm line-clamp-2 leading-snug">
                          {getTitle(p)}
                        </div>
                        <div className="shrink-0 text-[#FF8B64] font-semibold text-sm">
                          {getPriceLabel(p)}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── ALL PRODUCTS CATALOG ───────────────────────────────────── */}
        <ShopCatalogClient products={products} />

        {/* ── CUSTOM REQUEST CTA ─────────────────────────────────────── */}
        <section className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Need a Custom 3D Print or Special Design?
          </h2>
          <p className="mt-2 text-sm text-white/60 max-w-md mx-auto">
            Send us your STL file, 3D model, or custom text request for a fast quote.
          </p>
          <div className="mt-6">
            <TemphomeCustomRequestCta
              className="inline-flex items-center justify-center rounded-xl bg-[#FF8B64] px-6 py-3 text-sm font-semibold text-black hover:bg-[#ffa282] transition"
              buttonLabel="Request Custom Print"
            />
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────── */}
        <div className="mt-12">
          <Footer />
        </div>

      </section>
    </main>
  );
}
