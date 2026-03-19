import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";
import { getProducts, type VanessaProduct } from "../lib/supabase/getProducts";
import VanessaCatalogClient from "./VanessaCatalogClient";

export default async function Page() {
  const products: VanessaProduct[] = await getProducts();

  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-center sm:text-left">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10 transition"
            >
              <ChevronLeft size={16} strokeWidth={2.25} />
              Back to Shop
            </Link>

            <h1 className="mt-6 text-4xl font-semibold text-white">Vanessa</h1>
            <p className="mt-2 text-white/70">
              Browse all products from the Vanessa Supabase table.
            </p>
          </div>
        </div>

        <VanessaCatalogClient products={products} />

        <Footer />
      </main>
    </div>
  );
}
