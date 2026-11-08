"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export default function ShareButton({
  url,
  title,
  className = "",
  iconOnly = false,
}: {
  url: string;
  title: string;
  className?: string;
  /** Show a share icon instead of text. */
  iconOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      // ignore cancel
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {
      window.prompt("Copy link:", url);
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className={className}
      aria-label={iconOnly ? (copied ? "Link copied" : "Share") : undefined}
      title={iconOnly ? (copied ? "Link copied" : "Share") : undefined}
    >
      {iconOnly ? (
        copied ? <Check size={18} strokeWidth={2.6} /> : <Share2 size={18} />
      ) : copied ? (
        "Copied ✅"
      ) : (
        "Share"
      )}
    </button>
  );
}
