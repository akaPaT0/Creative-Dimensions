import Background from "@/app/components/Background";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import LinkCard from "@/app/components/LinkCard";
import { savedLinks } from "@/app/data/links";

export default function LinksPage() {
  return (
    <main className="relative min-h-screen text-white">
      <Background />
      <Navbar />

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-28">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-white/50">
            Saved Links
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            My Useful Links
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/65 sm:text-base">
            A clean place to keep the websites you want to come back to.
          </p>
        </div>

        {savedLinks.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
            No links added yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {savedLinks.map((link) => (
              <LinkCard
                key={link.url}
                title={link.title}
                description={link.description}
                url={link.url}
              />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}