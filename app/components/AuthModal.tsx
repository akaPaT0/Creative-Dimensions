"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { useSupabaseAuth } from "@/app/lib/supabase/auth-client";

type Props = {
  open: boolean;
  mode?: "sign-in" | "sign-up";
  onClose: () => void;
};

export default function AuthModal({ open, mode = "sign-in", onClose }: Props) {
  const { signIn, signUp } = useSupabaseAuth();
  const [authMode, setAuthMode] = useState(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const result =
      authMode === "sign-up"
        ? await signUp(email.trim(), password)
        : await signIn(email.trim(), password);

    setLoading(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }

    if (authMode === "sign-up") {
      setMessage("Check your email to confirm your account.");
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close sign in"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0D0D0D]/95 p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">
              {authMode === "sign-up" ? "Create account" : "Sign in"}
            </h2>
            <p className="mt-1 text-sm text-white/60">
              Use your Creative Dimensions account.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/35"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/35"
          />
        </div>

        {message && <p className="mt-3 text-sm text-white/70">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-[#FF8B64] px-4 py-3 font-medium text-black transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Working..." : authMode === "sign-up" ? "Create account" : "Sign in"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMessage("");
            setAuthMode(authMode === "sign-up" ? "sign-in" : "sign-up");
          }}
          className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white/80 transition hover:bg-white/10"
        >
          {authMode === "sign-up"
            ? "Already have an account? Sign in"
            : "Need an account? Create one"}
        </button>
      </form>
    </div>
  );
}
