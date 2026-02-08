import { NextResponse } from "next/server";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";

function json(res: unknown, status = 200) {
  return NextResponse.json(res, { status });
}

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, res: json({ error: "Unauthorized" }, 401) };

  const user = await currentUser();
  if (!user) return { ok: false as const, res: json({ error: "Unauthorized" }, 401) };

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const primaryEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    "";
  const userEmail = primaryEmail.trim().toLowerCase();

  if (!adminEmail || userEmail !== adminEmail) {
    return { ok: false as const, res: json({ error: "Forbidden" }, 403) };
  }

  return { ok: true as const, userId };
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.res;

    const client = await clerkClient();
    const nowSeconds = Math.floor(Date.now() / 1000);
    const weekAgoSeconds = nowSeconds - 7 * 24 * 60 * 60;

    const warnings: string[] = [];

    const [totalUsersRes, active7dRes, sessionsAllRes, sessionsMineRes, usersRes] =
      await Promise.allSettled([
        client.users.getCount(),
        client.users.getUserList({
          limit: 1,
          last_active_at_since: weekAgoSeconds,
        }),
        client.sessions.getSessionList({ limit: 1 }),
        client.sessions.getSessionList({ limit: 1, userId: admin.userId }),
        client.users.getUserList({ limit: 25, orderBy: "-last_sign_in_at" }),
      ]);

    const totalUsers =
      totalUsersRes.status === "fulfilled" ? totalUsersRes.value : 0;
    if (totalUsersRes.status === "rejected") {
      warnings.push(`users.getCount failed: ${String(totalUsersRes.reason)}`);
    }

    const activeLast7d =
      active7dRes.status === "fulfilled"
        ? active7dRes.value.totalCount ?? active7dRes.value.data?.length ?? 0
        : 0;
    if (active7dRes.status === "rejected") {
      warnings.push(`users.getUserList(active7d) failed: ${String(active7dRes.reason)}`);
    }

    const totalSessions =
      sessionsAllRes.status === "fulfilled"
        ? sessionsAllRes.value.totalCount ?? sessionsAllRes.value.data?.length ?? 0
        : 0;
    if (sessionsAllRes.status === "rejected") {
      warnings.push(`sessions.getSessionList(all) failed: ${String(sessionsAllRes.reason)}`);
    }

    const yourSessions =
      sessionsMineRes.status === "fulfilled"
        ? sessionsMineRes.value.totalCount ?? sessionsMineRes.value.data?.length ?? 0
        : 0;
    if (sessionsMineRes.status === "rejected") {
      warnings.push(
        `sessions.getSessionList(yourSessions) failed: ${String(sessionsMineRes.reason)}`
      );
    }

    const usersRaw =
      usersRes.status === "fulfilled" ? usersRes.value.data ?? [] : [];
    if (usersRes.status === "rejected") {
      warnings.push(`users.getUserList(recent) failed: ${String(usersRes.reason)}`);
    }

    const users = usersRaw.map((u) => {
      const primaryEmail =
        u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ||
        u.emailAddresses[0]?.emailAddress ||
        "";

      const fullName =
        `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
        u.username ||
        "Unnamed user";

      return {
        id: u.id,
        fullName,
        username: u.username ?? "",
        email: primaryEmail,
        lastSignInAt: u.lastSignInAt,
        createdAt: u.createdAt,
      };
    });

    return json({
      ok: true,
      metrics: {
        totalUsers,
        activeLast7d,
        totalSessions,
        yourSessions,
      },
      users,
      warnings,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load admin analytics";
    return json({ error: message }, 500);
  }
}
