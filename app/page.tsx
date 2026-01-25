import Link from "next/link";
import Background from "./components/Background";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Reveal from "./components/Reveal";
import HeroIn from "./components/HeroIn";
import CustomRequestModal from "./components/CustomRequestModal";

export default function Home() {
  return (
    <main className="min-h-screen relative">
      <Navbar />
      <Background />

      {/* HERO - Mobile */}
      <section className="relative z-10 lg:hidden">
        <div className="flex min-h-[100svh] items-center pt-24 pb-10">
          <div className="mx-auto max-w-7xl px-6 w-full">
            <div className="mx-auto max-w px-3 sm:px-8">
              <div className="p-8 text-center">
                <HeroIn>
                  <div>
                    <h2
                      className="text-white font-semibold leading-tight text-center whitespace-nowrap
                        text-[42px] sm:text-6xl mt-2
                        [text-shadow:0_0_25px_rgba(255,139,100,0.35)]"
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

                    {/* ✅ Custom Request button under Shop/Contact (same spacing) */}
                    <div className="mt-4 sm:mt-10 flex justify-center">
                      <CustomRequestModal
                        productName="Custom Order"
                        productUrl="https://creative-dimensions.vercel.app"
                        className="px-7 py-4 sm:px-8 sm:py-4 rounded-2xl border border-white/20 bg-white/5 text-white
                          text-[20px] sm:text-2xl hover:bg-white/10 transition text-center"
                      />
                    </div>

                    {/* Divider (mobile) */}
                    <div className="relative z-10 flex justify-center pt-10 pb-2">
                      <div className="h-[3px] w-36 sm:w-56 rounded-full bg-[#FF8B64]/55 shadow-[0_0_22px_rgba(255,139,100,0.30)]" />
                    </div>
                  </div>
                </HeroIn>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HERO - PC */}
      <section className="relative z-10 hidden lg:flex lg:min-h-[100svh] lg:items-center lg:pt-24 lg:pb-10 hero-in">
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

                <div className="mt-10 flex justify-center gap-10">
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

                {/* ✅ Custom Request button under Shop/Contact */}
                <div className="mt-6 flex justify-center">
                  <CustomRequestModal
                    productName="Custom Order"
                    productUrl="https://creative-dimensions.vercel.app"
                    className="w-[460px] px-7 py-3 rounded-xl border border-white/20 bg-white/5 text-white
                      lg:text-[30px] hover:bg-white/10 transition text-center"
                  />
                </div>
              </div>

              {/* Divider (pc) */}
              <div className="relative z-10 flex justify-center pt-40 pb-2">
                <div className="h-[3px] w-[520px] rounded-full bg-[#FF8B64]/55 shadow-[0_0_22px_rgba(255,139,100,0.30)]" />
              </div>
            </div>
          </div>
        </HeroIn>
      </section>

      {/* Rest of page (scroll) */}
      <section className="relative z-10 pt-12 pb-12">
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

                  <div className="mt-4 text-white/70 text-sm leading-relaxed line-clamp-2">
                    {item.desc}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="relative z-10 flex justify-center pt-12 pb-12">
        <div className="h-[3px] w-36 sm:w-56 lg:w-[500px] rounded-full bg-[#FF8B64]/55 shadow-[0_0_22px_rgba(255,139,100,0.30)]" />
      </div>

      {/* Why us */}
      <section className="relative z-10 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="text-white font-semibold text-3xl sm:text-4xl [text-shadow:0_0_20px_rgba(255,139,100,0.25)]">
              Why Creative Dimensions
            </h3>
            <p className="mt-3 text-white/70 text-base sm:text-lg">
              Clean prints, clear timelines, and a finish you’ll actually want to keep.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl space-y-4">
            {[
              {
                t: "Clean, consistent finish",
                d: "Dialed settings and careful post-processing for a premium look.",
              },
              {
                t: "Clear turnaround times",
                d: "We tell you the ETA up front and stick to it.",
              },
              {
                t: "Local delivery in Lebanon",
                d: "Pickup or delivery with safe packaging and updates.",
              },
            ].map((x) => (
              <div
                key={x.t}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 p-5"
              >
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#FF8B64] shadow-[0_0_18px_rgba(255,139,100,0.35)]" />
                <div>
                  <div className="text-white font-semibold">{x.t}</div>
                  <div className="mt-1 text-white/70 text-sm leading-relaxed">{x.d}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <CustomRequestModal
              className="px-7 py-3 rounded-2xl border border-white/20 bg-white/5 text-white text-base sm:text-lg hover:bg-white/10 transition text-center"
              productName="Custom Order"
              productUrl="https://creative-dimensions.vercel.app"
            />

            <Link
              href="/shop"
              className="px-7 py-3 rounded-2xl border border-white/20 bg-white/5 text-white text-base sm:text-lg hover:bg-white/20 transition text-center"
            >
              Browse Shop
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
