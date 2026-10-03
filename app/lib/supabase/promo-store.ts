import "server-only";
import { supabaseAdmin } from "./admin";
import { normalizePromoRecords, type PromoCodeRecord } from "../promocodes";

export async function loadPromos(): Promise<PromoCodeRecord[]> {
  const { data, error } = await supabaseAdmin.from("cd_promo_codes").select("record").order("code");
  if (error) throw new Error("Promo codes are temporarily unavailable. Please try again.");
  return normalizePromoRecords((data ?? []).map((row) => row.record));
}

export async function insertPromo(promo: PromoCodeRecord) {
  const { error } = await supabaseAdmin.from("cd_promo_codes").insert({ code: promo.code, record: promo });
  if (error?.code === "23505") return false;
  if (error) throw new Error("Could not save promo code. Please try again.");
  return true;
}

export async function updatePromo(promo: PromoCodeRecord) {
  const { data, error } = await supabaseAdmin.from("cd_promo_codes")
    .update({ record: promo }).eq("code", promo.code).select("code");
  if (error) throw new Error("Could not save promo code. Please try again.");
  return Boolean(data?.length);
}

export async function deletePromo(code: string) {
  const { data, error } = await supabaseAdmin.from("cd_promo_codes").delete().eq("code", code).select("code");
  if (error) throw new Error("Could not delete promo code. Please try again.");
  return Boolean(data?.length);
}
