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
import {
  Sparkles,
  Zap,
  Layers,
  ShieldCheck,
  Truck,
  ArrowRight,
  ChevronRight,
  Star,
  Palette,
  Box,
  Flame,
  Wrench,
  CheckCircle2,
} from "lucide-react";

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

  if (typeof price === "number") return `$${price} ${currency !== "USD" ? currency : ""}`.trim();
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

  // Category counts
  const categoryCounts = products.reduce((acc, p) => {
    const cat = p.category || "other";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <main className="min-h-screen relative text-white selection:bg-[#FF8B64]/30 selection:text-[#FF8B64]">
      <Background />
      <Navbar />

      <section className="relative z-10 mx-auto w-full max-w-[96rem] px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-20">

        {/* ── HERO SECTION ────────────────────────────────────────────── */}
        <HeroIn duration={800}>
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] via-white/[0.03] to-transparent p-6 sm:p-10 lg:p-14 backdrop-blur-2xl shadow-2xl">
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF8B64]/20 rounded-full blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 w-80 h-80 bg-[#FF8B64]/10 rounded-full blur-[100px]" />

            <div className="relative z-10 text-center max-w-4xl mx-auto">

              {/* Status Pill Badge */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#FF8B64]/30 bg-[#FF8B64]/10 px-4 py-1.5 text-xs font-semibold text-[#FF8B64] backdrop-blur-md mb-6 shadow-[0_0_20px_rgba(255,139,100,0.15)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8B64] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF8B64]"></span>
                </span>
                <span>3D PRINTING STUDIO IN LEBANON</span>
                <span className="text-white/30">•</span>
                <span className="text-white/80 font-normal">MULTI-COLOR & HIGH PRECISION</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                Bespoke 3D Prints.
                <br />
                <span className="bg-gradient-to-r from-white via-[#FF8B64]/90 to-[#FF8B64] bg-clip-text text-transparent drop-shadow-sm">
                  Engineered to Impress.
                </span>
              </h1>

              {/* Tagline */}
              <p className="mt-5 text-base sm:text-lg lg:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed font-normal">
                Custom keychains, detailed collectibles, desk setups &amp; bespoke 3D models — precision printed on-demand with premium multi-color filaments and express local shipping.
              </p>

              {/* Call to Actions */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <a
                  href="#all"
                  className="group inline-flex items-center gap-2.5 rounded-2xl bg-[#FF8B64] px-8 py-4 text-sm font-bold text-black shadow-[0_0_35px_rgba(255,139,100,0.4)] hover:bg-[#ffa282] hover:scale-[1.03] transition-all duration-300"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>

                <TemphomeCustomRequestCta
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-semibold text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-xl transition-all duration-300"
                  buttonLabel="Request Custom Print"
                />
              </div>

              {/* Studio Stats Counter Bar */}
              <div className="mt-12 pt-10 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="p-3">
                  <div className="text-2xl sm:text-3xl font-extrabold text-white">500+</div>
                  <div className="text-xs text-white/50 mt-1 uppercase tracking-wider font-medium">Prints Delivered</div>
                </div>
                <div className="p-3">
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#FF8B64]">30+</div>
                  <div className="text-xs text-white/50 mt-1 uppercase tracking-wider font-medium">Filament Shades</div>
                </div>
                <div className="p-3">
                  <div className="text-2xl sm:text-3xl font-extrabold text-white">0.1mm</div>
                  <div className="text-xs text-white/50 mt-1 uppercase tracking-wider font-medium">Layer Precision</div>
                </div>
                <div className="p-3">
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#FF8B64]">48h</div>
                  <div className="text-xs text-white/50 mt-1 uppercase tracking-wider font-medium">Express Shipping</div>
                </div>
              </div>

            </div>
          </section>
        </HeroIn>

        {/* ── POPULAR CATEGORIES GRID ────────────────────────────────────────── */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF8B64] font-semibold mb-1">
                <Box className="w-3.5 h-3.5" />
                Browse Categories
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Discover Our Craft
              </h2>
            </div>
            <a
              href="#all"
              className="text-xs sm:text-sm font-semibold text-white/60 hover:text-[#FF8B64] transition flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Category 1: Keychains */}
            <a
              href="#all"
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-[#FF8B64]/50 hover:bg-white/[0.08] transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#FF8B64]/10 border border-[#FF8B64]/20 flex items-center justify-center text-[#FF8B64] group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/70">
                  {categoryCounts["keychains"] || 12}+ Items
                </span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-white group-hover:text-[#FF8B64] transition">
                Keychains
              </h3>
              <p className="mt-1 text-xs text-white/60 leading-relaxed">
                Car emblems, custom text tags, anime crests &amp; mini accessories.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#FF8B64]">
                <span>Explore Keychains</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>

            {/* Category 2: Figurines */}
            <a
              href="#all"
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-[#FF8B64]/50 hover:bg-white/[0.08] transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#FF8B64]/10 border border-[#FF8B64]/20 flex items-center justify-center text-[#FF8B64] group-hover:scale-110 transition-transform">
                  <Flame className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/70">
                  {categoryCounts["fanboys"] || 8}+ Items
                </span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-white group-hover:text-[#FF8B64] transition">
                Figurines &amp; Fanboys
              </h3>
              <p className="mt-1 text-xs text-white/60 leading-relaxed">
                High-detail gaming collectibles, anime statues &amp; shelf display icons.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#FF8B64]">
                <span>Explore Figurines</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>

            {/* Category 3: Desk Add-ons */}
            <a
              href="#all"
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-[#FF8B64]/50 hover:bg-white/[0.08] transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#FF8B64]/10 border border-[#FF8B64]/20 flex items-center justify-center text-[#FF8B64] group-hover:scale-110 transition-transform">
                  <Box className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/70">
                  {categoryCounts["desk-add-ons"] || 10}+ Items
                </span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-white group-hover:text-[#FF8B64] transition">
                Desk Add-ons
              </h3>
              <p className="mt-1 text-xs text-white/60 leading-relaxed">
                Headphone holders, cable routing clips, phone docks &amp; setup organizers.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#FF8B64]">
                <span>Explore Desk Accessories</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>

            {/* Category 4: Custom Print */}
            <div
              className="group relative overflow-hidden rounded-2xl border border-[#FF8B64]/30 bg-gradient-to-b from-[#FF8B64]/10 to-white/5 p-6 hover:border-[#FF8B64]/60 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#FF8B64] flex items-center justify-center text-black font-bold group-hover:scale-110 transition-transform">
                  <Wrench className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FF8B64]/20 text-[#FF8B64]">
                  Custom
                </span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-white group-hover:text-[#FF8B64] transition">
                Custom Request
              </h3>
              <p className="mt-1 text-xs text-white/60 leading-relaxed">
                Upload your own STL or sketch. We slice, model &amp; print to your spec.
              </p>
              <div className="mt-4">
                <TemphomeCustomRequestCta
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF8B64] hover:underline"
                  buttonLabel="Submit Custom Request →"
                />
              </div>
            </div>

          </div>
        </section>

        {/* ── FEATURED PRODUCTS CAROUSEL ──────────────────────────────────── */}
        {featured.length > 0 && (
          <section
            id="featured"
            className="mt-16 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 lg:p-10 backdrop-blur-xl relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF8B64] font-semibold mb-1">
                  <Star className="w-3.5 h-3.5 fill-[#FF8B64]" />
                  Curated Selection
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Featured Showcase
                </h2>
              </div>
              <div className="text-xs text-white/50">
                Swipe or scroll to explore top picks
              </div>
            </div>

            {/* Mobile Carousel */}
            <div className="flowing-products flowing-products-mobile mt-3 lg:hidden">
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
                      className="group shrink-0 w-[58vw] max-w-[220px] flex h-full flex-col rounded-2xl border border-white/10 bg-black/40 p-3 hover:border-[#FF8B64]/40 hover:bg-black/60 transition-all duration-300"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-white/5 border border-white/10">
                        <Image
                          src={getCardImage(p)}
                          alt={getTitle(p)}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 1024px) 58vw, 220px"
                        />
                        <span className="absolute top-2 left-2 rounded-full bg-black/70 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold text-[#FF8B64] border border-[#FF8B64]/30">
                          Featured
                        </span>
                      </div>

                      <div className="mt-3 flex flex-col justify-between flex-1">
                        <div className="text-white text-xs sm:text-sm font-semibold line-clamp-2 leading-snug group-hover:text-[#FF8B64] transition-colors">
                          {getTitle(p)}
                        </div>
                        <div className="mt-2 flex items-center justify-between pt-2 border-t border-white/10">
                          <span className="text-[10px] text-white/45 uppercase tracking-wider font-mono">
                            {p.category}
                          </span>
                          <span className="text-xs font-bold text-[#FF8B64]">
                            {getPriceLabel(p)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Desktop Carousel */}
            <div className="flowing-products mt-4 hidden lg:block">
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
                      className="group shrink-0 w-[320px] flex h-full flex-col rounded-2xl border border-white/10 bg-black/40 p-4 hover:border-[#FF8B64]/50 hover:shadow-[0_0_30px_rgba(255,139,100,0.15)] hover:bg-black/60 transition-all duration-300"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-white/5 border border-white/10">
                        <Image
                          src={getCardImage(p)}
                          alt={getTitle(p)}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="320px"
                        />
                        <span className="absolute top-2.5 left-2.5 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-semibold text-[#FF8B64] border border-[#FF8B64]/30 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-[#FF8B64]" />
                          Featured
                        </span>
                      </div>

                      <div className="mt-4 flex flex-col justify-between flex-1">
                        <div className="text-white text-base font-bold line-clamp-2 leading-snug group-hover:text-[#FF8B64] transition-colors">
                          {getTitle(p)}
                        </div>
                        <div className="mt-3 flex items-center justify-between pt-3 border-t border-white/10">
                          <span className="text-xs text-white/50 font-medium">
                            {p.category}
                          </span>
                          <span className="text-sm font-extrabold text-[#FF8B64] bg-[#FF8B64]/10 px-2.5 py-1 rounded-lg border border-[#FF8B64]/20">
                            {getPriceLabel(p)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── WHY CREATIVE DIMENSIONS (STUDIO VALUE PROPOSITION) ────────────── */}
        <section className="mt-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF8B64] font-semibold mb-2">
              <Zap className="w-3.5 h-3.5" />
              The Creative Standard
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Why Our 3D Prints Stand Out
            </h2>
            <p className="mt-2 text-sm text-white/60">
              We combine state-of-the-art additive manufacturing with careful post-processing to guarantee top quality every time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <div className="w-12 h-12 rounded-xl bg-[#FF8B64]/10 border border-[#FF8B64]/20 flex items-center justify-center text-[#FF8B64] mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">0.1mm High Resolution</h3>
              <p className="mt-2 text-xs text-white/60 leading-relaxed">
                Ultra-smooth surface finishes, precise tolerances, and ultra-fine layer height for crisp details.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <div className="w-12 h-12 rounded-xl bg-[#FF8B64]/10 border border-[#FF8B64]/20 flex items-center justify-center text-[#FF8B64] mb-4">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Multi-Color Silk PLAs</h3>
              <p className="mt-2 text-xs text-white/60 leading-relaxed">
                Premium multi-material filaments ranging from metallic silk to matte pastels &amp; dual-tone shifts.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <div className="w-12 h-12 rounded-xl bg-[#FF8B64]/10 border border-[#FF8B64]/20 flex items-center justify-center text-[#FF8B64] mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Quality Inspected</h3>
              <p className="mt-2 text-xs text-white/60 leading-relaxed">
                Every print undergoes structural check and manual cleanup before dispatch to guarantee perfect results.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <div className="w-12 h-12 rounded-xl bg-[#FF8B64]/10 border border-[#FF8B64]/20 flex items-center justify-center text-[#FF8B64] mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Local Lebanon Delivery</h3>
              <p className="mt-2 text-xs text-white/60 leading-relaxed">
                Fast nationwide shipping with Cash on Delivery options across Beirut, Mount Lebanon &amp; all regions.
              </p>
            </div>

          </div>
        </section>

        {/* ── ALL PRODUCTS CATALOG (SHOP CATALOG CLIENT) ─────────────────────── */}
        <div className="mt-16">
          <ShopCatalogClient products={products} />
        </div>

        {/* ── HIGH IMPACT CUSTOM REQUEST BANNER ────────────────────────────── */}
        <section className="mt-20 relative overflow-hidden rounded-3xl border border-[#FF8B64]/30 bg-gradient-to-r from-[#FF8B64]/15 via-white/[0.04] to-[#FF8B64]/10 p-8 sm:p-12 text-center backdrop-blur-2xl shadow-2xl">
          <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 bg-[#FF8B64]/20 rounded-full blur-[100px]" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF8B64]/40 bg-[#FF8B64]/20 px-3.5 py-1 text-xs font-bold text-[#FF8B64] mb-4">
              <Wrench className="w-3.5 h-3.5" />
              BESPOKE 3D MANUFACTURING
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Have a Custom Design or 3D Model?
            </h2>

            <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed">
              Upload your 3D STL file or describe your idea. We provide fast price estimation, material choice guidance, and high-precision printing.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-white/80 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#FF8B64]" />
                STL / CAD Support
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#FF8B64]" />
                Custom Color Matching
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#FF8B64]" />
                Fast Quote &amp; Delivery
              </span>
            </div>

            <div className="mt-8">
              <TemphomeCustomRequestCta
                className="inline-flex items-center gap-2 rounded-2xl bg-[#FF8B64] px-8 py-4 text-sm font-bold text-black shadow-[0_0_35px_rgba(255,139,100,0.4)] hover:bg-[#ffa282] hover:scale-105 transition-all duration-300"
                buttonLabel="Start Custom Request Now"
              />
            </div>
          </div>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────────────────── */}
        <div className="mt-16">
          <Footer />
        </div>

      </section>
    </main>
  );
}
