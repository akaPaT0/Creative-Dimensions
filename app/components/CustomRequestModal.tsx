"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const CUSTOM_REQUEST_OPEN_EVENT = "cd:open-custom-request";

type OpenPayload = {
  productName?: string;
  productUrl?: string;
};

export function openCustomRequest(payload?: OpenPayload) {
  window.dispatchEvent(
    new CustomEvent(CUSTOM_REQUEST_OPEN_EVENT, { detail: payload || {} })
  );
}

type Props = {
  productName?: string;
  productUrl?: string;
  phoneE164?: string; // ex: 96170304007
  className?: string;
  buttonLabel?: string;
  hideButton?: boolean;
};

export default function CustomRequestModal({
  productName,
  productUrl,
  phoneE164 = "96170304007",
  className = "",
  buttonLabel = "Request Custom",
  hideButton = false,
}: Props) {
  const [open, setOpen] = useState(false);

  // context can be overridden by openCustomRequest()
  const [ctxName, setCtxName] = useState<string | undefined>(productName);
  const [ctxUrl, setCtxUrl] = useState<string | undefined>(productUrl);

  const [details, setDetails] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Listen for global open requests
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<OpenPayload>;
      const d = ce?.detail || {};
      if (d.productName !== undefined) setCtxName(d.productName);
      if (d.productUrl !== undefined) setCtxUrl(d.productUrl);
      setOpen(true);
    };

    window.addEventListener(CUSTOM_REQUEST_OPEN_EVENT, handler as EventListener);
    return () =>
      window.removeEventListener(
        CUSTOM_REQUEST_OPEN_EVENT,
        handler as EventListener
      );
  }, []);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function addFiles(newOnes: File[]) {
    if (!newOnes.length) return;

    const key = (f: File) => `${f.name}::${f.size}::${f.lastModified}`;
    const existing = new Set(files.map(key));
    const merged = [...files, ...newOnes.filter((f) => !existing.has(key(f)))];
    setFiles(merged);
  }

  function removeFileAt(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  function clearFiles() {
    setFiles([]);
  }

  const waText = () => {
    const base = `Custom request: ${ctxName || ""}${
      ctxUrl ? ` - ${ctxUrl}` : ""
    }`;
    const extra = details.trim() ? `\nDetails: ${details.trim()}` : "";
    return `${base}${extra}`.trim();
  };

  const openWhatsApp = (extraLinks?: string[]) => {
    const links = extraLinks?.length ? `\nFiles:\n${extraLinks.join("\n")}` : "";
    const text = `${waText()}${links}`;
    const url = `https://wa.me/${phoneE164}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  async function send() {
    setErr(null);

    if (files.length === 0) {
      openWhatsApp();
      setOpen(false);
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("details", details);
      if (ctxName) fd.set("productName", ctxName);
      if (ctxUrl) fd.set("productUrl", ctxUrl);

      for (const f of files) fd.append("files", f);

      const res = await fetch("/api/custom-request", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      const urls: string[] = Array.isArray(data?.urls) ? data.urls : [];
      openWhatsApp(urls);

      setDetails("");
      setFiles([]);
      setOpen(false);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const modal =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="Custom request"
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            <div
              className="relative z-[10000] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#0D0D0D]/80 backdrop-blur-xl backdrop-saturate-150 p-5 sm:p-6 text-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-white font-semibold text-lg">Custom request</div>
                  <div className="text-white/60 text-sm">
                    Share your idea with enough detail so we can quote and produce it correctly.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white/80 hover:bg-white/10 transition"
                >
                  X
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-white/80 text-sm">Details</label>
                  <p className="mt-1 text-xs text-white/55">
                    Include size, quantity, colors, text/logo, finish, and deadline.
                    Example: &quot;10cm keychain, matte black, logo engraved, qty 20, needed before Mar 20.&quot;
                  </p>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="mt-1 w-full min-h-[120px] rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
                    placeholder="Tell us exactly what you need: dimensions, quantity, colors, text/logo, delivery target, and any special notes..."
                  />
                </div>

                <div>
                  <label className="text-white/80 text-sm">Files</label>
                  <p className="mt-1 text-xs text-white/55">
                    Upload references or source files (PNG, JPG, WEBP, STL, 3MF, OBJ, ZIP). Clear photos or drawings help us estimate faster.
                  </p>

                  <input
                    ref={fileInputRef}
                    className="hidden"
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,.stl,.3mf,.obj,.zip"
                    onChange={(e) => {
                      const incoming = Array.from(e.target.files || []);
                      addFiles(incoming);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  />

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/80 hover:bg-white/10 transition"
                    >
                      {files.length ? "Add more files" : "Choose files"}
                    </button>

                    {files.length > 0 && (
                      <button
                        type="button"
                        onClick={clearFiles}
                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/70 hover:bg-white/10 transition"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {files.length > 0 && (
                    <div className="mt-3 max-h-40 overflow-auto rounded-2xl border border-white/10 bg-white/5 p-2">
                      <div className="space-y-2">
                        {files.map((f, i) => (
                          <div
                            key={`${f.name}-${f.size}-${f.lastModified}`}
                            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-white/85 text-sm">{f.name}</div>
                              <div className="text-white/50 text-xs">
                                {(f.size / (1024 * 1024)).toFixed(2)} MB
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeFileAt(i)}
                              className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/75 hover:bg-white/10 transition"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {err && (
                  <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
                    {err}
                  </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
                  After you press Send, you will be redirected to WhatsApp with your request pre-filled so you can review and send it directly.
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-white/80 hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={send}
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center text-white/90 hover:bg-white/15 disabled:opacity-60 transition"
                  >
                    {busy ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {!hideButton && (
        <button
          type="button"
          onClick={() => {
            setCtxName(productName);
            setCtxUrl(productUrl);
            setOpen(true);
          }}
          className={className}
        >
          {buttonLabel}
        </button>
      )}
      {modal}
    </>
  );
}


