import Link from "next/link";
import Navbar from "../../components/Navbar";
import Background from "../../components/Background";
import { products } from "../../data/products";

export default function Page() {
  const keychains = products.filter((p) => p.category === "keychains");

  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-28 pb-16">
        <Link
          href="/Shop"
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition"
        >
          <span className="text-lg leading-none">←</span>
          Back to Shop
        </Link>

        <div className="mt-8">
          <h1 className="text-4xl font-semibold text-white">Keychains</h1>
          <p className="mt-2 text-white/70">Browse our keychains.</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {keychains.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
            >
              <div className="aspect-[4/3] w-full rounded-xl bg-white/5 border border-white/10" />

              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <div className="text-white font-semibold">{p.name}</div>
                  <div className="mt-1 text-sm text-white/60">
                    {p.description ?? "—"}
                  </div>
                </div>
                <div className="text-sm text-white/80">
                  {p.priceUSD ? `$${p.priceUSD}` : ""}
                </div>
              </div>

              <Link
                href={`/Shop/keychains/${p.slug}`}
                className="mt-4 block w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-center text-white/90 hover:bg-white/10 transition"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
