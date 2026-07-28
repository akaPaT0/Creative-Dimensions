import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

const TOKEN_COOKIE = "cd_supabase_token";

export type AuthResult =
  | { user: User; userId: string; email: string }
  | { response: NextResponse };

export async function requireSupabaseUser(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization") || "";
  const token =
    authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : await getCookieToken();

  if (!token) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return {
    user: data.user,
    userId: data.user.id,
    email: data.user.email?.trim().toLowerCase() || "",
  };
}

export async function getSupabaseUserFromCookies(): Promise<AuthResult> {
  const token = await getCookieToken();
  if (!token) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return {
    user: data.user,
    userId: data.user.id,
    email: data.user.email?.trim().toLowerCase() || "",
  };
}

export async function getCookieToken() {
  return (await cookies()).get(TOKEN_COOKIE)?.value || "";
}

export async function requireSupabaseAdmin(req: Request) {
  const result = await requireSupabaseUser(req);
  if ("response" in result) return result;

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || result.email !== adminEmail) {
    return {
      response: NextResponse.json({ isAdmin: false, error: "Forbidden" }, { status: 403 }),
    };
  }

  return result;
}

export async function requireSupabaseAdminFromCookies() {
  const result = await getSupabaseUserFromCookies();
  if ("response" in result) return result;

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || result.email !== adminEmail) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return result;
}
