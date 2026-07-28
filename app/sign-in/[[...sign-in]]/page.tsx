"use client";

import { useState } from "react";
import Link from "next/link";
import AuthModal from "@/app/components/AuthModal";

export default function Page() {
  const [open, setOpen] = useState(true);

  return (
    <main className="min-h-screen bg-[#0D0D0D] px-4 py-24 text-white">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-white/60">Access your Creative Dimensions account.</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-6 rounded-xl bg-[#FF8B64] px-5 py-3 font-medium text-black"
        >
          Open sign in
        </button>
        <Link href="/" className="mt-4 block text-sm text-white/60 hover:text-white">
          Back home
        </Link>
      </div>
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </main>
  );
}
