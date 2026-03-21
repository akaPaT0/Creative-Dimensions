"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Pause, Play, SkipForward } from "lucide-react";

type PlaylistTrack = {
  name: string;
  url: string;
};

type Playlist = {
  name: string;
  tracks: PlaylistTrack[];
};

const ENABLED_STORAGE_KEY = "cd_music_enabled_v3";
const PLAYLIST_STORAGE_KEY = "cd_music_playlist_v3";
const DEFAULT_PLAYLIST_NAME = "Lofi chill";

function isPlaylistArray(value: unknown): value is Playlist[] {
  return Array.isArray(value);
}

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playlistMenuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playlistMenuOpen, setPlaylistMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistName, setSelectedPlaylistName] = useState("");
  const [trackIndex, setTrackIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedEnabled = window.localStorage.getItem(ENABLED_STORAGE_KEY);
    if (storedEnabled === "false") {
      setIsPlaying(false);
    }

    const storedPlaylist = window.localStorage.getItem(PLAYLIST_STORAGE_KEY);
    if (storedPlaylist) {
      setSelectedPlaylistName(storedPlaylist);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPlaylists() {
      try {
        const response = await fetch("/api/music/playlists", { cache: "no-store" });
        const data = (await response.json().catch(() => ({}))) as {
          playlists?: unknown;
          error?: string;
        };

        if (cancelled) return;

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load playlists");
        }

        const nextPlaylists = isPlaylistArray(data.playlists) ? data.playlists : [];
        setPlaylists(nextPlaylists);
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;
        setPlaylists([]);
        setLoadError(error instanceof Error ? error.message : "Failed to load playlists");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPlaylists();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ENABLED_STORAGE_KEY, isPlaying ? "true" : "false");
  }, [isPlaying]);

  useEffect(() => {
    if (typeof window === "undefined" || !selectedPlaylistName) return;
    window.localStorage.setItem(PLAYLIST_STORAGE_KEY, selectedPlaylistName);
  }, [selectedPlaylistName]);

  useEffect(() => {
    if (!open) {
      setPlaylistMenuOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!playlistMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!playlistMenuRef.current?.contains(target)) {
        setPlaylistMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPlaylistMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [playlistMenuOpen]);

  useEffect(() => {
    if (playlists.length === 0) return;

    const exists = playlists.some((playlist) => playlist.name === selectedPlaylistName);
    if (!exists) {
      const defaultPlaylist =
        playlists.find(
          (playlist) =>
            playlist.name.trim().toLowerCase() === DEFAULT_PLAYLIST_NAME.toLowerCase()
        ) || playlists[0];
      setSelectedPlaylistName(defaultPlaylist?.name || "");
      setTrackIndex(0);
    }
  }, [playlists, selectedPlaylistName]);

  const selectedPlaylist = useMemo(
    () => playlists.find((playlist) => playlist.name === selectedPlaylistName) || null,
    [playlists, selectedPlaylistName]
  );

  useEffect(() => {
    if (!selectedPlaylist) return;
    if (trackIndex < selectedPlaylist.tracks.length) return;
    setTrackIndex(0);
  }, [selectedPlaylist, trackIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.5;

    const track = selectedPlaylist?.tracks[trackIndex];
    if (!track) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      return;
    }

    if (audio.src !== track.url) {
      audio.src = track.url;
      audio.load();
    }

    if (!isPlaying) {
      audio.pause();
      return;
    }

    void audio.play().catch(() => {
      // Browser autoplay rules may still require a user interaction.
    });
  }, [isPlaying, selectedPlaylist, trackIndex]);

  function handleTogglePlayback() {
    setIsPlaying((current) => !current);
  }

  function handlePlaylistChange(nextPlaylistName: string) {
    setSelectedPlaylistName(nextPlaylistName);
    setTrackIndex(0);
    setIsPlaying(true);
    setPlaylistMenuOpen(false);
  }

  function handleTrackEnd() {
    setTrackIndex((current) => {
      if (!selectedPlaylist || selectedPlaylist.tracks.length === 0) return 0;
      return (current + 1) % selectedPlaylist.tracks.length;
    });
  }

  function handleSkipTrack() {
    if (!selectedPlaylist || selectedPlaylist.tracks.length === 0) return;
    setTrackIndex((current) => (current + 1) % selectedPlaylist.tracks.length);
    setIsPlaying(true);
  }

  return (
    <div className="fixed bottom-5 left-5 z-[70] flex flex-col items-start gap-3">
      <audio ref={audioRef} onEnded={handleTrackEnd} preload="auto" hidden />

      {open && (
        <div className="relative z-20 w-[min(86vw,320px)] rounded-[26px] border border-white/12 bg-[linear-gradient(180deg,rgba(20,20,20,0.94),rgba(8,8,8,0.94))] p-3 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,139,100,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(59,199,196,0.12),transparent_34%)]" />
          <div className="relative space-y-3">
            <div ref={playlistMenuRef} className="relative">
              <button
                type="button"
                aria-label="Select playlist"
                aria-expanded={playlistMenuOpen}
                onClick={() => {
                  if (loading || playlists.length === 0) return;
                  setPlaylistMenuOpen((current) => !current);
                }}
                disabled={loading || playlists.length === 0}
                className="flex w-full items-center justify-between rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-left text-sm font-medium text-white outline-none transition hover:bg-white/[0.09] focus:border-[#FF8B64] focus:bg-white/[0.09] disabled:opacity-50"
              >
                <span className="truncate">
                  {loading
                    ? "Loading playlists..."
                    : loadError
                      ? "Could not load playlists"
                      : selectedPlaylistName || "No playlists"}
                </span>
                <span className="ml-3 shrink-0 text-white/65">
                  {playlistMenuOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </span>
              </button>

              {playlistMenuOpen && playlists.length > 0 && (
                <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-20 overflow-hidden rounded-2xl border border-white/12 bg-[#0B0B0B]/96 shadow-[0_18px_40px_rgba(0,0,0,0.42)] backdrop-blur-xl">
                  <div className="max-h-[min(18rem,45vh)] overflow-y-auto overscroll-contain p-1.5">
                    {playlists.map((playlist) => {
                      const selected = playlist.name === selectedPlaylistName;

                      return (
                        <button
                          key={playlist.name}
                          type="button"
                          onClick={() => handlePlaylistChange(playlist.name)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                            selected
                              ? "bg-white/[0.10] text-white"
                              : "text-white/78 hover:bg-white/[0.06] hover:text-white"
                          }`}
                        >
                          <span className="truncate">{playlist.name}</span>
                          {selected && <span className="ml-3 h-2 w-2 rounded-full bg-white/90" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleTogglePlayback}
                aria-label={isPlaying ? "Pause music" : "Play music"}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.07] text-white transition hover:bg-white/[0.12] disabled:opacity-50"
                disabled={Boolean(loadError) || !selectedPlaylist}
              >
                {isPlaying ? <Pause size={17} /> : <Play size={17} />}
              </button>

              <button
                type="button"
                onClick={handleSkipTrack}
                aria-label="Skip track"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.07] text-white transition hover:bg-white/[0.12] disabled:opacity-50"
                disabled={Boolean(loadError) || !selectedPlaylist}
              >
                <SkipForward size={17} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Hide music menu" : "Show music menu"}
        aria-expanded={open}
        className="group relative z-10 inline-flex items-center gap-1 rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(18,18,18,0.92),rgba(7,7,7,0.92))] py-1 pl-1.5 pr-1.5 text-white shadow-[0_18px_45px_rgba(0,0,0,0.38)] backdrop-blur-2xl transition hover:border-white/20 hover:shadow-[0_22px_55px_rgba(0,0,0,0.48)]"
      >
        <span className="relative inline-flex h-6 w-8 items-center justify-center rounded-full">
          <span
            className={`absolute inset-0 rounded-full bg-white/10 blur-[8px] ${
              isPlaying && !loading && !loadError
                ? "animate-[spotify-pulse_1.6s_ease-in-out_infinite]"
                : "opacity-70"
            }`}
          />
          <span
            aria-hidden="true"
            className="relative flex h-4 w-8 items-center justify-center gap-[1.5px]"
          >
            {[
              18, 32, 22, 42, 50, 34, 18, 30, 20,
            ].map((height, index) => (
              <span
                key={`${height}-${index}`}
                className={`w-[2.5px] rounded-full ${
                  isPlaying && !loading && !loadError
                    ? "animate-[music-wave_1.1s_ease-in-out_infinite]"
                    : ""
                }`}
                style={{
                  height: `${height * 0.22}px`,
                  animationDelay: `${index * 0.06}s`,
                  opacity: isPlaying && !loading && !loadError ? 1 : 0.72,
                  background: "rgba(255,255,255,0.95)",
                  boxShadow: "0 0 10px rgba(255,255,255,0.08)",
                }}
              />
            ))}
          </span>
        </span>
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/78 transition group-hover:bg-white/[0.09] group-hover:text-white">
          {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </span>
      </button>
    </div>
  );
}
