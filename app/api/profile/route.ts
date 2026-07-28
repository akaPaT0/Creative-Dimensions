import { NextResponse } from "next/server";
import { requireSupabaseUser } from "@/app/lib/supabase/auth-server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toClient(row: Record<string, unknown>, email: string) {
  return {
    id: asText(row.id),
    email: asText(row.email) || email,
    firstName: asText(row.first_name),
    lastName: asText(row.last_name),
    username: asText(row.username),
    avatarUrl: asText(row.avatar_url),
    createdAt: asText(row.created_at),
    updatedAt: asText(row.updated_at),
  };
}

function toClientFromMetadata(userId: string, email: string, metadata: Record<string, unknown> | null) {
  return {
    id: userId,
    email,
    firstName: asText(metadata?.first_name),
    lastName: asText(metadata?.last_name),
    username: asText(metadata?.username),
    avatarUrl: asText(metadata?.avatar_url),
    createdAt: "",
    updatedAt: "",
  };
}

function isProfilesTableMissing(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  if (error.code === "42P01") return true;
  return (error.message || "").toLowerCase().includes('relation "profiles" does not exist');
}

export async function GET(req: Request) {
  const auth = await requireSupabaseUser(req);
  if ("response" in auth) return auth.response;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", auth.userId)
    .maybeSingle();

  if (error && !isProfilesTableMissing(error)) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (isProfilesTableMissing(error)) {
    return NextResponse.json({
      profile: toClientFromMetadata(
        auth.userId,
        auth.email,
        (auth.user.user_metadata as Record<string, unknown> | null) ?? null
      ),
    });
  }

  if (!data) {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("profiles")
      .insert({ id: auth.userId, email: auth.email })
      .select("*")
      .single();

    if (insertError && isProfilesTableMissing(insertError)) {
      return NextResponse.json({
        profile: toClientFromMetadata(
          auth.userId,
          auth.email,
          (auth.user.user_metadata as Record<string, unknown> | null) ?? null
        ),
      });
    }

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      profile: toClient(inserted as Record<string, unknown>, auth.email),
    });
  }

  return NextResponse.json({
    profile: toClient(data as Record<string, unknown>, auth.email),
  });
}

export async function PUT(req: Request) {
  const auth = await requireSupabaseUser(req);
  if ("response" in auth) return auth.response;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const firstName = asText(body.firstName);
  const lastName = asText(body.lastName);
  const username = asText(body.username);
  const avatarUrl = asText(body.avatarUrl);

  const row = {
    id: auth.userId,
    email: auth.email,
    first_name: firstName,
    last_name: lastName,
    username,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single();

  if (error && isProfilesTableMissing(error)) {
    const nextMetadata = {
      ...(auth.user.user_metadata || {}),
      first_name: firstName,
      last_name: lastName,
      username,
      avatar_url: avatarUrl,
    };

    const { data: updated, error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
      auth.userId,
      { user_metadata: nextMetadata }
    );

    if (metadataError) {
      return NextResponse.json({ error: metadataError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      profile: toClientFromMetadata(
        auth.userId,
        auth.email,
        (updated.user?.user_metadata as Record<string, unknown> | null) ?? nextMetadata
      ),
    });
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    profile: toClient(data as Record<string, unknown>, auth.email),
  });
}
