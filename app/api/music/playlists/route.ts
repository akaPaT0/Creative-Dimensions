import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

const MUSIC_BUCKET = "music";
const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".webm"]);

type StorageEntry = {
  id?: string | null;
  name?: string | null;
};

function getEntryName(entry: StorageEntry | null | undefined) {
  return typeof entry?.name === "string" ? entry.name.trim() : "";
}

function isFolder(entry: StorageEntry) {
  return !entry.id;
}

function isAudioFile(name: string) {
  const lower = name.trim().toLowerCase();
  return Array.from(AUDIO_EXTENSIONS).some((extension) => lower.endsWith(extension));
}

function getPublicUrl(path: string) {
  const { data } = supabaseAdmin.storage.from(MUSIC_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function GET() {
  try {
    const { data: rootEntries, error: rootError } = await supabaseAdmin
      .storage
      .from(MUSIC_BUCKET)
      .list("", { limit: 100, sortBy: { column: "name", order: "asc" } });

    if (rootError) {
      throw new Error(rootError.message);
    }

    const folders = ((rootEntries || []) as StorageEntry[])
      .filter(isFolder)
      .map((entry) => getEntryName(entry))
      .filter(Boolean);

    const playlists: Array<{ name: string; tracks: Array<{ name: string; url: string }> }> = [];

    for (const folderName of folders) {
      const { data: fileEntries, error: fileError } = await supabaseAdmin
        .storage
        .from(MUSIC_BUCKET)
        .list(folderName, { limit: 200, sortBy: { column: "name", order: "asc" } });

      if (fileError) {
        throw new Error(fileError.message);
      }

      const tracks = ((fileEntries || []) as StorageEntry[])
        .filter((entry) => Boolean(entry.id))
        .map((entry) => getEntryName(entry))
        .filter(isAudioFile)
        .map((fileName) => ({
          name: fileName,
          url: getPublicUrl(`${folderName}/${fileName}`),
        }));

      playlists.push({
        name: folderName,
        tracks,
      });
    }

    return NextResponse.json(
      { ok: true, playlists },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load playlists";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
