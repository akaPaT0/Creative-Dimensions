import "server-only";
import { supabaseAdmin } from "./admin";
import { displayName, type AdminReview, type PublicReview, type ReviewInput, type ReviewStatus } from "../reviews";

const TABLE = "cd_reviews";

type Row = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  product: string;
  order_ref: string;
  status: ReviewStatus;
  created_at: string;
  approved_at: string | null;
};

function toAdmin(row: Row): AdminReview {
  return {
    id: row.id,
    name: row.name,
    rating: row.rating,
    comment: row.comment,
    product: row.product,
    orderRef: row.order_ref,
    status: row.status,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
  };
}

export async function insertReview(review: ReviewInput) {
  const { error } = await supabaseAdmin.from(TABLE).insert({
    name: review.name,
    rating: review.rating,
    comment: review.comment,
    product: review.product,
    order_ref: review.orderRef,
  });
  if (error) {
    console.error("Review insert failed:", error);
    throw new Error("Could not save your review. Please try again.");
  }
}

/** Approved reviews only, with surnames shortened. Never throws; the site just shows none. */
export async function loadApprovedReviews(limit = 60): Promise<PublicReview[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("id,name,rating,comment,product,created_at")
      .eq("status", "approved")
      .order("approved_at", { ascending: false, nullsFirst: false })
      .limit(limit);
    if (error) throw error;
    return ((data ?? []) as Row[]).map((row) => ({
      id: row.id,
      name: displayName(row.name),
      rating: row.rating,
      comment: row.comment,
      product: row.product,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error("Loading reviews failed:", error);
    return [];
  }
}

export async function loadAllReviews(): Promise<AdminReview[]> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error("Reviews are temporarily unavailable. Please try again.");
  return ((data ?? []) as Row[]).map(toAdmin);
}

export async function setReviewStatus(id: string, status: ReviewStatus) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ status, approved_at: status === "approved" ? new Date().toISOString() : null })
    .eq("id", id)
    .select("id");
  if (error) throw new Error("Could not update the review. Please try again.");
  return Boolean(data?.length);
}

export async function deleteReview(id: string) {
  const { data, error } = await supabaseAdmin.from(TABLE).delete().eq("id", id).select("id");
  if (error) throw new Error("Could not delete the review. Please try again.");
  return Boolean(data?.length);
}
