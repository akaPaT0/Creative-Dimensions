"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileBox, ImagePlus, MessageCircle, X } from "lucide-react";
import Turnstile from "./Turnstile";

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

// Several pages mount more than one modal (Navbar + page CTAs). Only the first
// mounted instance answers the global open event, so a single popup appears.
const globalListeners: string[] = [];

const PROJECT_TYPES = [
  "Custom part / prototype",
  "Business / branded",
  "Prop / cosplay",
  "Gift / personal",
  "Other",
] as const;

// Default context passed by generic CTAs; not a real product reference.
const GENERIC_CONTEXT_NAMES = new Set(["Custom Order", "Custom Request", ""]);

type Props = {
  productName?: string;
  productUrl?: string;
  phoneE164?: string; // ex: 96170304007
  className?: string;
  buttonLabel?: string;
  hideButton?: boolean;
};

type PickedFile = { file: File; preview?: string };

// Keep in step with /api/custom-request.
const MAX_FILES = 6;
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "stl", "3mf", "obj", "zip"]);

const fileKey = (f: File) => `${f.name}::${f.size}::${f.lastModified}`;

export default function CustomRequestModal({
  productName,
  productUrl,
  phoneE164 = "96170304007",
  className = "",
  buttonLabel = "Request Custom",
  hideButton = false,
}: Props) {
  const instanceId = useId();
  const [open, setOpen] = useState(false);

  // context can be overridden by openCustomRequest()
  const [ctxName, setCtxName] = useState<string | undefined>(productName);
  const [ctxUrl, setCtxUrl] = useState<string | undefined>(productUrl);

  const [projectType, setProjectType] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState("");
  const [neededBy, setNeededBy] = useState("");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Bot check, only needed when files are uploaded to our storage.
  const [turnstileToken, setTurnstileToken] = useState("");
  const [challengeAttempt, setChallengeAttempt] = useState(0);
  const clearTurnstileToken = useCallback(() => setTurnstileToken(""), []);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const filesRef = useRef<PickedFile[]>([]);
  filesRef.current = files;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hasProductContext = !!ctxName && !GENERIC_CONTEXT_NAMES.has(ctxName);

  // Listen for global open requests (first mounted instance only)
  useEffect(() => {
    globalListeners.push(instanceId);

    const handler = (e: Event) => {
      if (globalListeners[0] !== instanceId) return;
      const ce = e as CustomEvent<OpenPayload>;
      const d = ce?.detail || {};
      setCtxName(d.productName);
      setCtxUrl(d.productUrl);
      setOpen(true);
    };

    window.addEventListener(CUSTOM_REQUEST_OPEN_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(CUSTOM_REQUEST_OPEN_EVENT, handler as EventListener);
      const idx = globalListeners.indexOf(instanceId);
      if (idx !== -1) globalListeners.splice(idx, 1);
    };
  }, [instanceId]);

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

  // Clear the validation message once the user adds something
  useEffect(() => {
    setErr(null);
  }, [details, files.length]);

  // Revoke image previews on unmount
  useEffect(() => {
    return () => {
      filesRef.current.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    };
  }, []);

  function addFiles(incoming: File[]) {
    if (!incoming.length) return;
    setErr(null);

    const wrongType = incoming.filter(
      (f) => !ALLOWED_EXTENSIONS.has(f.name.slice(f.name.lastIndexOf(".") + 1).toLowerCase())
    );
    const tooBig = incoming.filter((f) => f.size > MAX_FILE_BYTES);
    const usable = incoming.filter((f) => !wrongType.includes(f) && !tooBig.includes(f));
    if (wrongType.length) {
      setErr("Only PNG, JPG, WebP, STL, 3MF, OBJ or ZIP files can be attached.");
    } else if (tooBig.length) {
      setErr("Each file must be 4 MB or smaller. Send bigger files directly on WhatsApp.");
    }

    const current = filesRef.current;
    const existing = new Set(current.map((p) => fileKey(p.file)));
    const room = Math.max(0, MAX_FILES - current.length);
    const fresh = usable.filter((f) => !existing.has(fileKey(f)));
    if (fresh.length > room) setErr(`You can attach up to ${MAX_FILES} files.`);
    const added = fresh.slice(0, room).map((file) => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    if (added.length) {
      const next = [...current, ...added];
      filesRef.current = next;
      setFiles(next);
    }
  }

  function removeFileAt(i: number) {
    setFiles((prev) => {
      const target = prev[i];
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  function resetForm() {
    files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    setProjectType(null);
    setDetails("");
    setSize("");
    setQuantity("");
    setNeededBy("");
    setFiles([]);
    setErr(null);
  }

  const buildMessage = (fileLinks: string[]) => {
    const lines: string[] = ["*New custom request*"];
    if (projectType) lines.push(`*Type:* ${projectType}`);
    if (hasProductContext) {
      lines.push(`*About:* ${ctxName}${ctxUrl ? ` (${ctxUrl})` : ""}`);
    }
    if (details.trim()) lines.push("", `*Details:*`, details.trim());
    const specs: string[] = [];
    if (size.trim()) specs.push(`*Size:* ${size.trim()}`);
    if (quantity.trim()) specs.push(`*Quantity:* ${quantity.trim()}`);
    if (neededBy.trim()) specs.push(`*Needed by:* ${neededBy.trim()}`);
    if (specs.length) lines.push("", ...specs);
    if (fileLinks.length) lines.push("", "*Files:*", ...fileLinks);
    return lines.join("\n");
  };

  const openWhatsApp = (text: string) => {
    const url = `https://wa.me/${phoneE164}?text=${encodeURIComponent(text)}`;
    const win = window.open(url, "_blank", "noopener,noreferrer");
    // Popup blockers can stop window.open after an async upload; fall back to same tab.
    if (!win) window.location.href = url;
  };

  async function send() {
    setErr(null);

    if (details.trim().length < 5 && files.length === 0) {
      setErr("Add a short description or a photo/file so we know what to quote.");
      return;
    }

    let links: string[] = [];

    if (files.length > 0) {
      if (!turnstileToken) {
        setErr("Please complete the security check under your files, then tap Send again.");
        return;
      }
      setBusy(true);
      try {
        const fd = new FormData();
        fd.set("details", details);
        if (hasProductContext && ctxName) fd.set("productName", ctxName);
        if (hasProductContext && ctxUrl) fd.set("productUrl", ctxUrl);
        for (const f of files) fd.append("files", f.file);
        fd.set("turnstileToken", turnstileToken);

        const res = await fetch("/api/custom-request", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Upload failed");
        links = Array.isArray(data?.urls) ? data.urls : [];
      } catch (e: unknown) {
        setErr(
          e instanceof Error
            ? `Couldn't upload your files: ${e.message}. Try again or send them directly on WhatsApp.`
            : "Couldn't upload your files. Try again or send them directly on WhatsApp."
        );
        // Each check passes once: get a fresh one for the retry.
        setTurnstileToken("");
        setChallengeAttempt((n) => n + 1);
        setBusy(false);
        return;
      }
      setTurnstileToken("");
      setChallengeAttempt((n) => n + 1);
      setBusy(false);
    }

    openWhatsApp(buildMessage(links));
    resetForm();
    setOpen(false);
  }

  const imageCount = useMemo(() => files.filter((f) => f.preview).length, [files]);

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#FF8B64]/60 focus:bg-white/[0.06]";
  const labelClass = "text-xs font-semibold uppercase tracking-wider text-white/55";

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
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            <div
              className="relative z-[10000] flex max-h-[92vh] w-full flex-col rounded-t-3xl sm:max-w-xl sm:rounded-3xl border border-white/10 bg-[#111113]/95 text-white shadow-2xl backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-5 pt-5 pb-3.5 sm:px-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                    Tell us about your project
                  </h2>
                  <p className="mt-0.5 text-[13px] sm:text-sm text-white/55">
                    We&rsquo;ll reply on WhatsApp with questions and a quote.
                  </p>
                  {hasProductContext && (
                    <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#FF8B64]/30 bg-[#FF8B64]/10 px-2.5 py-1 text-xs text-[#FFB59B]">
                      <span className="truncate">About: {ctxName}</span>
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="shrink-0 rounded-xl border border-white/12 bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.14)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15">
                <div>
                  <div className={labelClass}>What do you need?</div>
                  <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                    {PROJECT_TYPES.map((t) => {
                      const active = projectType === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setProjectType(active ? null : t)}
                          className={`rounded-full border px-3 py-1.5 text-[13px] sm:px-3.5 sm:text-sm transition ${
                            active
                              ? "border-[#FF8B64] bg-[#FF8B64] font-semibold text-[#0D0D0D]"
                              : "border-white/12 bg-white/[0.04] text-white/75 hover:border-white/25 hover:text-white"
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor={`${instanceId}-details`} className={labelClass}>
                    Describe it
                  </label>
                  <textarea
                    id={`${instanceId}-details`}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={3}
                    className={`${inputClass} min-h-[84px] resize-none`}
                    placeholder="What is it, what's it for, colours, logo or text, material if you know it…"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div>
                    <label htmlFor={`${instanceId}-size`} className={labelClass}>
                      Size
                    </label>
                    <input
                      id={`${instanceId}-size`}
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className={inputClass}
                      placeholder="20 × 10 cm"
                    />
                  </div>
                  <div>
                    <label htmlFor={`${instanceId}-qty`} className={labelClass}>
                      Quantity
                    </label>
                    <input
                      id={`${instanceId}-qty`}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      inputMode="numeric"
                      className={inputClass}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label htmlFor={`${instanceId}-date`} className={labelClass}>
                      Needed by
                    </label>
                    <input
                      id={`${instanceId}-date`}
                      value={neededBy}
                      onChange={(e) => setNeededBy(e.target.value)}
                      className={inputClass}
                      placeholder="Flexible"
                    />
                  </div>
                </div>

                <div>
                  <div className={labelClass}>Photos, sketches or 3D files</div>
                  <input
                    ref={fileInputRef}
                    className="hidden"
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,.stl,.3mf,.obj,.zip"
                    onChange={(e) => {
                      addFiles(Array.from(e.target.files || []));
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      addFiles(Array.from(e.dataTransfer.files || []));
                    }}
                    className={`mt-2 flex w-full flex-row items-center justify-center gap-3 rounded-2xl border border-dashed px-4 py-3.5 text-left transition ${
                      dragging
                        ? "border-[#FF8B64] bg-[#FF8B64]/10"
                        : "border-white/15 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.05]"
                    }`}
                  >
                    <ImagePlus size={22} className="text-[#FF8B64]" aria-hidden="true" />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium text-white/85">
                        {files.length ? "Add more files" : "Tap to add or drop files here"}
                      </span>
                      <span className="text-xs text-white/40">
                        JPG, PNG, WEBP, STL, 3MF, OBJ or ZIP
                      </span>
                    </span>
                  </button>

                  {files.length > 0 && (
                    <div className="mt-2.5 grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {files.map((f, i) => (
                        <div
                          key={fileKey(f.file)}
                          className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/30"
                        >
                          {f.preview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={f.preview}
                              alt={f.file.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2">
                              <FileBox size={22} className="text-white/50" aria-hidden="true" />
                              <span className="w-full truncate text-center text-[10px] text-white/60">
                                {f.file.name}
                              </span>
                            </div>
                          )}
                          <button
                            type="button"
                            aria-label={`Remove ${f.file.name}`}
                            onClick={() => removeFileAt(i)}
                            className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white/80 hover:bg-black hover:text-white transition"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {files.length > 0 && (
                    <p className="mt-2 text-xs text-white/40">
                      {files.length} file{files.length === 1 ? "" : "s"}
                      {imageCount > 0 && imageCount !== files.length
                        ? ` (${imageCount} image${imageCount === 1 ? "" : "s"})`
                        : ""}
                    </p>
                  )}
                  {files.length > 0 && (
                    <Turnstile
                      key={challengeAttempt}
                      action="custom_request"
                      onVerify={setTurnstileToken}
                      onExpire={clearTurnstileToken}
                    />
                  )}
                </div>

                {err && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                  >
                    {err}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-white/[0.07] px-5 py-3.5 sm:px-6">
                <button
                  type="button"
                  disabled={busy}
                  onClick={send}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3.5 text-sm sm:text-base font-bold text-[#0B2A17] shadow-lg transition hover:bg-[#3ee07a] active:scale-[0.99] disabled:opacity-60"
                >
                  <MessageCircle size={18} aria-hidden="true" />
                  {busy ? "Uploading files…" : "Send on WhatsApp"}
                </button>
                <p className="mt-2 text-center text-xs text-white/40">
                  Opens WhatsApp with your request filled in. Review it and hit send.
                </p>
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
