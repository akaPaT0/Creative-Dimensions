import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Background from "../components/Background";
import Link from "next/link";
import AdminTabs from "./AdminTabs";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  const primaryEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    "";

  const userEmail = primaryEmail.trim().toLowerCase();

  if (!adminEmail || userEmail !== adminEmail) {
    return (
      <div className="relative min-h-screen">
        <Background />
        <main className="relative z-20 min-h-screen flex items-center justify-center px-6">
          <div className="w-full max-w-xl text-center">
            <h1 className="text-white text-2xl font-semibold">403</h1>
            <p className="text-white/70 mt-2">Not authorized.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <Background />

      <main className="relative z-20 min-h-screen px-4 sm:px-6 lg:px-8 py-10">
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Control Center
                </p>
                <h1 className="mt-2 text-white text-3xl sm:text-4xl font-semibold">
                  Admin Dashboard
                </h1>
                <p className="text-white/70 mt-2">
                  Signed in as <span className="text-white/90">{userEmail}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/shop"
                  className="rounded-xl bg-[#FF8B64] px-4 py-2 text-sm font-medium text-black hover:opacity-90 transition"
                >
                  View Store
                </Link>
              </div>
            </div>
          </div>

          <AdminTabs />
        </div>
      </main>
    </div>
  );
}
