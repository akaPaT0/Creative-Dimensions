// app/Shop/page.tsx
import Navbar from "../components/Navbar";
import Background from "../components/Background";
import Link from "next/link";

export default function Shop() {
  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-28 pb-16">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-white">Shop</h1>
            <p className="mt-2 text-white/70">
              Prints, parts, and digital files built with the Creative Dimensions vibe.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/contact"
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-white/90 hover:bg-white/10 transition"
            >
              Custom Request
            </Link>
            <button
              className="rounded-xl bg-[#FF8B64] px-5 py-2.5 font-medium text-black hover:opacity-90 transition"
              type="button"
            >
              Browse All
            </button>
          </div>
        </div>

        {/* Quick categories */}
       <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { title: "New Arrivals", desc: "Fresh drops and latest uploads.", href: "/shop/new-arrivals" },
            { title: "Keychains", desc: "Clean, custom, gift-ready.", href: "/shop/keychains" },
            { title: "Tools", desc: "Maker essentials and workshop gear.", href: "/shop/tools" },
            { title: "Accessories", desc: "Upgrades, add-ons, extras.", href: "/shop/accessories" },
            { title: "Fanboys", desc: "Fandom prints and fun stuff.", href: "/shop/fanboys" },
          ].map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
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

        {/* Featured section */}
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-white">Featured</h2>
            <p className="text-sm text-white/60">
              Handpicked drops, limited runs, and best-sellers.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="group rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-black/30 transition"
              >
                <div className="aspect-[4/3] w-full rounded-xl bg-white/5 border border-white/10" />
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-white font-semibold">Product {i}</div>
                    <div className="mt-1 text-sm text-white/60">
                      Short product description goes here.
                    </div>
                  </div>
                  <div className="text-white/80 text-sm">USD</div>
                </div>

                <button
                  type="button"
                  className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-white/90 hover:bg-white/10 transition"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-10 text-center text-sm text-white/50">
          Want something specific? Hit <span className="text-white/80">Custom Request</span>.
        </div>
      </main>
    </div>
  );
}
