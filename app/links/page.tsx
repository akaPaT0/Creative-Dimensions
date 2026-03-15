import Background from "@/app/components/Background";
import LinkCard from "@/app/components/LinkCard";
import { savedLinks } from "@/app/data/links";

export default function LinksPage() {
  return (
    <main className="relative min-h-screen text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-16 sm:pt-20">
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
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60 backdrop-blur-md">
            No links added yet.
          </div>
        ) : (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
            {savedLinks.map((link) => (
              <div key={link.url} className="mb-5 break-inside-avoid">
                <LinkCard
                  title={link.title}
                  description={link.description}
                  url={link.url}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}