import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

function json(res: unknown, status = 200) {
  return NextResponse.json(res, { status });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return json({ isAdmin: false }, 401);

  const user = await currentUser();
  if (!user) return json({ isAdmin: false }, 401);

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const primaryEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    "";
  const userEmail = primaryEmail.trim().toLowerCase();

  const isAdmin = Boolean(adminEmail) && userEmail === adminEmail;
  if (!isAdmin) return json({ isAdmin: false }, 403);

  return json({ isAdmin: true });
}

