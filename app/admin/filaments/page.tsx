import { redirect } from "next/navigation";
import AdminShell from "../AdminShell";
import FilamentsManager from "./FilamentsManager";
import { getSupabaseUserFromCookies } from "@/app/lib/supabase/auth-server";

export default async function AdminFilamentsPage() {
  const auth = await getSupabaseUserFromCookies();
  if ("response" in auth) redirect("/sign-in");
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = auth.email;

  if (!adminEmail || userEmail !== adminEmail) redirect("/admin");

  return (
    <AdminShell active="filaments" email={userEmail}>
      <FilamentsManager />
    </AdminShell>
  );
}
