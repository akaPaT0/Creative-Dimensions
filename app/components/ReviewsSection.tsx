import Link from "next/link";
import { loadApprovedReviews } from "@/app/lib/supabase/review-store";
import ReviewCard, { Stars } from "./ReviewCard";

/** Homepage strip of the latest approved reviews. Renders nothing until at least one is approved. */
export default async function ReviewsSection({ className = "" }: { className?: string }) {
  const reviews = await loadApprovedReviews(60);
  if (!reviews.length) return null;

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const latest = reviews.slice(0, 6);

  return (
    <section id="reviews" className={className} aria-labelledby="reviews-heading">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="reviews-heading" className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            What customers say
          </h2>
          <p className="mt-1.5 flex items-center gap-2 text-sm text-white/60">
            <Stars rating={Math.round(average)} />
            <span>
              {average.toFixed(1)} from {reviews.length} review{reviews.length > 1 ? "s" : ""}
            </span>
          </p>
        </div>
        <div className="flex gap-3 text-sm font-semibold">
          <Link href="/reviews" className="text-white/60 transition hover:text-white">
            All reviews →
          </Link>
          <Link href="/review" className="text-[#FF8B64] transition hover:text-[#ffa282]">
            Leave a review
          </Link>
        </div>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {latest.map((review) => (
          <div key={review.id} className="w-[85%] shrink-0 snap-start sm:w-auto">
            <ReviewCard review={review} clamp />
          </div>
        ))}
      </div>
    </section>
  );
}
