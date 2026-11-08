"use client";

import { FormEvent, useCallback, useState } from "react";
import { X } from "lucide-react";
import Turnstile from "@/app/components/Turnstile";
import { useSupabaseAuth } from "@/app/lib/supabase/auth-client";

type Props = {
  open: boolean;
  mode?: "sign-in" | "sign-up";
  onClose: () => void;
};

export default function AuthModal({ open, mode = "sign-in", onClose }: Props) {
  const { signIn, signUp } = useSupabaseAuth();
  const [authMode, setAuthMode] = useState<NonNullable<Props["mode"]> | "forgot-password">(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [turnstileToken, setTurnstileToken] = useState("");
  const [challengeAttempt, setChallengeAttempt] = useState(0);
  const clearTurnstileToken = useCallback(() => setTurnstileToken(""), []);
  const needsBotCheck = process.env.NODE_ENV === "production" || Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (authMode === "forgot-password") {
      try {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), turnstileToken }),
        });
        const body = await response.json();
        setMessage(response.ok ? body.message : body.error);
      } catch {
        setMessage("Could not request a password reset. Please try again.");
      } finally {
        setLoading(false);
        clearTurnstileToken();
        setChallengeAttempt((attempt) => attempt + 1);
      }
      return;
    }

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
              {authMode === "forgot-password" ? "Reset password" : authMode === "sign-up" ? "Create account" : "Sign in"}
            </h2>
            <p className="mt-1 text-sm text-white/60">
              {authMode === "forgot-password" ? "Enter your email to get a reset link." : "Use your Creative Dimensions account."}
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
          {authMode !== "forgot-password" && <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/35"
          />}
        </div>

        {authMode === "sign-in" && (
          <button type="button" className="mt-3 text-sm text-[#FF8B64] hover:underline" onClick={() => {
            setMessage("");
            clearTurnstileToken();
            setAuthMode("forgot-password");
          }}>
            Forgot password?
          </button>
        )}

        {authMode === "forgot-password" && needsBotCheck && (
          <Turnstile key={challengeAttempt} onVerify={setTurnstileToken} onExpire={clearTurnstileToken} />
        )}

        {message && <p role="status" className="mt-3 text-sm text-white/70">{message}</p>}

        <button
          type="submit"
          disabled={loading || (authMode === "forgot-password" && needsBotCheck && !turnstileToken)}
          className="mt-5 w-full rounded-xl bg-[#FF8B64] px-4 py-3 font-medium text-black transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Working..." : authMode === "forgot-password" ? "Send reset link" : authMode === "sign-up" ? "Create account" : "Sign in"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMessage("");
            clearTurnstileToken();
            setAuthMode(authMode === "sign-in" ? "sign-up" : "sign-in");
          }}
          className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white/80 transition hover:bg-white/10"
        >
          {authMode === "forgot-password" ? "Back to sign in" : authMode === "sign-up"
            ? "Already have an account? Sign in"
            : "Need an account? Create one"}
        </button>
      </form>
    </div>
  );
}
