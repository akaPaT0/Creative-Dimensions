import { Star } from "lucide-react";
import type { PublicReview } from "@/app/lib/reviews";

export function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          width={size}
          height={size}
          strokeWidth={1.5}
          className={n <= rating ? "fill-[#FF8B64] text-[#FF8B64]" : "text-white/20"}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });

/** Slim card for the moving home page strip: three lines of text, details on one line. */
export function CompactReviewCard({ review }: { review: PublicReview }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#141417]/90 px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <Stars rating={review.rating} size={13} />
        <span className="text-[11px] text-white/35">{dateFormat.format(new Date(review.createdAt))}</span>
      </div>
      <blockquote className="mt-2 line-clamp-3 flex-1 text-[13px] leading-snug text-white/75">
        {review.comment.replace(/\s*\n+\s*/g, " ")}
      </blockquote>
      <figcaption className="mt-2.5 truncate text-xs">
        <span className="font-semibold text-white">{review.name}</span>
        {review.product && <span className="text-white/40"> · {review.product}</span>}
      </figcaption>
    </figure>
  );
}

export default function ReviewCard({ review, clamp = false }: { review: PublicReview; clamp?: boolean }) {
  return (
    <figure className="flex h-full flex-col rounded-3xl border border-white/10 bg-[#141417]/90 p-5 sm:p-6">
      <Stars rating={review.rating} />
      <blockquote
        className={`mt-3 flex-1 whitespace-pre-line text-sm leading-relaxed text-white/80 ${clamp ? "line-clamp-6" : ""}`}
      >
        {review.comment}
      </blockquote>
      <figcaption className="mt-4 text-sm">
        <span className="font-semibold text-white">{review.name}</span>
        {review.product && <span className="text-white/45"> · {review.product}</span>}
        <span className="block text-xs text-white/35">{dateFormat.format(new Date(review.createdAt))}</span>
      </figcaption>
    </figure>
  );
}
