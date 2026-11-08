import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/app/lib/supabase/admin";
import { createClient } from "@/app/lib/supabase/server";

const TOKEN_COOKIE = "cd_supabase_token";

export type AuthResult =
  | { user: User; userId: string; email: string }
  | { response: NextResponse };

export async function requireSupabaseUser(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (token) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data.user) {
      return {
        user: data.user,
        userId: data.user.id,
        email: data.user.email?.trim().toLowerCase() || "",
      };
    }
  }

  return await getSupabaseUserFromCookies();
}

export async function getSupabaseUserFromCookies(): Promise<AuthResult> {
  // 1. Primary: Verify user via official SSR session cookies
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user) {
      return {
        user,
        userId: user.id,
        email: user.email?.trim().toLowerCase() || "",
      };
    }
  } catch (err) {
    console.error("Supabase SSR cookie lookup error:", err);
  }

  // 2. Fallback: Migration compatibility for legacy cookie if still present
  const legacyToken = await getCookieToken();
  if (legacyToken) {
    const { data, error } = await supabaseAdmin.auth.getUser(legacyToken);
    if (!error && data.user) {
      return {
        user: data.user,
        userId: data.user.id,
        email: data.user.email?.trim().toLowerCase() || "",
      };
    }
  }

  return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
}

export async function getCookieToken() {
  return (await cookies()).get(TOKEN_COOKIE)?.value || "";
}

export async function requireSupabaseAdmin(req: Request) {
  const result = await requireSupabaseUser(req);
  if ("response" in result) return result;

  const rawAdminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
    .toLowerCase()
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const isAdminEmail = rawAdminEmails.includes(result.email);
  const isAdminRole = result.user.app_metadata?.role === "admin";

  if (!isAdminEmail && !isAdminRole) {
    return {
      response: NextResponse.json({ isAdmin: false, error: "Forbidden" }, { status: 403 }),
    };
  }

  // Ensure admin email is verified to prevent unverified account takeover
  if (!result.user.email_confirmed_at && process.env.NODE_ENV === "production") {
    return {
      response: NextResponse.json(
        { isAdmin: false, error: "Admin email must be verified." },
        { status: 403 }
      ),
    };
  }

  return result;
}

export async function requireSupabaseAdminFromCookies() {
  const result = await getSupabaseUserFromCookies();
  if ("response" in result) return result;

  const rawAdminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
    .toLowerCase()
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const isAdminEmail = rawAdminEmails.includes(result.email);
  const isAdminRole = result.user.app_metadata?.role === "admin";

  if (!isAdminEmail && !isAdminRole) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  if (!result.user.email_confirmed_at && process.env.NODE_ENV === "production") {
    return {
      response: NextResponse.json({ error: "Admin email must be verified." }, { status: 403 }),
    };
  }

  return result;
}
