"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  productName?: string;
  productUrl?: string;
  phoneE164?: string; // ex: 96170304007
  className?: string;
};

export default function CustomRequestModal({
  productName,
  productUrl,
  phoneE164 = "96170304007",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ✅ ensure portal is ready (avoids SSR mismatch)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ✅ lock scroll + ESC to close
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

  const waText = () => {
    const base = `Custom request: ${productName || ""}${productUrl ? ` — ${productUrl}` : ""}`;
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

    // If no files, just send text
    if (files.length === 0) {
      openWhatsApp();
      setOpen(false);
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("details", details);
      if (productName) fd.set("productName", productName);
      if (productUrl) fd.set("productUrl", productUrl);

      for (const f of files) fd.append("files", f);

      const res = await fetch("/api/custom-request", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      const urls: string[] = Array.isArray(data?.urls) ? data.urls : [];
      openWhatsApp(urls);
      setOpen(false);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
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
            {/* Backdrop blocks ALL clicks */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <div
              className="relative z-[10000] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#0D0D0D]/80 backdrop-blur-xl backdrop-saturate-150 p-5 sm:p-6 text-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-white font-semibold text-lg">Custom request</div>
                  <div className="text-white/60 text-sm">
                    Upload an image/STL and describe what you want.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white/80 hover:bg-white/10 transition"
                >
                  ✕
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-white/80 text-sm">Details</label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="mt-1 w-full min-h-[120px] rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
                    placeholder="Size, colors, text, reference, anything..."
                  />
                </div>

                <div>
                  <label className="text-white/80 text-sm">Files</label>
                  <input
                    className="mt-1 w-full text-white/80"
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,.stl,.3mf,.obj,.zip"
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  />

                  {files.length > 0 && (
                    <div className="mt-3 text-white/60 text-xs">
                      Selected: {files.length} file(s)
                    </div>
                  )}
                </div>

                {err && (
                  <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
                    {err}
                  </div>
                )}

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
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Request Custom
      </button>

      {modal}
    </>
  );
}
