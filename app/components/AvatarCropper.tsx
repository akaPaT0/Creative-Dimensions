"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, X } from "lucide-react";

const OUTPUT = 256;
const MAX_ZOOM = 4;

type Props = {
  file: File;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
};

/** Square/circle crop with drag-to-position and zoom, output as a small WebP. */
export default function AvatarCropper({ file, onCancel, onConfirm }: Props) {
  // Read the file as a data URL. (An object URL revoked in an effect cleanup can
  // be freed before the image finishes loading when React re-runs effects.)
  const [src, setSrc] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [view, setView] = useState(300);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ id: number; x: number; y: number; ox: number; oy: number } | null>(null);
  const pinch = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);

  useEffect(() => {
    let alive = true;
    const reader = new FileReader();
    reader.onload = () => {
      if (alive) setSrc(String(reader.result));
    };
    reader.onerror = () => {
      if (alive) setLoadError(true);
    };
    reader.readAsDataURL(file);
    return () => {
      alive = false;
      if (reader.readyState === FileReader.LOADING) reader.abort();
    };
  }, [file]);

  // Size the crop window to the screen.
  useEffect(() => {
    const fit = () => setView(Math.min(320, Math.round(window.innerWidth * 0.78)));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  // Scale that makes the image just cover the crop window.
  const base = natural ? view / Math.min(natural.w, natural.h) : 1;
  const scale = base * zoom;

  // Keep the image covering the window (no empty edges).
  const clamp = useCallback(
    (x: number, y: number, z: number) => {
      if (!natural) return { x: 0, y: 0 };
      const s = base * z;
      const maxX = Math.max(0, (natural.w * s - view) / 2);
      const maxY = Math.max(0, (natural.h * s - view) / 2);
      return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
    },
    [natural, base, view]
  );

  const setZoomClamped = (z: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(1, z));
    setZoom(next);
    setOffset((o) => clamp(o.x, o.y, next));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pinch.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current.size === 2) {
      const [a, b] = [...pinch.current.values()];
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
      drag.current = null;
    } else {
      drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (pinch.current.has(e.pointerId)) pinch.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pinch.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      setZoomClamped((pinchStart.current.zoom * dist) / pinchStart.current.dist);
      return;
    }
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    setOffset(clamp(d.ox + (e.clientX - d.x), d.oy + (e.clientY - d.y), zoom));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pinch.current.delete(e.pointerId);
    if (pinch.current.size < 2) pinchStart.current = null;
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  async function confirm() {
    const img = imgRef.current;
    if (!img || !natural) return;
    setBusy(true);
    try {
      // Map the visible window back to source pixels.
      const side = view / scale;
      const cx = natural.w / 2 - offset.x / scale;
      const cy = natural.h / 2 - offset.y / scale;
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Your browser can't process images.");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, cx - side / 2, cy - side / 2, side, side, 0, 0, OUTPUT, OUTPUT);
      const toBlob = (type: string) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.82));
      const webp = await toBlob("image/webp");
      const blob = webp && webp.type === "image/webp" ? webp : await toBlob("image/jpeg");
      if (!blob) throw new Error("Couldn't process that photo.");
      onConfirm(blob);
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Crop photo">
      <button type="button" aria-label="Cancel" onClick={onCancel} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full rounded-t-3xl border border-white/10 bg-[#111113] p-5 text-white sm:max-w-md sm:rounded-3xl sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Crop your photo</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="rounded-xl border border-white/12 bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>
        <p className="mt-1 text-xs text-white/45">Drag to position, zoom to fit.</p>

        <div
          className="relative mx-auto mt-4 touch-none select-none overflow-hidden rounded-2xl bg-black"
          style={{ width: view, height: view, cursor: drag.current ? "grabbing" : "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(e) => setZoomClamped(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08))}
        >
          {loadError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6 text-center text-sm text-white/70">
              Couldn&rsquo;t open this photo. Try a JPG, PNG or WebP image.
            </div>
          )}
          {!src && !loadError && (
            <div className="absolute inset-0 z-10 animate-pulse bg-white/[0.06]" aria-hidden="true" />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {src && <img
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            onLoad={(e) => {
              const el = e.currentTarget;
              setNatural({ w: el.naturalWidth, h: el.naturalHeight });
            }}
            onError={() => setLoadError(true)}
            className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
            style={
              natural
                ? {
                    width: natural.w * scale,
                    height: natural.h * scale,
                    transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
                  }
                : { opacity: 0 }
            }
          />}
          {/* Circle guide */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-white/80"
            style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)" }}
            aria-hidden="true"
          />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button type="button" aria-label="Zoom out" onClick={() => setZoomClamped(zoom / 1.2)} className="text-white/60 hover:text-white">
            <Minus size={16} />
          </button>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoomClamped(Number(e.target.value))}
            aria-label="Zoom"
            className="flex-1 accent-[#FF8B64]"
          />
          <button type="button" aria-label="Zoom in" onClick={() => setZoomClamped(zoom * 1.2)} className="text-white/60 hover:text-white">
            <Plus size={16} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-semibold hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!natural || busy}
            onClick={() => void confirm()}
            className="rounded-xl bg-[#FF8B64] px-4 py-3 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] disabled:opacity-60 transition"
          >
            Save photo
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
