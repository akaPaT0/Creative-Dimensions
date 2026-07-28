import Navbar from "../components/Navbar";
import Background from "../components/Background";
import Footer from "../components/Footer";
import { getProducts } from "../lib/products-db";
import ShopCatalogClient from "../shop/ShopCatalogClient";
import TemphomeCustomRequestCta from "../components/TemphomeCustomRequestCta";
import HeroIn from "../components/HeroIn";
import { ArrowRight } from "lucide-react";

export default async function TempHomePage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen relative text-white">
      <Background />
      <Navbar />

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-16">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <HeroIn duration={600}>
          <section className="py-8 sm:py-14 text-center max-w-3xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-[#FF8B64] font-mono">
              Creative Dimensions Studio
            </span>

            <h1 className="mt-3 text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Custom 3D Printing
              <br />
              <span className="text-[#FF8B64]">Made in Lebanon.</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-white/60 max-w-lg mx-auto leading-relaxed">
              Custom keychains, desk accessories &amp; 3D models crafted on demand.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#catalog"
                className="inline-flex items-center gap-2 rounded-xl bg-[#FF8B64] px-6 py-3 text-sm font-bold text-black hover:bg-[#ffa282] transition"
              >
                <span>Shop Collection</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <TemphomeCustomRequestCta
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
                buttonLabel="Custom Request"
              />
            </div>
          </section>
        </HeroIn>

        {/* ── CATALOG ────────────────────────────────────────────────── */}
        <div id="catalog" className="mt-8">
          <ShopCatalogClient products={products} />
        </div>

        {/* ── CUSTOM REQUEST BANNER ───────────────────────────────────── */}
        <section className="mt-20 text-center py-12 border-t border-white/10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Have a custom design or 3D file?
          </h2>
          <p className="mt-2 text-sm text-white/60 max-w-md mx-auto">
            Send us your STL file or idea for a custom 3D print quote.
          </p>
          <div className="mt-6">
            <TemphomeCustomRequestCta
              className="inline-flex items-center justify-center rounded-xl bg-[#FF8B64] px-6 py-3 text-sm font-bold text-black hover:bg-[#ffa282] transition"
              buttonLabel="Request Custom Print"
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
