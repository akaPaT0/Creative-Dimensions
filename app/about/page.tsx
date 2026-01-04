import Navbar from "../components/Navbar";
import Background from "../components/Background";
import Footer from "../components/Footer";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen relative">
      <Background />
      <Navbar />

      <section className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 pt-28 pb-10">
        <div className="mx-auto w-full max-w-4xl text-center">
          <h1
            className="text-white font-semibold leading-tight text-center mt-2 tracking-tight
            text-5xl
            [text-shadow:0_0_25px_rgba(255,139,100,0.35)]"
            >
            About Creative Dimensions
          </h1>

          <p className="mt-5 text-white/75 text-base sm:text-xl leading-relaxed">
            Creative Dimensions is a Lebanon-based 3D printing studio where ideas
            become physical objects you can actually hold, use, gift, or display.
            We focus on clean design, solid print quality, and custom work that fits
            real use cases, not just “cool renders”.
          </p>

          <p className="mt-4 text-white/70 text-base sm:text-lg leading-relaxed">
            If you already have an STL file, perfect. If you don’t, you can send a
            photo, sketch, or reference and we’ll help you shape the plan. The goal
            is simple: choose the right size, material, and color, then print it
            with care so it comes out strong, clean, and satisfying.
          </p>

          {/* Feature cards */}
          <div className="mt-10 grid gap-4 sm:gap-5 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-white/90 font-semibold text-lg">
                Custom Prints
              </p>
              <p className="text-white/60 text-sm mt-2 leading-relaxed">
                Send a file or idea. We’ll help you lock down size, material, and
                how it should look and feel in real life.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-white/90 font-semibold text-lg">
                Product Drops
              </p>
              <p className="text-white/60 text-sm mt-2 leading-relaxed">
                Small prints that hit the sweet spot: keychains, desk pieces,
                gifts, and clean display items made to last.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-white/90 font-semibold text-lg">
                Design Help
              </p>
              <p className="text-white/60 text-sm mt-2 leading-relaxed">
                No STL yet? Send references and we’ll guide you through what’s
                possible and what will print well.
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-7 sm:p-10">
            <h2 className="text-white/90 font-semibold text-2xl sm:text-3xl">
              How it works
            </h2>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-white/85 font-medium">1) Send the idea</p>
                <p className="text-white/60 text-sm mt-2 leading-relaxed">
                  STL file, photo, sketch, or reference link. Anything that helps
                  us understand what you want.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-white/85 font-medium">2) Plan + quote</p>
                <p className="text-white/60 text-sm mt-2 leading-relaxed">
                  We confirm size, material, and color, then give you a clear
                  quote and estimated turnaround.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-white/85 font-medium">3) Print + finish</p>
                <p className="text-white/60 text-sm mt-2 leading-relaxed">
                  We print carefully, clean up the piece, and make sure it’s ready
                  for pickup or delivery.
                </p>
              </div>
            </div>
          </div>

          {/* What we print */}
          <div className="mt-12">
            <h2 className="text-white/90 font-semibold text-2xl sm:text-3xl">
              What we print
            </h2>

                        <p className="mt-4 text-white/70 text-base sm:text-lg leading-relaxed">
            We focus on clean, high-quality FDM prints that look great and feel solid in
            real life. If you’re not sure what works best for your idea, we’ll guide you
            toward a design that prints cleanly and holds up.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-white/85 font-medium">Popular requests</p>
                <ul className="mt-3 text-white/60 text-sm space-y-2">
                <li>• Keychains and name tags</li>
                <li>• Desk accessories and stands</li>
                <li>• Collectibles and display props</li>
                <li>• Custom gifts and event items</li>
                </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-white/85 font-medium">Print-friendly custom work</p>
                <ul className="mt-3 text-white/60 text-sm space-y-2">
                <li>• Simple holders, clips, and organizers</li>
                <li>• Personalized signs / logos / tags</li>
                <li>• Low-detail practical parts (when files are provided)</li>
                <li>• Small batches for brands and events</li>
                </ul>
                
            </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/96170304007?text=Hey!%20I%E2%80%99m%20interested%20in%20a%20custom%203D%20print.%20I%20can%20send%20the%20file%20or%20a%20photo%20of%20the%20idea.%20What%20details%20do%20you%20need,%20and%20what%20size%20should%20it%20be%3F"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3 rounded-2xl border border-white/20 bg-white/5 text-white text-base sm:text-lg hover:bg-white/10 transition text-center"
            >
              Request a Custom
            </a>

            <Link
              href="/shop"
              className="px-7 py-3 rounded-2xl border border-white/20 bg-transparent text-white/80 text-base sm:text-lg hover:bg-white/10 transition text-center"
            >
              Browse Products
            </Link>
          </div>

          {/* Contact */}
          <div className="mt-10 text-white/55 text-sm">
            <p>
              Instagram:{" "}
              <a
                href="https://instagram.com/creativedimensions.lb"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white transition"
              >
                @creativedimensions.lb
              </a>
            </p>
            <p className="mt-1">WhatsApp / Call: +961 70 304 007</p>
          </div>
        </div>

        <div className="mt-14">
          <Footer />
        </div>
      </section>
    </main>
  );
}
