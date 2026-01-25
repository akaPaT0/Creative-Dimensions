"use client";

import { useState } from "react";

export default function ShareButton({
  url,
  title,
  className = "",
}: {
  url: string;
  title: string;
  className?: string;
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
    <button type="button" onClick={share} className={className}>
      {copied ? "Copied ✅" : "Share"}
    </button>
  );
}
