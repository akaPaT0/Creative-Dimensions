"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import ContactOptions from "../../components/ContactOptions";

export default function ContactModalRoute() {
  const router = useRouter();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      // Let the custom request popup handle Escape when it's open on top.
      if (e.key === "Escape" && !document.querySelector('[role="dialog"][aria-label="Custom request"]')) {
        router.back();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [router]);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Contact"
    >
      <button
        aria-label="Close contact"
        onClick={() => router.back()}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#111113]/95 p-5 text-white shadow-2xl backdrop-blur-xl sm:max-w-lg sm:rounded-3xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Get in touch</h1>
            <p className="mt-0.5 text-sm text-white/55">Questions, custom pieces or business orders.</p>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Close"
            className="shrink-0 rounded-xl border border-white/12 bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <ContactOptions />
      </div>
    </div>
  );
}
