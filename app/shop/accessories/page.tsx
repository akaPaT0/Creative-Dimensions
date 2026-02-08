import Link from "next/link";
import Image from "next/image";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Background from "../../components/Background";
import { products } from "../../data/products";

// ✅ CHANGE THESE 3
const CATEGORY = "acessories"; // tools | accessories | new-arrivals | etc...
const TITLE = "Accessories";
const DESC =
  "We’re building this section properly, with clean photos, solid options, and clear details. Check back soon.";

function getCardImage(p: any) {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.image === "string" && p.image) return p.image;
  if (p?.category && p?.slug) return `/products/${p.category}/${p.slug}-1.jpg`;
  return "/products/placeholder.jpg";
}

function getProductHref(p: any) {
  if (p?.category && p?.slug)
    return `/shop/${p.category}/${encodeURIComponent(p.slug)}`;
  if (p?.category) return `/shop/${p.category}`;
  return "/shop";
}

export default function Page() {
  // Show real content so the page isn't empty:
  const featuredFromOtherCats = products
    .filter((p: any) => p?.featured === true && p?.category !== CATEGORY)
    .slice(0, 6);

  const fallbackFromOtherCats =
    featuredFromOtherCats.length > 0
      ? featuredFromOtherCats
      : products.filter((p: any) => p?.category !== CATEGORY).slice(0, 6);

  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Top */}
        <div className="flex flex-col items-center text-center">
          {/* Back button: centered on mobile, left on pc */}
          <div className="w-full flex justify-center sm:justify-start">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition"
            >
              <span className="text-lg leading-none">←</span>
              Back to Shop
            </Link>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white/75 text-sm">
            <span className="h-2 w-2 rounded-full bg-[#FF8B64] shadow-[0_0_18px_rgba(255,139,100,0.55)]" />
            In progress
          </div>

          <h1
            className="mt-4 text-white font-semibold leading-tight tracking-tight text-5xl sm:text-6xl
            [text-shadow:0_0_25px_rgba(255,139,100,0.35)]"
          >
            {TITLE}
          </h1>

          <p className="mt-4 max-w-2xl text-white/70 text-base sm:text-lg leading-relaxed">
            {DESC}
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`https://wa.me/96170304007?text=${encodeURIComponent(
                `Hey! I’m interested in the ${TITLE} category.\nWhat items will you add soon, and can I request something specific?`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-[#FF8B64] px-7 py-3 font-medium text-black hover:opacity-90 transition"
            >
              Ask on WhatsApp
            </a>

            <a
              href="https://instagram.com/creativedimensions.lb"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-white/20 bg-white/5 px-7 py-3 text-white/90 hover:bg-white/10 transition"
            >
              See drops on Instagram
            </a>
          </div>
        </div>

        {/* What’s coming */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Curated items",
              desc: "Only stuff that matches the Creative Dimensions vibe and actually makes sense to stock.",
            },
            {
              title: "Better photos",
              desc: "Clean renders + real photos so you know exactly what you’re getting.",
            },
            {
              title: "Color options",
              desc: "More combos + customization notes right on the product pages.",
            },
          ].map((x) => (
            <div
              key={x.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="text-white font-semibold">{x.title}</div>
              <div className="mt-2 text-sm text-white/60 leading-relaxed">
                {x.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Browse meanwhile (ONLY Keychains + Fanboys) */}
        <div className="mt-12">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between text-center sm:text-left">
            <h2 className="text-xl font-semibold text-white">Browse meanwhile</h2>
            <p className="text-sm text-white/60">These sections are live right now.</p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {[
              { title: "Keychains", desc: "Clean, custom, gift-ready.", href: "/shop/keychains" },
              { title: "Fanboys", desc: "Fandom prints and fun stuff.", href: "/shop/fanboys" },
            ].map((c) => (
              <Link
                key={c.title}
                href={c.href}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-white">{c.title}</div>
                    <div className="mt-1 text-sm text-white/65">{c.desc}</div>
                  </div>
                  <span className="text-white/40 group-hover:text-white/70 transition">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Real products section */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between text-center sm:text-left">
            <h2 className="text-xl font-semibold text-white">Featured right now</h2>
            <p className="text-sm text-white/60">While {TITLE} is being prepared.</p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fallbackFromOtherCats.map((p: any) => (
              <Link
                key={`${p.category}-${p.slug}-${p.id ?? "x"}`}
                href={getProductHref(p)}
                className="group rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-black/30 transition"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-white/5 border border-white/10">
                  <Image
                    src={getCardImage(p)}
                    alt={p.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>

                <div className="mt-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white font-semibold truncate">{p.name}</div>
                    <div className="mt-1 text-sm text-white/60 line-clamp-2">
                      {p.description ?? "—"}
                    </div>
                  </div>

                  <div className="shrink-0 text-white/80 text-sm">
                    {p.priceUSD ? `$${p.priceUSD}` : ""}
                  </div>
                </div>

                <div className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-white/90 group-hover:bg-white/10 transition text-center">
                  View
                </div>
              </Link>
            ))}
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}
