import Link from "next/link";
import Background from "./components/Background";
import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen relative ">
      <Navbar />
      <Background />

      {/* Content */}
      <section className="relative z-10 pt-28 pb-12">
        <div className="mx-auto max-w-7xl px-6">
          {/* Frosted block */}
          <div className="mx-auto max-w px-6">
            <div className="p-8 text-center">
              <h2 className="text-white font-semibold leading-tight text-center
                text-4xl sm:text-5xl lg:text-[100px]">
                What we do
              </h2>

              <p className="text-white/75 mt-3 text-center
                text-base sm:text-lg lg:text-[50px]">
                3D printing products, parts, and support.
              </p>

              <p className="text-white/75 mt-2 text-center
                text-base sm:text-lg lg:text-[50px]">
                Browse the shop or reach out for custom work.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3 sm:gap-10">
                <Link
                  href="/shop"
                  className="px-5 py-3 sm:px-7 sm:py-3 rounded-xl border border-white/20 bg-white/5 text-white
                    text-base sm:text-lg lg:text-[30px] hover:bg-white/10 transition"
                >
                  Shop
                </Link>

                <Link
                  href="/contact"
                  className="px-5 py-3 sm:px-7 sm:py-3 rounded-xl border border-white/20 bg-white/5 text-white
                    text-base sm:text-lg lg:text-[30px] hover:bg-white/20 transition"
                >
                  Contact
                </Link>
              </div>

            </div>
          </div>

          {/* Cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Printers", desc: "FDM and resin options for every workflow." },
              { title: "Filament & Resin", desc: "Materials that print clean and consistent." },
              { title: "Accessories", desc: "Nozzles, beds, parts, upgrades, and more." },
              { title: "Repairs", desc: "Diagnostics, calibration, and maintenance." },
              { title: "Training", desc: "From basics to advanced slicing and tuning." },
              { title: "Custom Prints", desc: "Bring an idea, we’ll make it real." },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-5"
              >
                <div className="h-28 rounded-xl border border-white/10 bg-white/5" />
                <div className="mt-4 text-white font-medium">{item.title}</div>
                <div className="mt-1 text-white/70 text-sm">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
