"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Music4, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/app/lib/supabase/clients";

type PlaylistRow = {
  name: string;
  spotifyUrl: string;
};

type SpotifyIframeApi = {
  createController: (
    element: HTMLElement,
    options: { width: number | string; height: number | string; uri: string },
    callback: (controller: SpotifyEmbedController) => void
  ) => void;
};

type SpotifyEmbedController = {
  loadUri: (uri: string) => void;
  play: () => void;
  pause: () => void;
  resume?: () => void;
  destroy?: () => void;
};

declare global {
  interface Window {
    __spotifyIframeApi?: SpotifyIframeApi;
    onSpotifyIframeApiReady?: (api: SpotifyIframeApi) => void;
  }
}

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePlaylists(rows: unknown): PlaylistRow[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      const name = toText(row.name);
      const spotifyUrl = toText(row.url || row.cover_url);
      if (!name || !spotifyUrl) return null;
      return { name, spotifyUrl };
    })
    .filter((entry): entry is PlaylistRow => Boolean(entry));
}

function toSpotifyUri(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("spotify:playlist:")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    const playlistIndex = parts.findIndex((part) => part === "playlist");
    const playlistId = playlistIndex >= 0 ? parts[playlistIndex + 1] || "" : "";
    return playlistId ? `spotify:playlist:${playlistId}` : "";
  } catch {
    return "";
  }
}

function loadSpotifyIframeApi() {
  if (typeof window === "undefined") {
    return Promise.resolve<SpotifyIframeApi | null>(null);
  }

  if (window.__spotifyIframeApi) {
    return Promise.resolve(window.__spotifyIframeApi);
  }

  return new Promise<SpotifyIframeApi>((resolve) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-spotify-iframe-api="true"]'
    );
    const previousReadyHandler = window.onSpotifyIframeApiReady;

    window.onSpotifyIframeApiReady = (api) => {
      window.__spotifyIframeApi = api;
      previousReadyHandler?.(api);
      resolve(api);
    };

    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.dataset.spotifyIframeApi = "true";
    document.body.appendChild(script);
  });
}

export default function BackgroundMusic() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [selectedUrl, setSelectedUrl] = useState("");
  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<SpotifyEmbedController | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlaylists() {
      const { data, error } = await supabase
        .from("playlists")
        .select("name, cover_url, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (cancelled) return;

      if (error) {
        setPlaylists([]);
        setLoadError(error.message);
        setLoading(false);
        return;
      }

      const nextPlaylists = normalizePlaylists(data);
      setLoadError(null);
      setPlaylists(nextPlaylists);
      setSelectedUrl((current) => current || nextPlaylists[0]?.spotifyUrl || "");
      setLoading(false);
    }

    void loadPlaylists();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function setupPlayer() {
      const api = await loadSpotifyIframeApi();
      if (cancelled || !api || !playerHostRef.current || controllerRef.current) return;

      const initialUri = toSpotifyUri(selectedUrl || playlists[0]?.spotifyUrl || "");
      if (!initialUri) return;

      api.createController(
        playerHostRef.current,
        {
          width: 320,
          height: 152,
          uri: initialUri,
        },
        (controller) => {
          if (cancelled) return;
          controllerRef.current = controller;
          if (enabled) {
            controller.play();
            controller.resume?.();
          }
        }
      );
    }

    void setupPlayer();

    return () => {
      cancelled = true;
    };
  }, [enabled, playlists, selectedUrl]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;

    if (!enabled) {
      controller.pause();
      return;
    }

    controller.play();
    controller.resume?.();
  }, [enabled]);

  function handlePlaylistChange(nextUrl: string) {
    const nextUri = toSpotifyUri(nextUrl);
    setEnabled(true);
    setSelectedUrl(nextUrl);
    setOpen(false);

    if (!nextUri) return;

    const controller = controllerRef.current;
    if (!controller) return;

    controller.loadUri(nextUri);
    controller.play();
    controller.resume?.();
  }

  return (
    <div className="fixed bottom-5 left-5 z-[70] flex flex-col items-start gap-3">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[-9999px] top-[-9999px] h-[152px] w-[320px] overflow-hidden opacity-0"
      >
        <div ref={playerHostRef} className="h-[152px] w-[320px]" />
      </div>

      {open && (
        <div className="w-[min(86vw,320px)] overflow-hidden rounded-2xl border border-white/15 bg-[#0D0D0D]/78 p-3 text-white shadow-[0_14px_40px_rgba(0,0,0,0.38)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Music</div>
              <div className="text-xs text-white/55">
                {loading
                  ? "Loading playlists..."
                  : loadError
                    ? "Could not load playlists"
                    : "Choose a playlist and it starts in the background"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEnabled((value) => !value)}
              aria-label={enabled ? "Turn music off" : "Turn music on"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
            >
              {enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>

          <div className="mt-3">
            <label htmlFor="playlist-select" className="mb-1 block text-xs text-white/60">
              Playlist
            </label>
            <select
              id="playlist-select"
              value={selectedUrl || playlists[0]?.spotifyUrl || ""}
              disabled={loading || playlists.length === 0}
              onChange={(event) => handlePlaylistChange(event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-[#FF8B64]"
            >
              {playlists.map((playlist) => (
                <option key={playlist.spotifyUrl} value={playlist.spotifyUrl}>
                  {playlist.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Hide music menu" : "Show music menu"}
        aria-expanded={open}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-[#0D0D0D]/70 px-3 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:bg-white/10"
      >
        <Music4 size={17} />
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-white/80">
          Music
        </span>
        {open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
    </div>
  );
}
