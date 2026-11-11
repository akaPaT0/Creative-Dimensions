// Shared review types and validation (safe for client and server).

export type ReviewStatus = "pending" | "approved" | "hidden";

export type PublicReview = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  product: string;
  createdAt: string;
};

export type AdminReview = PublicReview & {
  orderRef: string;
  status: ReviewStatus;
  approvedAt: string | null;
};

export const REVIEW_LIMITS = {
  name: 60,
  commentMin: 10,
  comment: 1200,
  product: 120,
  orderRef: 40,
};

export type ReviewInput = {
  name: string;
  rating: number;
  comment: string;
  product: string;
  orderRef: string;
};

function clean(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  // Collapse control characters, keep newlines in comments readable.
  return value.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "").trim().slice(0, max);
}

export function parseReviewInput(body: unknown): { ok: true; review: ReviewInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid request." };
  const b = body as Record<string, unknown>;

  const name = clean(b.name, REVIEW_LIMITS.name).replace(/\s+/g, " ");
  const comment = clean(b.comment, REVIEW_LIMITS.comment).replace(/\n{3,}/g, "\n\n");
  const product = clean(b.product, REVIEW_LIMITS.product).replace(/\s+/g, " ");
  const orderRef = clean(b.orderRef, REVIEW_LIMITS.orderRef).replace(/\s+/g, "");
  const rating = typeof b.rating === "number" ? b.rating : Number(b.rating);

  if (!name) return { ok: false, error: "Please add your name." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Please pick a star rating." };
  }
  if (comment.length < REVIEW_LIMITS.commentMin) {
    return { ok: false, error: `Please write at least ${REVIEW_LIMITS.commentMin} characters.` };
  }
  if (/https?:\/\/|www\./i.test(comment) || /https?:\/\/|www\./i.test(name)) {
    return { ok: false, error: "Please leave out links." };
  }

  return { ok: true, review: { name, rating, comment, product, orderRef } };
}

/** "Patrick Haddad" -> "Patrick H." so full surnames aren't published. */
export function displayName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] || "Customer";
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}
