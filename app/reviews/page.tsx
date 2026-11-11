import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";
import ReviewCard, { Stars } from "../components/ReviewCard";
import { loadApprovedReviews } from "@/app/lib/supabase/review-store";

// Approving or removing a review in admin refreshes this page immediately.
export const revalidate = 3600;

export default async function ReviewsPage() {
  const reviews = await loadApprovedReviews(200);
  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <div className="relative min-h-screen text-white">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Customer reviews</h1>
            {reviews.length > 0 ? (
              <p className="mt-2 flex items-center gap-2 text-sm sm:text-base text-white/60">
                <Stars rating={Math.round(average)} size={18} />
                <span>
                  {average.toFixed(1)} out of 5 from {reviews.length} review{reviews.length > 1 ? "s" : ""}
                </span>
              </p>
            ) : (
              <p className="mt-2 text-sm sm:text-base text-white/60">No reviews yet. Be the first!</p>
            )}
          </div>
          <Link
            href="/review"
            className="inline-flex shrink-0 justify-center rounded-xl bg-[#FF8B64] px-5 py-2.5 text-sm font-bold text-[#0D0D0D] transition hover:bg-[#ffa282]"
          >
            Leave a review
          </Link>
        </div>

        {reviews.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}

        <div className="mt-14">
          <Footer />
        </div>
      </main>
    </div>
  );
}
