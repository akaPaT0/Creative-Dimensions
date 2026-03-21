import Link from "next/link";
import Image from "next/image";
import type { Product } from "../data/products";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";
import LikeIconButton from "../components/LikeIconButton";
import WishlistIconButton from "../components/WishlistIconButton";
import CustomRequestModal from "../components/CustomRequestModal";
import { getShopProducts as getProducts } from "../lib/products-db";
import ShopCatalogClient from "./ShopCatalogClient";

export const dynamic = "force-dynamic";

function getCardImage(p: Product) {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.image === "string" && p.image) return p.image;
  if (p.category && p.slug) return `/products/${p.category}/${p.slug}-1.jpg`;
  return "/products/placeholder.jpg";
}

function getTitle(p: Product) {
  return p.name || (p.slug ? String(p.slug).replace(/-/g, " ") : "Product");
}

function getDesc(p: Product) {
  return p.description || "Custom 3D print item.";
}

function getPriceLabel(p: Product) {
  if (typeof p.priceUSD === "number" && Number.isFinite(p.priceUSD)) {
    return `$${p.priceUSD}`;
  }
  return "DM for price";
}

function getProductHref(p: Product) {
  if (p.category && p.slug) return `/shop/${p.category}/${encodeURIComponent(p.slug)}`;
  if (p.category) return `/shop/${p.category}`;
  return "/shop";
}

function getStableKey(p: Product) {
  return `${p.category ?? "x"}-${p.slug ?? "no-slug"}-${p.id ?? "no-id"}`;
}

function pickFeaturedByCategory(
  items: Product[],
  limits: Record<string, number>,
  total = 6
) {
  const featuredOnly = items.filter((p) => p.featured === true);
  const picked: Product[] = [];
  const used = new Set<string>();

  for (const [cat, limit] of Object.entries(limits)) {
    const list = featuredOnly.filter((p) => p.category === cat && !used.has(getStableKey(p)));
    for (const p of list.slice(0, limit)) {
      picked.push(p);
      used.add(getStableKey(p));
      if (picked.length >= total) return picked.slice(0, total);
    }
  }

  for (const p of featuredOnly) {
    const k = getStableKey(p);
    if (!used.has(k)) {
      picked.push(p);
      used.add(k);
      if (picked.length >= total) break;
    }
  }

  return picked.slice(0, total);
}

export default async function Shop() {
  const products = await getProducts();
  const featured = pickFeaturedByCategory(
    products,
    {
      keychains: 2,
      tools: 1,
      accessories: 1,
      "desk-add-ons": 1,
      fanboys: 1,
    },
    6
  );

  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-semibold text-white">Shop</h1>
            <p className="mt-2 text-white/70">
              Prints, parts, and digital files built with the Creative Dimensions
              vibe.
            </p>
          </div>

          <div className="flex gap-3 justify-center sm:justify-end">
            <CustomRequestModal
              productName="Custom Order"
              productUrl="https://creativedimensionslb.com/shop"
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-white/90 hover:bg-white/10 transition"
              buttonLabel="Custom Request"
            />

            <Link
              href="#all"
              className="rounded-xl bg-[#FF8B64] px-5 py-2.5 font-medium text-black hover:opacity-90 transition"
            >
              Browse All
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "New Arrivals",
              desc: "Fresh drops and latest uploads.",
              href: "/shop/new-arrivals",
              featured: true,
            },
            {
              title: "Keychains",
              desc: "Clean, custom, gift-ready.",
              href: "/shop/keychains",
              featured: false,
            },
            {
              title: "Tools",
              desc: "Maker essentials and workshop gear.",
              href: "/shop/tools",
              featured: false,
            },
            {
              title: "Accessories",
              desc: "Upgrades, add-ons, extras.",
              href: "/shop/accessories",
              featured: false,
            },
            {
              title: "Desk Add-Ons",
              desc: "Stands, trays, and desktop upgrades.",
              href: "/shop/desk-add-ons",
              featured: false,
            },
            {
              title: "Fanboys",
              desc: "Fandom prints and fun stuff.",
              href: "/shop/fanboys",
              featured: false,
            },
          ].map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className={`group rounded-2xl p-4 sm:p-5 transition ${
                c.featured
                  ? "border border-[#FF8B64]/50 bg-[#FF8B64]/12 hover:bg-[#FF8B64]/20 shadow-[0_0_0_1px_rgba(255,139,100,0.2)]"
                  : "border border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-white">
                    {c.title}
                    {c.featured ? (
                      <span className="ml-2 rounded-full border border-[#FF8B64]/50 bg-[#FF8B64]/20 px-2 py-0.5 text-[11px] font-medium text-[#FFD3C1] align-middle">
                        New
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-sm text-white/65">{c.desc}</div>
                </div>
                <span className="text-white/40 group-hover:text-white/70 transition">-&gt;</span>
              </div>
            </Link>
          ))}
        </div>

        <div
          id="featured"
          className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-center sm:text-left">
            <h2 className="text-xl font-semibold text-white">Featured</h2>
            <p className="text-sm text-white/60">
              Handpicked drops, limited runs, and best-sellers.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <Link
                key={getStableKey(p)}
                href={getProductHref(p)}
                className="group flex h-full flex-col rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5 hover:bg-black/30 transition"
              >
                <div className="relative aspect-square sm:aspect-[4/3] w-full overflow-hidden rounded-xl bg-white/5 border border-white/10">
                  <Image
                    src={getCardImage(p)}
                    alt={getTitle(p)}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <LikeIconButton productId={String(p.id)} positionClass="bottom-2 right-10" />
                  <WishlistIconButton productId={String(p.id)} />
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <div className="text-white font-semibold leading-snug line-clamp-2">
                      {getTitle(p)}
                    </div>
                    <div className="mt-1 text-sm text-white/60 line-clamp-2">
                      {getDesc(p)}
                    </div>
                  </div>

                  <div className="shrink-0 text-white/80 text-sm sm:text-right">
                    {getPriceLabel(p)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <ShopCatalogClient products={products} />

        <div className="mt-10 text-center text-sm text-white/50">
          Want something specific? Hit{" "}
          <CustomRequestModal
            productName="Custom Order"
            productUrl="https://creativedimensionslb.com/shop"
            className="inline text-white/80 hover:text-white transition"
            buttonLabel="Custom Request"
          />
          .
        </div>

        <Footer />
      </main>
    </div>
  );
}
