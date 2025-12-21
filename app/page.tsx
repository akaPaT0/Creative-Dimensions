import Link from "next/link";
import Background from "./components/Background";
import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen relative">
      <Navbar />
      <Background />

      {/* HERO - Mobile (full screen, centered, bigger text, title forced 1-line) */}
<section className="relative z-10 flex min-h-screen items-center pt-32 pb-8 lg:hidden">
  <div className="mx-auto max-w-7xl px-6 w-full">
    <div className="mx-auto max-w px-3 sm:px-8">
      <div className="p-8 text-center">
        <h2
          className="text-white font-semibold leading-tight text-center whitespace-nowrap
            text-[42px] sm:text-6xl mt-2"
        >
          What we do
        </h2>

        <p className="text-white/75 mt-6 text-center text-[20px] sm:text-2xl">
          3D printed products and parts.
        </p>

        <p className="text-white/75 mt-3 text-center text-[20px] sm:text-2xl">
          Browse the shop or reach out for custom work.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row justify-center gap-4 sm:gap-10">
          <Link
            href="/shop"
            className="px-7 py-4 sm:px-8 sm:py-4 rounded-2xl border border-white/20 bg-white/5 text-white
              text-[20px] sm:text-2xl hover:bg-white/10 transition"
          >
            Shop
          </Link>

          <Link
            href="/contact"
            className="px-7 py-4 sm:px-8 sm:py-4 rounded-2xl border border-white/20 bg-white/5 text-white
              text-[20px] sm:text-2xl hover:bg-white/20 transition"
          >
            Contact
          </Link>
        </div>
      </div>
    </div>
  </div>
</section>


      {/* HERO - PC (full screen) */}
      <section className="relative z-10 hidden lg:flex lg:h-screen lg:items-center lg:pt-0">
        <div className="mx-auto max-w-7xl px-6 w-full">
          <div className="mx-auto max-w px-10">
            <div className="p-8 text-center">
              <h2 className="text-white font-semibold leading-tight text-center lg:text-[100px]">
                What we do
              </h2>

              <p className="text-white/75 mt-3 text-center lg:text-[50px]">
                3D printed products and parts.
              </p>

              <p className="text-white/75 mt-2 text-center lg:text-[50px]">
                Browse the shop or reach out for custom work.
              </p>

              <div className="mt-6 flex justify-center gap-10">
                <Link
                  href="/shop"
                  className="px-7 py-3 rounded-xl border border-white/20 bg-white/5 text-white
                    lg:text-[30px] hover:bg-white/10 transition"
                >
                  Shop
                </Link>

                <Link
                  href="/contact"
                  className="px-7 py-3 rounded-xl border border-white/20 bg-white/5 text-white
                    lg:text-[30px] hover:bg-white/20 transition"
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rest of page (scroll) */}
      <section className="relative z-10 pb-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
