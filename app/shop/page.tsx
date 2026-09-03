import { getProducts } from "../lib/products-db";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";
import ShopCatalogClient from "./ShopCatalogClient";
import DynamicCategoryStage from "./DynamicCategoryStage";
import TemphomeCustomRequestCta from "../components/TemphomeCustomRequestCta";
import CustomRequestModal from "../components/CustomRequestModal";

export default async function Shop() {
  const products = await getProducts();

  return (
    <main className="min-h-screen relative text-white selection:bg-[#FF8B64]/30 selection:text-[#FF8B64]">
      <Background />
      <Navbar />

      <section className="relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 xl:px-14 pt-24 sm:pt-32 pb-20">
        {/* ── STORE HEADER ─────────────────────────────────────────── */}
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 sm:gap-8 mb-10 sm:mb-14">
          {/* Subtle warm glow behind headline */}
          <div
            className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-80 h-48 bg-[#FF8B64]/12 blur-3xl rounded-full"
            aria-hidden="true"
          />

          <div className="relative max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
              Shop{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF8B64] via-[#ffa282] to-[#ffd0b5]">
                All
              </span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-white/70 max-w-xl leading-relaxed">
              Unique keychains, figurines &amp; accessories — printed on demand in Lebanon.
            </p>
          </div>

          <div className="shrink-0">
            <TemphomeCustomRequestCta
              className="inline-flex items-center justify-center rounded-2xl bg-[#FF8B64] px-8 py-3.5 text-sm sm:text-base font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              buttonLabel="Custom Request"
            />
          </div>
        </div>

        {/* ── DYNAMIC CATEGORY SHOWCASE STAGE ───────────────────────── */}
        <DynamicCategoryStage products={products as any[]} />

        {/* All products (interactive catalog with search, filters & responsive grid) */}
        <div id="all" className="mt-14 sm:mt-18">
          <ShopCatalogClient products={products as any[]} />
        </div>

        <div className="mt-10 text-center text-sm text-white/50">
          Want something specific? Hit{" "}
          <CustomRequestModal
            productName="Custom Order"
            productUrl="https://creativedimensionslb.com/shop"
            className="inline text-white/80 hover:text-white transition"
            buttonLabel="Custom Request"
          />{" "}
          and we’ll make it happen.
        </div>

        <div className="mt-14">
          <Footer />
        </div>
      </section>
    </main>
  );
}
