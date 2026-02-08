"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutGrid, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function AdminShortcutFab() {
  const { isLoaded, isSignedIn } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;

    async function checkAdmin() {
      if (!isLoaded || !isSignedIn) {
        if (alive) setIsAdmin(false);
        return;
      }
      const res = await fetch("/api/admin/me", { cache: "no-store" });
      if (!alive) return;
      setIsAdmin(res.ok);
    }

    void checkAdmin();
    return () => {
      alive = false;
    };
  }, [isLoaded, isSignedIn]);

  if (!isAdmin) return null;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[79] flex items-end justify-end p-4 sm:p-5">
          <button
            type="button"
            aria-label="Close shortcuts"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          />

          <div className="relative z-[80] w-full max-w-[280px] rounded-2xl border border-white/15 bg-[#0D0D0D]/90 p-3 shadow-[0_20px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium text-white/85">Admin Shortcuts</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/75 hover:bg-white/10 transition"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid gap-2">
              <Link
                href="/admin?tab=create"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition"
              >
                Add Items
              </Link>
              <Link
                href="/admin?tab=catalog"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition"
              >
                Edit Catalogue
              </Link>
              <Link
                href="/admin/filaments"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition"
              >
                Available Filaments
              </Link>
              <Link
                href="/admin?tab=orders"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition"
              >
                Orders
              </Link>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open admin shortcuts"
        className="fixed bottom-5 right-5 z-[81] inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-[#0D0D0D]/85 text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-md hover:bg-[#0D0D0D] transition"
      >
        <LayoutGrid size={18} />
      </button>
    </>
  );
}
