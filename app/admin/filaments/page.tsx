import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Background from "@/app/components/Background";
import FilamentsManager from "./FilamentsManager";

export default async function AdminFilamentsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const primaryEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    "";
  const userEmail = primaryEmail.trim().toLowerCase();

  if (!adminEmail || userEmail !== adminEmail) redirect("/admin");

  return (
    <div className="relative min-h-screen">
      <Background />
      <main className="relative z-20 min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1400px]">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">Materials</p>
                <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
                  Filaments Database
                </h1>
                <p className="mt-2 text-white/70">
                  Manage filament types and color variants from a dedicated database view.
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/admin"
                  className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                >
                  Back to admin
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <FilamentsManager />
          </section>
        </div>
      </main>
    </div>
  );
}

