"use client";

import { useRouter } from "next/navigation";

export default function ContactModalRoute() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[999]">
      {/* Backdrop */}
      <button
        aria-label="Close contact"
        onClick={() => router.back()}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative mx-auto mt-24 w-[92%] max-w-xl">
        <div className="rounded-3xl border border-white/10 bg-[#0D0D0D]/70 backdrop-blur-xl backdrop-saturate-150 shadow-[0_0_60px_rgba(0,0,0,0.55)] p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-white text-2xl sm:text-3xl font-semibold">
                Contact
              </h1>
              <p className="text-white/70 mt-1">
                Send a message and we’ll reply ASAP.
              </p>
            </div>

            <button
              onClick={() => router.back()}
              className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80 hover:bg-white/10"
            >
              Close
            </button>
          </div>

          <div className="mt-6 space-y-3">
            <a
              className="block rounded-2xl border border-white/10 bg-white/5 p-4 text-white hover:bg-white/10 transition"
              href="mailto:info@creativedimensionslb.com"
            >
              Email: <span className="text-white/80">info@creativedimensionslb.com</span>
            </a>

            <a
              className="block rounded-2xl border border-white/10 bg-white/5 p-4 text-white hover:bg-white/10 transition"
              href="https://instagram.com/creativedimensions.lb"
              target="_blank"
              rel="noreferrer"
            >
              Instagram: <span className="text-white/80">@creativedimensions.lb</span>
            </a>

            <a
              className="block rounded-2xl border border-white/10 bg-white/5 p-4 text-white hover:bg-white/10 transition"
              href="/shop"
            >
              Browse shop
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
