"use client";

import { useEffect, useMemo, useState } from "react";

type LinkCardProps = {
  title: string;
  description: string;
  url: string;
  image?: string;
};

type PreviewData = {
  title?: string | null;
  description?: string | null;
  image?: string | null;
};

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getFavicon(url: string) {
  try {
    const u = new URL(url);
    return `${u.origin}/favicon.ico`;
  } catch {
    return null;
  }
}

export default function LinkCard({
  title,
  description,
  url,
  image,
}: LinkCardProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (!res.ok) return;

        const data = await res.json();
        if (!cancelled) setPreview(data);
      } catch {}
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [url]);

  const hostname = useMemo(() => getHostname(url), [url]);
  const favicon = useMemo(() => getFavicon(url), [url]);

  const coverImage = image || null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition hover:border-white/20 hover:bg-white/10"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-white/10 via-white/[0.03] to-transparent">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-start justify-end p-5">
            {favicon ? (
              <img
                src={favicon}
                alt=""
                className="mb-3 h-10 w-10 rounded-xl bg-white p-1 shadow"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : null}

            <p className="text-sm text-white/45">{hostname}</p>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      <div className="p-4">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/65">{description}</p>
        <p className="mt-3 truncate text-xs text-white/40">{url}</p>
      </div>
    </a>
  );
}