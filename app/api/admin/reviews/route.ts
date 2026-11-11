import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireSupabaseAdmin } from "@/app/lib/supabase/auth-server";
import { deleteReview, loadAllReviews, setReviewStatus } from "@/app/lib/supabase/review-store";
import type { ReviewStatus } from "@/app/lib/reviews";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function refreshPublicPages() {
  revalidatePath("/");
  revalidatePath("/reviews");
}

export async function GET(req: Request) {
  try {
    const admin = await requireSupabaseAdmin(req);
    if ("response" in admin) return admin.response;
    return json({ reviews: await loadAllReviews() });
  } catch (error) {
    console.error("Admin reviews request failed:", error);
    return json({ error: error instanceof Error ? error.message : "Reviews are temporarily unavailable." }, 503);
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireSupabaseAdmin(req);
    if ("response" in admin) return admin.response;
    const body = (await req.json().catch(() => null)) as { id?: string; status?: string } | null;
    const id = typeof body?.id === "string" ? body.id : "";
    const status = body?.status as ReviewStatus;
    if (!UUID.test(id)) return json({ error: "Review id is required" }, 400);
    if (!["pending", "approved", "hidden"].includes(status)) return json({ error: "Invalid status" }, 400);
    if (!(await setReviewStatus(id, status))) return json({ error: "Review not found" }, 404);
    refreshPublicPages();
    return json({ ok: true });
  } catch (error) {
    console.error("Admin reviews request failed:", error);
    return json({ error: error instanceof Error ? error.message : "Reviews are temporarily unavailable." }, 503);
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await requireSupabaseAdmin(req);
    if ("response" in admin) return admin.response;
    const body = (await req.json().catch(() => null)) as { id?: string } | null;
    const id = typeof body?.id === "string" ? body.id : "";
    if (!UUID.test(id)) return json({ error: "Review id is required" }, 400);
    if (!(await deleteReview(id))) return json({ error: "Review not found" }, 404);
    refreshPublicPages();
    return json({ ok: true });
  } catch (error) {
    console.error("Admin reviews request failed:", error);
    return json({ error: error instanceof Error ? error.message : "Reviews are temporarily unavailable." }, 503);
  }
}
