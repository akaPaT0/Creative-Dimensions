import { products } from "../data/products";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";
import Link from "next/link";
import Image from "next/image";
import ShopCatalogClient from "./ShopCatalogClient";
import LikeIconButton from "../components/LikeIconButton";
import WishlistIconButton from "../components/WishlistIconButton";

/** Helpers */
function getCardImage(p: any) {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.image === "string" && p.image) return p.image;

  // fallback for older data
  const cat = p?.category;
  const sub = p?.subCategory || "other";
  const slug = p?.slug;
  if (cat && slug) return `/products/${cat}/${sub}/${slug}-1.webp`;

  return "/products/placeholder.jpg";
}

function getTitle(p: any) {
  return (
    p.title ||
    p.name ||
    p.label ||
    (p.slug ? String(p.slug).replace(/-/g, " ") : "Product")
  );
}

function getDesc(p: any) {
  return (
    p.shortDesc ||
    p.shortDescription ||
    p.desc ||
    p.description ||
    "Custom 3D print item."
  );
}

function getPriceLabel(p: any) {
  const price = p.price ?? p.priceUSD;
  const currency = p.currency || "USD";

  if (typeof price === "number") return `${price} ${currency}`;
  if (typeof price === "string" && price.trim()) return price;
  return "DM for price";
}

/** IMPORTANT: your routes are /shop/{category}/{slug} */
function getProductHref(p: any) {
  if (p?.category && p?.slug) return `/shop/${p.category}/${p.slug}`;
  if (p?.category) return `/shop/${p.category}`;
  return "/shop";
}

function getStableKey(p: any) {
  return `${p.category ?? "x"}-${p.slug ?? "no-slug"}-${p.id ?? "no-id"}`;
}

/** Featured: featured:true, picked by category limits + auto-fill */
function pickFeaturedByCategory(
  items: any[],
  limits: Record<string, number>,
  total = 6
) {
  const featuredOnly = items.filter((p) => p.featured === true);

  const picked: any[] = [];
  const used = new Set<string>();

  // 1) Pick by category limits
  for (const [cat, limit] of Object.entries(limits)) {
    const list = featuredOnly.filter(
      (p) => p.category === cat && !used.has(getStableKey(p))
    );

    for (const p of list.slice(0, limit)) {
      picked.push(p);
      used.add(getStableKey(p));
      if (picked.length >= total) return picked.slice(0, total);
    }
  }

  // 2) Fill remaining spots with any other featured items
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

export default function Shop() {
  const featured = pickFeaturedByCategory(
    products as any[],
    {
      keychains: 2,
      tools: 1,
      accessories: 1,
      fanboys: 2,
    },
    6
  );

  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-semibold text-white">Shop</h1>
            <p className="mt-2 text-white/70">
              Prints, parts, and digital files built with the Creative Dimensions
              vibe.
            </p>
          </div>

          <div className="flex gap-3 justify-center sm:justify-end">
            <a
              href="https://wa.me/96170304007?text=Hey!%20I%E2%80%99m%20interested%20in%20a%20custom%203D%20print.%20I%20can%20send%20the%20file%20or%20a%20photo%20of%20the%20idea.%20What%20details%20do%20you%20need,%20and%20what%20size%20should%20it%20be%3F"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-white/90 hover:bg-white/10 transition"
            >
              Custom Request
            </a>

            <Link
              href="#all"
              className="rounded-xl bg-[#FF8B64] px-5 py-2.5 font-medium text-black hover:opacity-90 transition"
            >
              Browse All
            </Link>
          </div>
        </div>

        {/* Quick categories */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              title: "New Arrivals",
              desc: "Fresh drops and latest uploads.",
              href: "/shop/new-arrivals",
            },
            {
              title: "Keychains",
              desc: "Clean, custom, gift-ready.",
              href: "/shop/keychains",
            },
            {
              title: "Tools",
              desc: "Maker essentials and workshop gear.",
              href: "/shop/tools",
            },
            {
              title: "Accessories",
              desc: "Upgrades, add-ons, extras.",
              href: "/shop/accessories",
            },
            {
              title: "Fanboys",
              desc: "Fandom prints and fun stuff.",
              href: "/shop/fanboys",
            },
          ].map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="group rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 transition hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-white">
                    {c.title}
                  </div>
                  <div className="mt-1 text-sm text-white/65">{c.desc}</div>
                </div>
                <span className="text-white/40 group-hover:text-white/70 transition">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Featured */}
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
            {featured.map((p: any) => (
              <Link
                key={getStableKey(p)}
                href={getProductHref(p)}
                className="group rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-5 hover:bg-black/30 transition"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-white/5 border border-white/10">
                  <Image
                    src={getCardImage(p)}
                    alt={getTitle(p)}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <LikeIconButton
                    productId={String(p.id)}
                    positionClass="bottom-2 right-10"
                  />
                  <WishlistIconButton productId={String(p.id)} />
                </div>

                <div className="mt-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white font-semibold truncate">
                      {getTitle(p)}
                    </div>
                    <div className="mt-1 text-sm text-white/60 line-clamp-2">
                      {getDesc(p)}
                    </div>
                  </div>

                  <div className="shrink-0 text-white/80 text-sm">
                    {getPriceLabel(p)}
                  </div>
                </div>

                {/* ✅ removed View button (whole card is clickable via Link) */}
              </Link>
            ))}
          </div>
        </div>

        {/* All products (interactive) */}
        <ShopCatalogClient products={products as any[]} />

        <div className="mt-10 text-center text-sm text-white/50">
          Want something specific? Hit{" "}
          <span className="text-white/80">Custom Request</span>.
        </div>

        <Footer />
      </main>
    </div>
  );
}
