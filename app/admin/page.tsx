import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

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
      <main className="min-h-screen px-6 pt-28">
        <h1 className="text-white text-2xl font-semibold">403</h1>
        <p className="text-white/70 mt-2">Not authorized.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 pt-28">
      <h1 className="text-white text-2xl font-semibold">Admin</h1>
      <p className="text-white/70 mt-2">Welcome, {userEmail}</p>
    </main>
  );
}
