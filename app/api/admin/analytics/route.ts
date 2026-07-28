import { NextResponse } from "next/server";
import { requireSupabaseAdmin } from "@/app/lib/supabase/auth-server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

function json(res: unknown, status = 200) {
  return NextResponse.json(res, { status });
}

async function requireAdmin(req: Request) {
  const admin = await requireSupabaseAdmin(req);
  if ("response" in admin) return { ok: false as const, res: admin.response };
  return { ok: true as const, userId: admin.userId };
}

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.res;

    const warnings: string[] = [];
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    if (error) throw error;

    const usersRaw = data.users ?? [];
    const users = usersRaw
      .map((u) => ({
        id: u.id,
        fullName:
          [u.user_metadata?.first_name, u.user_metadata?.last_name]
            .filter((x) => typeof x === "string" && x.trim())
            .join(" ") ||
          (typeof u.user_metadata?.name === "string" ? u.user_metadata.name : "") ||
          u.email?.split("@")[0] ||
          "Unnamed user",
        username: typeof u.user_metadata?.username === "string" ? u.user_metadata.username : "",
        email: u.email || "",
        lastSignInAt: u.last_sign_in_at || null,
        createdAt: u.created_at,
      }))
      .sort((a, b) => String(b.lastSignInAt || b.createdAt).localeCompare(String(a.lastSignInAt || a.createdAt)))
      .slice(0, 25);

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeLast7d = usersRaw.filter((u) => {
      const last = u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : 0;
      return last >= weekAgo;
    }).length;

    return json({
      ok: true,
      metrics: {
        totalUsers: data.total ?? usersRaw.length,
        activeLast7d,
        totalSessions: 0,
        yourSessions: 0,
      },
      users,
      warnings: [
        ...warnings,
        "Supabase Auth does not expose session counts in this endpoint, so session metrics are shown as 0.",
      ],
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load admin analytics";
    return json({ error: message }, 500);
  }
}
