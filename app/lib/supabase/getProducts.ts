import { supabase } from "./clients";

export async function getProducts() {
  const { data, error } = await supabase
    .from("vanessa")
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data;
}