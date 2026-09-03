import Navbar from "../components/Navbar";
import Background from "../components/Background";
import Footer from "../components/Footer";
import Link from "next/link";
import Image from "next/image";
import { getProducts } from "../lib/products-db";
import type { Product } from "../shop/ShopCatalogClient";
import TemphomeCustomRequestCta from "../components/TemphomeCustomRequestCta";

function getCardImage(p: Product) {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.image === "string" && p.image) return p.image;

  const cat = p?.category;
  const sub = p?.subCategory || "other";
  const slug = p?.slug;
  if (cat && slug) return `/products/${cat}/${sub}/${slug}-1.webp`;

  return "/products/Cute_Crab_1.webp";
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

      <section className="relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 xl:px-14 pt-36 sm:pt-44 lg:pt-48 pb-20">

        {/* ── HERO ────────────────────────────────────────────────────── */}
        <section className="relative text-center max-w-3xl mx-auto">
          {/* Subtle warm glow behind headline */}
          <div
            className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-80 h-48 bg-[#FF8B64]/12 blur-3xl rounded-full"
            aria-hidden="true"
          />

          <h1 className="relative text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            Custom 3D Prints
            <span className="block mt-1 sm:mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[#FF8B64] via-[#ffa282] to-[#ffd0b5]">
              Made Different
            </span>
          </h1>

          <p className="relative mt-4 sm:mt-5 text-white/70 text-sm sm:text-base lg:text-lg max-w-md mx-auto leading-relaxed">
            Unique keychains, figurines &amp; accessories —
            <br className="hidden sm:inline" /> printed on demand in Lebanon.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
            <Link
              href="/shop"
              className="rounded-2xl bg-[#FF8B64] px-8 py-3.5 text-sm sm:text-base font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              Shop All
            </Link>

            <TemphomeCustomRequestCta
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-[#232326] px-8 py-3.5 text-sm sm:text-base font-semibold text-[#FF8B64] hover:bg-[#2c2c30] transition hover:scale-[1.02] active:scale-[0.98]"
              buttonLabel="Custom Request"
            />
          </div>
        </section>

        {/* ── FEATURED SECTION ────────────────────────────────────────── */}
        {featured.length > 0 && (
          <section
            id="featured"
            className="mt-20 sm:mt-24 lg:mt-28"
          >
            {/* Clean Section Header */}
            <div className="mb-3.5 sm:mb-5 flex items-baseline justify-between">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Featured
              </h2>

              <Link
                href="/shop"
                className="text-xs sm:text-sm font-semibold text-[#FF8B64] hover:text-[#ffa282] transition-colors flex items-center gap-1"
              >
                <span>See all</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            {/* Cards: Clean carousel on mobile, 5-col grid on desktop */}
            <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5 overflow-x-auto overscroll-x-contain snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2 sm:pb-0">
              {featured.slice(0, 5).map((p: Product) => (
                <Link
                  key={`f-${getStableKey(p)}`}
                  href={getProductHref(p)}
                  className="group flex flex-col rounded-2xl border border-white/10 bg-[#161619]/90 hover:border-[#FF8B64]/40 transition-all duration-200 p-2.5 sm:p-3 w-[145px] sm:w-auto shrink-0 snap-start shadow-md"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/40 border border-white/5">
                    <Image
                      src={getCardImage(p)}
                      alt={getTitle(p)}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      sizes="(max-width: 640px) 150px, (max-width: 1024px) 33vw, 20vw"
                    />
                  </div>

                  <div className="mt-2.5 flex flex-col flex-1 justify-between">
                    <div className="text-white text-xs sm:text-sm font-semibold truncate group-hover:text-[#FF8B64] transition-colors">
                      {getTitle(p)}
                    </div>
                    <div className="mt-1 text-xs sm:text-sm font-bold text-[#FF8B64]">
                      {getPriceLabel(p)}
                    </div>
                  </div>
                </Link>
              ))}
              <div className="shrink-0 w-2 sm:hidden pointer-events-none" aria-hidden="true" />
            </div>
          </section>
        )}

        {/* ── EXPLORE COLLECTIONS ────────────────────────────────────── */}
        <section id="categories" className="mt-14 sm:mt-20">
          <div className="mb-4 sm:mb-6 flex items-baseline justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Explore Collections
              </h2>
              <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                Handcrafted 3D prints organized by category
              </p>
            </div>

            <Link
              href="/shop"
              className="text-xs sm:text-sm font-semibold text-[#FF8B64] hover:text-[#ffa282] transition-colors flex items-center gap-1"
            >
              <span>View all shop</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5 overflow-x-auto overscroll-x-contain snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2 sm:pb-0">
            {[
              {
                title: "Keychains",
                desc: "Cars, cute & custom rings",
                href: "/shop/keychains",
                sample: products.find((p) => p.category === "keychains"),
              },
              {
                title: "New Arrivals",
                desc: "Fresh drops & latest prints",
                href: "/shop/new-arrivals",
                sample: products.find((p) => (p as any).isNew === true) || products[0],
              },
              {
                title: "Fanboys",
                desc: "Figurines & fandom prints",
                href: "/shop/fanboys",
                sample: products.find((p) => p.category === "fanboys") || products[1],
              },
              {
                title: "Accessories",
                desc: "Lighter cases & pocket gear",
                href: "/shop/accessories",
                sample: products.find((p) => p.category === "accessories") || products[2],
              },
              {
                title: "Desk Add-Ons",
                desc: "Stands, trays & setups",
                href: "/shop/desk-add-ons",
                sample: products.find((p) => p.category === "desk-add-ons") || products[3],
              },
              {
                title: "Tools",
                desc: "Maker gear & utilities",
                href: "/shop/tools",
                sample: products.find((p) => p.category === "tools") || products[4],
              },
            ].map((cat) => (
              <Link
                key={cat.title}
                href={cat.href}
                className="group flex flex-col rounded-2xl border border-white/10 bg-[#161619]/90 hover:border-[#FF8B64]/40 transition-all duration-200 p-2.5 sm:p-3 w-[145px] sm:w-auto shrink-0 snap-start shadow-md"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/40 border border-white/5">
                  <Image
                    src={getCardImage(cat.sample || ({} as Product))}
                    alt={cat.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 150px, (max-width: 1024px) 33vw, 16vw"
                  />
                </div>

                <div className="mt-2.5 flex flex-col flex-1 justify-between">
                  <div className="flex items-center justify-between gap-1 text-white text-xs sm:text-sm font-semibold truncate group-hover:text-[#FF8B64] transition-colors">
                    <span className="truncate">{cat.title}</span>
                    <span className="text-xs text-white/40 group-hover:text-[#FF8B64] transition-colors shrink-0">→</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-white/50 truncate">
                    {cat.desc}
                  </p>
                </div>
              </Link>
            ))}
            <div className="shrink-0 w-2 sm:hidden pointer-events-none" aria-hidden="true" />
          </div>
        </section>

        {/* ── STORE GATEWAYS: CATALOG & CUSTOM ───────────────────────── */}
        <section className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Card 1: Full Catalog Gateway */}
          <Link
            href="/shop"
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-[#141417]/90 p-6 sm:p-8 hover:border-[#FF8B64]/50 transition-all duration-300 shadow-xl hover:-translate-y-0.5"
          >
            <div>
              {/* Product Preview Thumbnails Row */}
              <div className="flex items-center gap-2.5 mb-5">
                {products.slice(0, 3).map((p, idx) => (
                  <div
                    key={`cat-prev-${idx}`}
                    className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-black/50 border border-white/10 shadow-md group-hover:scale-105 transition-transform duration-300"
                  >
                    <Image
                      src={getCardImage(p)}
                      alt={getTitle(p)}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                ))}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-dashed border-white/15 bg-white/[0.02] flex items-center justify-center text-xs text-white/40 font-semibold group-hover:border-[#FF8B64]/40 group-hover:text-[#FF8B64] transition-colors">
                  +more
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-[#FF8B64] transition-colors">
                Browse Full Catalog
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-white/60 leading-relaxed max-w-sm">
                Search, filter, and explore all automotive keychains, desk accessories, and collectibles in one place.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#FF8B64]">
              <span>Open Catalog</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </div>
          </Link>

          {/* Card 2: Custom Request Studio */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-[#141417]/90 p-6 sm:p-8 shadow-xl">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Custom 3D Printing
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-white/60 leading-relaxed max-w-sm">
                Have an STL file, reference photo, or custom lettering request? Send us your specs and we’ll print it to order.
              </p>
            </div>

            <div className="mt-6">
              <TemphomeCustomRequestCta
                className="inline-flex items-center justify-center rounded-2xl bg-[#FF8B64] px-6 py-3 text-xs sm:text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition shadow-md hover:scale-[1.02] active:scale-[0.98]"
                buttonLabel="Start Custom Order"
              />
            </div>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────── */}
        <div className="mt-14">
          <Footer />
        </div>

      </section>
    </main>
  );
}
