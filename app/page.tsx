import Link from "next/link";
import Background from "./components/Background";
import Navbar from "./components/Navbar";
import Reveal from "./components/Reveal";
import HeroIn from "./components/HeroIn";

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
              <HeroIn>
                <div>
                  <h2
                    className="text-white font-semibold leading-tight text-center whitespace-nowrap
                      text-[42px] sm:text-6xl mt-2 [text-shadow:0_0_25px_rgba(255,139,100,0.35)]"
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
              </HeroIn>
            </div>
          </div>
        </div>
      </section>

      {/* HERO - PC (full screen) */}
      <section className="relative z-10 hidden lg:flex lg:h-screen lg:items-center lg:pt-0 hero-in">
        <HeroIn>
          <div className="mx-auto max-w-7xl px-6 w-full">
            <div className="mx-auto max-w px-10">
              <div className="p-8 text-center">
                <h2 className="text-white font-semibold leading-tight text-center lg:text-[100px] [text-shadow:0_0_25px_rgba(255,139,100,0.35)]">
                  What we do
                </h2>

                <p className="text-white/75 mt-3 text-center lg:text-[50px]">
                  3D printed products and parts.
                </p>

                <p className="text-white/75 mt-2 text-center lg:text-[50px]">
                  Browse the shop or reach out for custom work.
                </p>

                <div className="mt-6 flex justify-center gap-10">
                  <div className="mt-6 flex justify-center gap-10">
                    <Link
                      href="/shop"
                      className="w-[220px] px-7 py-3 rounded-xl border border-white/20 bg-white/5 text-white
                        lg:text-[30px] hover:bg-white/10 transition text-center"
                    >
                      Shop
                    </Link>

                    <Link
                      href="/contact"
                      className="w-[220px] px-7 py-3 rounded-xl border border-white/20 bg-white/5 text-white
                        lg:text-[30px] hover:bg-white/20 transition text-center"
                    >
                      Contact
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </HeroIn>
      </section>

      {/* Rest of page (scroll) */}
      <section className="relative z-10 pb-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Featured Picks",
                desc: "Curated designs we recommend first. Clean, reliable, giftable.",
              },
              {
                title: "New Drops",
                desc: "Fresh designs added regularly. Sometimes limited runs.",
              },
              {
                title: "Custom Orders",
                desc: "Send an idea, photo, or sketch. We design, print, and finish.",
              },
              {
                title: "Customization",
                desc: "Names, sizes, small tweaks. Made for you.",
              },
              {
                title: "Quality Promise",
                desc: "Calibrated machines, clean layers, consistent fit and finish.",
              },
              {
                title: "Delivery in Lebanon",
                desc: "Pickup or delivery. Clear timelines and safe packaging.",
              },
            ].map((item, i) => (
              <Reveal key={item.title} delayMs={i * 80}>
                <div
                  className="h-[230px] flex flex-col rounded-2xl border border-white/10 bg-white/5
                    backdrop-blur-xl backdrop-saturate-150 p-5
                    transition-transform duration-200 ease-out
                    hover:scale-[1.02] active:scale-[0.99]"
                >
                  {/* Thumbnail with centered title */}
                  <div className="h-28 rounded-xl border border-white/10 bg-white/5 relative overflow-hidden flex items-center justify-center">
                    <div
                      className="absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl opacity-60"
                      style={{ background: "#FF8B64" }}
                    />
                    <div
                      className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full blur-2xl opacity-50"
                      style={{ background: "#3BC7C4" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
                    <div className="relative px-4 text-center">
                      <div className="text-white font-semibold text-[18px] sm:text-[19px]">
                        {item.title}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-4 text-white/70 text-sm leading-relaxed line-clamp-2">
                    {item.desc}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
