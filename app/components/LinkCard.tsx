"use client";

import { useEffect, useState } from "react";

type LinkCardProps = {
  title: string;
  description: string;
  url: string;
};

type PreviewData = {
  title?: string | null;
  description?: string | null;
  image?: string | null;
};

export default function LinkCard({ title, description, url }: LinkCardProps) {
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

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition hover:border-white/20 hover:bg-white/10"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-white/5">
        {preview?.image ? (
          <img
            src={preview.image}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-white/40">
            No preview
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/65">{description}</p>
        <p className="mt-3 truncate text-xs text-white/40">{url}</p>
      </div>
    </a>
  );
}