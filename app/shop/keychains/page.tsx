import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Background from "../../components/Background";
import { getShopProducts as getProducts } from "../../lib/products-db";
import CategoryProductsClient from "../CategoryProductsClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const products = await getProducts();
  const keychains = products.filter((p) => p.category === "keychains");
  const hasAnySubCats = keychains.some((p) => Boolean(p.subCategory));
  const list = hasAnySubCats
    ? keychains.filter((p) => Boolean(p.subCategory))
    : keychains;

  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-28 pb-16">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition"
        >
          <ChevronLeft size={16} strokeWidth={2.25} />
          Back to Shop
        </Link>

        <div className="mt-8">
          <h1 className="text-4xl font-semibold text-white">Keychains</h1>
          <p className="mt-2 text-white/70">Browse our keychains.</p>
        </div>

        <CategoryProductsClient products={list} category="keychains" />

        <Footer />
      </main>
    </div>
  );
}
