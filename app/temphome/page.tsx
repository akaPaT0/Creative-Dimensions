import Navbar from "../components/Navbar";
import { getProductPath } from "@/app/lib/product-url";
import Background from "../components/Background";
import Footer from "../components/Footer";
import Link from "next/link";
import Image from "next/image";
import { getProducts } from "../lib/products-db";
import type { Product } from "../shop/ShopCatalogClient";
import TemphomeCustomRequestCta from "../components/TemphomeCustomRequestCta";
import FeaturedCarousel from "../components/FeaturedCarousel";
import { FileUp, Palette, Sparkles, Truck, Wrench } from "lucide-react";
import { SITE_URL } from "../lib/site";
import { slugify } from "../lib/product-seo";

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

const getProductHref = getProductPath;

const CATEGORY_LABELS: Record<string, string> = {
  keychains: "Keychains",
  accessories: "Accessories",
  fanboys: "Fanboys",
  "desk-add-ons": "Desk Add-Ons",
  tools: "Tools",
  "new-arrivals": "New Arrivals",
};

function getCategoryLabel(category?: string) {
  if (!category) return "";
  return CATEGORY_LABELS[category] ?? category.replace(/-/g, " ");
}

function getStableKey(p: Product) {
  return `${p.category ?? "x"}-${p.slug ?? "no-slug"}-${p.id ?? "no-id"}`;
}

