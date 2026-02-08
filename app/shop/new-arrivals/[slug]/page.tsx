import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Background from "../../../components/Background";
import { products } from "../../../data/products";

function normalize(s: string) {
  return decodeURIComponent(s).trim().toLowerCase();
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = normalize(rawSlug);

  const matches = (products as any[]).filter(
    (p) => p?.slug && normalize(String(p.slug)) === slug
  );

  // If exactly one match, redirect to the real product route
  if (matches.length === 1) {
    const p = matches[0];
    redirect(`/shop/${p.category}/${encodeURIComponent(p.slug)}`);
  }

  // If not found or multiple (rare), show a small resolver page
  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-[1480px] px-6 lg:px-8 pt-24 pb-16 text-white">
        <Link
          href="/shop/new-arrivals"
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition"
        >
          <span className="text-lg leading-none">←</span>
          Back to New Arrivals
        </Link>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-6">
          {matches.length === 0 ? (
            <div className="text-white/80">Not found.</div>
          ) : (
            <div>
              <div className="text-white/80">
                Multiple items share this slug. Choose one:
              </div>

              <div className="mt-4 grid gap-3">
                {matches.map((p: any) => (
                  <Link
                    key={`${p.category}-${p.slug}-${p.id ?? "x"}`}
                    href={`/shop/${p.category}/${encodeURIComponent(p.slug)}`}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 hover:bg-white/10 transition"
                  >
                    <div className="text-white font-semibold">{p.name}</div>
                    <div className="text-white/60 text-sm capitalize">{p.category}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
}
