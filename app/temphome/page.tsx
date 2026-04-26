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

  if (typeof price === "number") return `${price} ${currency}`;
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
  const flowingFeatured = [...featured, ...featured];

  return (
    <main className="min-h-screen relative">
      <Background />
      <Navbar />

      <section className="relative z-10 mx-auto w-full max-w-[96rem] px-3 sm:px-4 lg:px-6 pt-20 sm:pt-24 lg:pt-28 pb-16">
        {featured.length > 0 && (
          <section
            id="featured"
            className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-6"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-center sm:text-left">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Featured Products
              </h2>
            </div>

            <div className="flowing-products flowing-products-mobile mt-3 sm:mt-6 lg:hidden">
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
                      className="group shrink-0 w-[52vw] max-w-[200px] flex h-full flex-col rounded-xl border border-white/10 bg-black/20 p-2.5 hover:bg-black/30 transition"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-white/5 border border-white/10">
                        <Image
                          src={getCardImage(p)}
                          alt={getTitle(p)}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          sizes="(max-width: 1024px) 52vw, 200px"
                        />
                      </div>

                      <div className="mt-2 grid min-h-[2.75rem] grid-cols-[1fr_auto] items-start gap-2">
                        <div className="min-w-0 min-h-[2.25rem] text-white text-xs sm:text-sm font-semibold leading-4 sm:leading-5 line-clamp-2">
                          {getTitle(p)}
                        </div>
                        <div className="shrink-0 whitespace-nowrap pt-0.5 text-white/80 text-[11px] sm:text-xs">
                          {getPriceLabel(p)}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

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
                      className="group shrink-0 w-[340px] flex h-full flex-col rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-black/30 transition"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-white/5 border border-white/10">
                        <Image
                          src={getCardImage(p)}
                          alt={getTitle(p)}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          sizes="340px"
                        />
                      </div>

                      <div className="mt-4 grid min-h-[3rem] grid-cols-[1fr_auto] items-start gap-3">
                        <div className="min-w-0 min-h-[3rem] text-white font-semibold leading-6 line-clamp-2">
                          {getTitle(p)}
                        </div>
                        <div className="shrink-0 whitespace-nowrap pt-1 text-white/80 text-sm">
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

        <ShopCatalogClient products={products} />

        <section className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 text-center">
          <p className="text-white/70 text-sm sm:text-base">
            Need a custom design or special print?
          </p>
          <div className="mt-4">
            <TemphomeCustomRequestCta
              className="inline-flex items-center justify-center rounded-xl bg-[#FF8B64] px-6 py-3 text-sm sm:text-base font-semibold text-black hover:opacity-90 transition"
              buttonLabel="Custom request"
            />
          </div>
        </section>

        <div className="mt-12">
          <Footer />
        </div>
      </section>
    </main>
  );
}