export default async function TempHomePage() {
  const products = await getProducts();
  const featured = products.filter((p) => p.featured === true);

  const heroSlugs = ["full-scale-retractable-katana", "minecraft-armor-stand", "qr-payment-stand"];
  const heroProducts = [
    ...heroSlugs
      .flatMap((slug) => {
        const match = products.find((p) => p.slug === slug);
        return match ? [match] : [];
      }),
    ...featured.filter((p) => !heroSlugs.includes(String(p.slug))),
  ].slice(0, 3);
  const coverFor = (category: string, preferredSlug: string) => {
    const inCategory = products.filter((p) => p.category === category);
    const pick = inCategory.find((p) => p.slug === preferredSlug) ?? inCategory[0];
    return pick ? getCardImage(pick) : undefined;
  };

  const collections: {
    title: string;
    desc: string;
    href: string;
    image?: string;
    icon?: "sparkles" | "wrench";
    comingSoon?: boolean;
  }[] = [
    {
      title: "Keychains",
      desc: "Cars, cute & custom rings",
      href: "/shop/keychains",
      image: coverFor("keychains", "bmw-m4-f82-gront-keychain"),
    },
    {
      title: "Accessories",
      desc: "Lighter cases & pocket gear",
      href: "/shop/accessories",
      image: coverFor("accessories", "dragon-themed-bic-lighter-covers"),
    },
    {
      title: "Desk Add-Ons",
      desc: "Stands, holders & setups",
      href: "/shop/desk-add-ons",
      image: coverFor("desk-add-ons", "desk-note-holder"),
    },
    {
      title: "Fanboys",
      desc: "Figurines & fandom prints",
      href: "/shop/fanboys",
      image: coverFor("fanboys", "full-scale-retractable-katana"),
    },
    {
      title: "New Arrivals",
      desc: "Fresh drops across every category",
      href: "/shop/new-arrivals",
      icon: "sparkles",
    },
    {
      title: "Tools",
      desc: "Maker gear & utilities",
      href: "/shop/tools",
      icon: "wrench",
      comingSoon: true,
    },
  ];

  const homeJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Creative Dimensions",
    url: SITE_URL,
    description: "Custom 3D printed products, keychains, and accessories in Lebanon.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <main className="min-h-screen relative text-white selection:bg-[#FF8B64]/30 selection:text-[#FF8B64]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <Background />
      <Navbar />

      <section className="relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 xl:px-14 pt-32 sm:pt-40 lg:pt-36 pb-20">

        {/* ── HERO ────────────────────────────────────────────────────── */}
        <section className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          {/* Text column */}
          <div className="relative text-center lg:text-left">
            <div
              className="pointer-events-none absolute -top-12 left-1/2 lg:left-24 -translate-x-1/2 w-80 h-48 bg-[#FF8B64]/12 blur-3xl rounded-full"
              aria-hidden="true"
            />

            <h1 className="relative text-4xl sm:text-5xl lg:text-[3.4rem] xl:text-6xl 2xl:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
              <span className="whitespace-nowrap">Custom 3D Prints</span>
              <span className="block mt-1 sm:mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[#FF8B64] via-[#ffa282] to-[#ffd0b5]">
                Made Different
              </span>
            </h1>

            <p className="relative mt-4 sm:mt-5 text-white/70 text-sm sm:text-base lg:text-lg max-w-md mx-auto lg:mx-0 leading-relaxed">
              Custom parts, prototypes, props and business pieces, designed and printed
              in-house in Lebanon. Send us your idea or file and we&rsquo;ll quote it.
            </p>

            <div className="relative mt-8 sm:mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-3.5 sm:gap-4">
              <TemphomeCustomRequestCta
                className="rounded-2xl bg-[#FF8B64] px-8 py-3.5 text-sm sm:text-base font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                buttonLabel="Get a Quote"
              />

              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-[#232326] px-8 py-3.5 text-sm sm:text-base font-semibold text-white hover:bg-[#2c2c30] transition hover:scale-[1.02] active:scale-[0.98]"
              >
                Browse Shop
              </Link>
            </div>

            <ul className="relative mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2.5 text-xs sm:text-sm text-white/60">
              <li className="flex items-center gap-2">
                <FileUp size={16} className="text-[#FF8B64]" aria-hidden="true" />
                Send a file, photo or sketch
              </li>
              <li className="flex items-center gap-2">
                <Palette size={16} className="text-[#FF8B64]" aria-hidden="true" />
                Pick your colours
              </li>
              <li className="flex items-center gap-2">
                <Truck size={16} className="text-[#FF8B64]" aria-hidden="true" />
                Delivery across Lebanon
              </li>
            </ul>
          </div>

          {/* Product collage */}
          {heroProducts.length > 0 && (
            <div className="relative mx-auto h-[300px] w-full max-w-[380px] sm:h-[380px] sm:max-w-[460px] lg:h-[460px] lg:max-w-[520px]">
              <div
                className="pointer-events-none absolute inset-10 rounded-full bg-[#FF8B64]/15 blur-3xl"
                aria-hidden="true"
              />
              {heroProducts.map((p, i) => {
                const layout = [
                  "left-[46%] top-1/2 z-20 w-[52%] -translate-x-1/2 -translate-y-1/2 -rotate-2",
                  "right-0 top-4 z-10 w-[38%] rotate-6",
                  "left-0 bottom-2 z-10 w-[38%] -rotate-6",
                ][i];
                return (
                  <Link
                    key={`hero-${getStableKey(p)}`}
                    href={getProductHref(p)}
                    className={`group absolute ${layout} rounded-3xl border border-white/10 bg-[#161619]/95 p-2 sm:p-2.5 shadow-2xl transition duration-300 hover:z-30 hover:rotate-0 hover:border-[#FF8B64]/50`}
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black/40">
                      <Image
                        src={getCardImage(p)}
                        alt={getTitle(p)}
                        fill
                        priority={i === 0}
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                        sizes="(max-width: 640px) 220px, (max-width: 1024px) 260px, 300px"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 px-1 pt-2 pb-0.5">
                      <span className="truncate text-[11px] sm:text-xs font-semibold text-white/90 group-hover:text-[#FF8B64] transition-colors">
                        {getTitle(p)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── FEATURED SECTION ────────────────────────────────────────── */}
        {featured.length > 0 && (
          <section
            id="featured"
            className="mt-20 sm:mt-24 lg:mt-28"
          >
            <div className="mb-3.5 sm:mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Featured
                </h2>
                <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                  Our most-loved prints right now
                </p>
              </div>

              <Link
                href="/shop"
                className="shrink-0 text-xs sm:text-sm font-semibold text-[#FF8B64] hover:text-[#ffa282] transition-colors flex items-center gap-1"
              >
                <span>See all</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <FeaturedCarousel
              items={featured.slice(0, 10).map((p: Product) => ({
                key: `f-${getStableKey(p)}`,
                href: getProductHref(p),
                title: getTitle(p),
                price: getPriceLabel(p),
                category: getCategoryLabel(p.category),
                image: getCardImage(p),
                hoverImage:
                  Array.isArray(p.images) && p.images.length > 1 ? p.images[1] : undefined,
                isNew: (p as { isNew?: boolean }).isNew === true,
              }))}
            />
          </section>
        )}

        {/* ── EXPLORE COLLECTIONS ────────────────────────────────────── */}
        <section id="categories" className="mt-14 sm:mt-20">
          <div className="mb-4 sm:mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Explore Collections
              </h2>
              <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                3D prints organized by category
              </p>
            </div>

            <Link
              href="/shop"
              className="shrink-0 text-xs sm:text-sm font-semibold text-[#FF8B64] hover:text-[#ffa282] transition-colors flex items-center gap-1"
            >
              <span>View all shop</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5 overflow-x-auto overscroll-x-contain snap-x snap-proximity [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2 sm:pb-0">
            {collections.map((cat) => (
              <Link
                key={cat.title}
                href={cat.href}
                className={`group flex flex-col rounded-2xl border border-white/10 bg-[#161619]/90 transition-all duration-200 p-2.5 sm:p-3 w-[42%] sm:w-auto shrink-0 snap-start shadow-md ${
                  cat.comingSoon ? "opacity-70 hover:opacity-100" : "hover:border-[#FF8B64]/40"
                }`}
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/40 border border-white/5">
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      sizes="(max-width: 640px) 160px, (max-width: 1024px) 33vw, 16vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_45%,rgba(255,139,100,0.22),transparent_65%)]">
                      {cat.icon === "sparkles" ? (
                        <Sparkles className="h-12 w-12 sm:h-14 sm:w-14 text-[#FF8B64] transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
                      ) : (
                        <Wrench className="h-12 w-12 sm:h-14 sm:w-14 text-white/35 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
                      )}
                    </div>
                  )}
                  {cat.comingSoon && (
                    <span className="absolute left-2 top-2 rounded-full border border-white/15 bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/80">
                      Coming soon
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-1 text-white text-xs sm:text-sm font-semibold leading-tight group-hover:text-[#FF8B64] transition-colors">
                    <span>{cat.title}</span>
                    <span className="text-xs text-white/40 group-hover:text-[#FF8B64] transition-colors shrink-0">→</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/50">
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
            {/* Subtle background glow on hover */}
            <div
              className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 bg-[#FF8B64]/10 blur-2xl rounded-full group-hover:bg-[#FF8B64]/20 transition-all duration-500"
              aria-hidden="true"
            />

            <div className="relative">
              <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-[#FF8B64] transition-colors">
                Browse Full Catalog
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-white/60 leading-relaxed max-w-sm">
                Search, filter, and explore all automotive keychains, desk accessories, and collectibles in one place.
              </p>
            </div>

            <div className="relative mt-8">
              <span className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 sm:py-3 text-xs sm:text-sm font-bold text-white group-hover:bg-[#FF8B64] group-hover:text-[#0D0D0D] group-hover:border-[#FF8B64] transition-all duration-200 shadow-md">
                <span>Explore Catalog</span>
                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </span>
            </div>
          </Link>

          {/* Card 2: Custom Request Studio */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-[#141417]/90 p-6 sm:p-8 shadow-xl">
            {/* Subtle background glow */}
            <div
              className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 bg-[#FF8B64]/10 blur-2xl rounded-full"
              aria-hidden="true"
            />

            <div className="relative">
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Custom 3D Printing
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-white/60 leading-relaxed max-w-sm">
                Have an STL file, reference photo, or custom lettering request? Send us your specs and we’ll print it to order.
              </p>
            </div>

            <div className="relative mt-8">
              <TemphomeCustomRequestCta
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl bg-[#FF8B64] px-6 py-3.5 sm:py-3 text-xs sm:text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition shadow-md hover:scale-[1.02] active:scale-[0.98]"
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
