import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminProductForm from "./AdminProductForm";
import Background from "../components/Background";
import AdminProductsManager from "./AdminProductsManager";

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

      <main className="relative z-20 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center">
            <h1 className="text-white text-2xl font-semibold">Admin</h1>
            <p className="text-white/70 mt-2">Welcome, {userEmail}</p>
          </div>

          <AdminProductForm />
          <AdminProductsManager />
        </div>
      </main>
    </div>
  );
}
