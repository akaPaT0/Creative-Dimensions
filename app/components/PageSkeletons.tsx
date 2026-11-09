import Navbar from "./Navbar";
import Background from "./Background";

/** Pulsing placeholder block. */
function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.07] ${className}`} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen text-white" aria-busy="true" aria-live="polite">
      <Background />
      <Navbar />
      <main className="relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 xl:px-14 pt-28 sm:pt-32 pb-16">
        <span className="sr-only">Loading…</span>
        {children}
      </main>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#161619]/90 p-2.5 sm:p-3">
      <Bone className="aspect-square w-full" />
      <Bone className="mt-3 h-2.5 w-1/3" />
      <Bone className="mt-2 h-3.5 w-4/5" />
      <Bone className="mt-3 h-3.5 w-1/4" />
    </div>
  );
}

/** Loading state shaped like a product page. */
export function ProductPageSkeleton() {
  return (
    <Shell>
      <Bone className="h-3.5 w-56" />
      <div className="mt-4 sm:mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10">
        <div>
          <Bone className="aspect-square w-full rounded-3xl" />
          <div className="mt-3 hidden gap-2.5 md:flex">
            {Array.from({ length: 5 }, (_, i) => (
              <Bone key={i} className="h-20 w-20" />
            ))}
          </div>
        </div>
        <div className="lg:py-2">
          <Bone className="h-3 w-24" />
          <Bone className="mt-3 h-10 w-4/5 sm:h-12" />
          <div className="mt-4 flex items-center justify-between">
            <Bone className="h-8 w-20" />
            <div className="flex gap-2">
              <Bone className="h-10 w-10" />
              <Bone className="h-10 w-10" />
              <Bone className="h-10 w-10" />
            </div>
          </div>
          <div className="mt-6 space-y-2.5">
            <Bone className="h-3.5 w-full" />
            <Bone className="h-3.5 w-11/12" />
            <Bone className="h-3.5 w-3/4" />
          </div>
          <Bone className="mt-8 h-12 w-full rounded-2xl" />
          <Bone className="mt-3 h-12 w-full rounded-2xl" />
          <Bone className="mt-4 h-3.5 w-48" />
        </div>
      </div>
      <Bone className="mt-16 h-6 w-40" />
      <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-4 sm:gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={i >= 2 ? "hidden sm:block" : ""}>
            <CardSkeleton />
          </div>
        ))}
      </div>
    </Shell>
  );
}

/** Loading state shaped like a category or shop listing. */
export function ListingPageSkeleton({ withChips = true }: { withChips?: boolean }) {
  return (
    <Shell>
      <Bone className="h-3.5 w-32" />
      <Bone className="mt-4 h-10 w-56 sm:h-12" />
      <Bone className="mt-3 h-4 w-80 max-w-full" />
      {withChips && (
        <div className="mt-6 flex gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Bone key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      )}
      <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
        {Array.from({ length: 8 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </Shell>
  );
}
