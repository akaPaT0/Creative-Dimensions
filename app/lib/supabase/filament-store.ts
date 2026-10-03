import "server-only";
import { supabaseAdmin } from "./admin";

export async function loadFilamentItems(): Promise<unknown[]> {
  const { data, error } = await supabaseAdmin.from("cd_filaments").select("record").order("id");
  if (error) throw new Error("Filaments are temporarily unavailable. Please try again.");
  return (data ?? []).map((row) => row.record);
}

export async function saveFilamentItem(item: { id: string }, create = false) {
  const table = supabaseAdmin.from("cd_filaments");
  const { data, error } = create
    ? await table.insert({ id: item.id, record: item }).select("id")
    : await table.update({ record: item }).eq("id", item.id).select("id");
  if (error) throw new Error("Could not save filament. Please try again.");
  return Boolean(data?.length);
}

export async function deleteFilamentItem(id: string) {
  const { data, error } = await supabaseAdmin.from("cd_filaments").delete().eq("id", id).select("id");
  if (error) throw new Error("Could not delete filament. Please try again.");
  return Boolean(data?.length);
}
