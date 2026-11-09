import Link from "next/link";
import Image from "next/image";
import { Instagram, MessageCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import Background from "../components/Background";
import Footer from "../components/Footer";
import CustomOrderBand from "../components/CustomOrderBand";
import { getProducts } from "../lib/products-db";
import { getProductPath } from "../lib/product-url";
import { getProductImages } from "../lib/product-seo";

// Real pieces to show; falls back to featured products if any are missing.
const SHOWCASE_SLUGS = [
  "full-scale-retractable-katana",
  "qr-payment-stand",
  "halloween-coffin-lantern",
  "minecraft-armor-stand",
];

const FOR_PEOPLE = [
  "Figurines, props and collectibles",
  "Gifts with names, dates or inside jokes",
  "Car keychains and everyday accessories",
  "Desk pieces, stands and organisers",
];

const FOR_BUSINESS = [
  "Branded stands, signs and logo pieces",
  "QR payment stands and counter displays",
  "Small batches for events and launches",
  "Custom parts and prototypes from your files",
];

const STEPS = [
  { title: "Send the idea", text: "An STL file, a photo, a sketch or a reference link. Anything that shows what you want." },
  { title: "We plan and quote", text: "We confirm size, material and colour, then send a clear price and timing." },
  { title: "You see a preview", text: "We check the details with you before anything is printed." },
  { title: "Printed and delivered", text: "Printed with care, cleaned up, and ready for pickup or delivery across Lebanon." },
];

export default async function AboutPage() {
  const products = await getProducts();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const featured = products.filter((p) => p.featured);
  const showcase = [
    ...SHOWCASE_SLUGS.map((s) => bySlug.get(s)).filter((p): p is NonNullable<typeof p> => Boolean(p)),
    ...featured,
  ]
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
    .slice(0, 4);

  return (
    <div className="relative min-h-screen text-white">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16">
        {/* Hero */}
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF8B64]">About us</span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.08]">
              A 3D printing studio in Lebanon
            </h1>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-white/70">
              Creative Dimensions turns ideas into things you can actually hold, use, gift or display. We care about
              clean design, solid print quality and custom work that fits real use, not just cool renders.
            </p>
            <p className="mt-4 text-base leading-relaxed text-white/60">
              Have an STL file? Perfect. Don&rsquo;t have one? Send a photo, sketch or reference and we&rsquo;ll help
              you shape it: the right size, material and colour, printed so it comes out strong and clean.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="rounded-2xl border border-white/15 bg-white/[0.05] px-6 py-3 text-sm font-semibold hover:bg-white/10 transition"
              >
                Browse the shop
              </Link>
              <Link
                href="#custom-order"
                className="rounded-2xl bg-[#FF8B64] px-6 py-3 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition"
              >
                Start a custom order
              </Link>
            </div>
          </div>

          {showcase.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {showcase.map((p, i) => (
                <Link
                  key={p.id}
                  href={getProductPath(p)}
                  className={`group relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-black/40 ${
                    i % 2 === 1 ? "translate-y-6" : ""
                  }`}
                >
                  <Image
                    src={getProductImages(p)[0] || "/products/placeholder.jpg"}
                    alt={p.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8 text-xs font-semibold text-white/90">
                    {p.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* What we make */}
        <section className="mt-20 sm:mt-28">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">What we make</h2>
          <p className="mt-2 max-w-2xl text-white/60">
            Clean, durable FDM prints. If you&rsquo;re not sure what will work, we&rsquo;ll steer the design toward
            something that prints well and holds up.
          </p>
          <div className="mt-8 grid gap-10 sm:grid-cols-2">
            {[
              { title: "For people", items: FOR_PEOPLE },
              { title: "For businesses", items: FOR_BUSINESS },
            ].map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#FF8B64]">{group.title}</h3>
                <ul className="mt-3 divide-y divide-white/[0.08] border-y border-white/[0.08]">
                  {group.items.map((item) => (
                    <li key={item} className="py-3.5 text-base text-white/85">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* How we work */}
        <section className="mt-20 sm:mt-28 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">How we work</h2>
            <p className="mt-2 text-white/60">From a rough idea to a finished piece.</p>
          </div>
          <ol className="space-y-6">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-5">
                <span className="text-3xl font-extrabold leading-none text-white/15 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-semibold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/60">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <CustomOrderBand id="custom-order" className="mt-20 sm:mt-28 scroll-mt-28" />

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          <a
            href="https://instagram.com/creativedimensions.lb"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-white/75 hover:text-white transition"
          >
            <Instagram size={15} aria-hidden="true" /> @creativedimensions.lb
          </a>
          <a
            href="https://wa.me/96170304007"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-white/75 hover:text-white transition"
          >
            <MessageCircle size={15} aria-hidden="true" /> +961 70 304 007
          </a>
        </div>

        <div className="mt-14">
          <Footer />
        </div>
      </main>
    </div>
  );
}
