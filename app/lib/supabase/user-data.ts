import { supabaseAdmin } from "@/app/lib/supabase/admin";

type CollectionTable = "user_likes" | "user_wishlist";

export async function getProductCollection(userId: string, table: CollectionTable) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select("product_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => String(row.product_id));
}

export async function addProductToCollection(
  userId: string,
  table: CollectionTable,
  productId: string
) {
  const { error } = await supabaseAdmin
    .from(table)
    .upsert({ user_id: userId, product_id: productId }, { onConflict: "user_id,product_id" });

  if (error) throw error;
}

export async function removeProductFromCollection(
  userId: string,
  table: CollectionTable,
  productId: string
) {
  const { error } = await supabaseAdmin
    .from(table)
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) throw error;
}
