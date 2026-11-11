import { redirect } from "next/navigation";
import Link from "next/link";
import AdminShell, { type AdminSection } from "./AdminShell";
import AdminProductForm from "./AdminProductForm";
import AdminProductsManager from "./AdminProductsManager";
import AdminInsights from "./AdminInsights";
import AdminPromoCodes from "./AdminPromoCodes";
import AdminOrders from "./AdminOrders";
import AdminReviews from "./AdminReviews";
import { getSupabaseUserFromCookies } from "@/app/lib/supabase/auth-server";

type TabKey = Exclude<AdminSection, "filaments">;

function asTabKey(input: string | undefined): TabKey {
  if (
    input === "create" ||
    input === "catalog" ||
    input === "insights" ||
    input === "promocodes" ||
    input === "orders" ||
    input === "reviews"
  ) {
    return input;
  }
  return "orders";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const auth = await getSupabaseUserFromCookies();
  if ("response" in auth) redirect("/sign-in");
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = auth.email;
  const sp = await searchParams;

  if (!adminEmail || userEmail !== adminEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0D0D0D] px-6 text-center text-white">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">403</p>
          <h1 className="mt-2 text-2xl font-bold">This area is for the shop admin</h1>
          <p className="mt-2 text-sm text-white/55">You&rsquo;re signed in with an account that doesn&rsquo;t have access.</p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-[#FF8B64] px-5 py-2.5 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition"
          >
            Back to the store
          </Link>
        </div>
      </main>
    );
  }

  const tab = asTabKey(sp?.tab);

  return (
    <AdminShell
      active={tab}
      email={userEmail}
      actions={
        tab === "catalog" ? (
          <Link
            href="/admin?tab=create"
            className="inline-flex items-center justify-center rounded-xl bg-[#FF8B64] px-4 py-2.5 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition"
          >
            Add product
          </Link>
        ) : undefined
      }
    >
      {tab === "orders" && <AdminOrders />}
      {tab === "catalog" && <AdminProductsManager />}
      {tab === "create" && <AdminProductForm />}
      {tab === "insights" && <AdminInsights />}
      {tab === "promocodes" && <AdminPromoCodes />}
      {tab === "reviews" && <AdminReviews />}
    </AdminShell>
  );
}
