"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { useSupabaseAuth } from "@/app/lib/supabase/auth-client";
import Turnstile from "@/app/components/Turnstile";
import { validatePassword } from "@/app/lib/security/password-policy";

type AuthMode = "sign-in" | "sign-up" | "forgot-password";

type Props = {
  open: boolean;
  mode?: "sign-in" | "sign-up";
  onClose: () => void;
};

export default function AuthModal({ open, mode = "sign-in", onClose }: Props) {
  const { signIn, signUp } = useSupabaseAuth();
  const [authMode, setAuthMode] = useState<AuthMode>(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);

  if (!open) return null;

  const passwordStrength = authMode === "sign-up" ? validatePassword(password) : null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setIsSuccessMessage(false);

    if (authMode === "forgot-password") {
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), turnstileToken }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage(data.error || "Failed to send reset link. Please try again.");
          return;
        }
        setIsSuccessMessage(true);
        setMessage(
          data.message ||
            "If an account exists with that email, a password reset link has been sent."
        );
      } catch {
        setMessage("Failed to send reset link. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (authMode === "sign-up" && passwordStrength && !passwordStrength.valid) {
      setMessage(`Password needs: ${passwordStrength.errors[0]}`);
      setLoading(false);
      return;
    }

    const result =
      authMode === "sign-up"
        ? await signUp(email.trim(), password, turnstileToken)
        : await signIn(email.trim(), password, turnstileToken);

    setLoading(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }

    if (authMode === "sign-up") {
      setIsSuccessMessage(true);
      setMessage("Check your email to confirm your account.");
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close modal"
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
              {authMode === "sign-up"
                ? "Create account"
                : authMode === "forgot-password"
                ? "Reset password"
                : "Sign in"}
            </h2>
            <p className="mt-1 text-sm text-white/60">
              {authMode === "forgot-password"
                ? "Enter your email to receive a recovery link."
                : "Use your Creative Dimensions account."}
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

        {authMode !== "forgot-password" && (
          <div className="mt-5">
            <button
              type="button"
              disabled={loading || googleLoading}
              onClick={() => {
                setGoogleLoading(true);
                const next = window.location.pathname + window.location.search;
                window.location.assign(`/auth/google?next=${encodeURIComponent(next)}`);
              }}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white px-4 py-3 font-medium text-[#1f1f1f] transition hover:bg-white/90 disabled:opacity-60"
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48">
                <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.2h6.7c3.9-3.6 6-8.9 6-15.1Z" />
                <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.2c-1.8 1.2-4.1 1.9-6.8 1.9-5.3 0-9.8-3.6-11.4-8.4H5.7v5.4A20.4 20.4 0 0 0 24 44Z" />
                <path fill="#FBBC05" d="M12.6 27.4a12.2 12.2 0 0 1 0-7.8v-5.4H5.7a20 20 0 0 0 0 18.6l6.9-5.4Z" />
                <path fill="#EA4335" d="M24 11.2c3 0 5.6 1 7.7 3l5.8-5.8A19.5 19.5 0 0 0 24 3a20.4 20.4 0 0 0-18.3 11.2l6.9 5.4C14.2 14.8 18.7 11.2 24 11.2Z" />
              </svg>
              {googleLoading ? "Opening Google…" : "Continue with Google"}
            </button>
            <div className="mt-4 flex items-center gap-3 text-xs text-white/45">
              <span className="h-px flex-1 bg-white/10" />
              or continue with email
              <span className="h-px flex-1 bg-white/10" />
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-[#FF8B64]/60 transition"
          />

          {authMode !== "forgot-password" && (
            <div>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-[#FF8B64]/60 transition"
              />

              {authMode === "sign-in" && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setMessage("");
                      setIsSuccessMessage(false);
                      setAuthMode("forgot-password");
                    }}
                    className="text-xs text-[#FF8B64] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {authMode === "sign-up" && password.length > 0 && passwordStrength && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1.5 h-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          passwordStrength.score >= level
                            ? level <= 1
                              ? "bg-rose-500"
                              : level <= 2
                              ? "bg-amber-400"
                              : level <= 3
                              ? "bg-sky-400"
                              : "bg-emerald-400"
                            : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  {passwordStrength.errors.length > 0 && (
                    <p className="text-[11px] text-white/50">
                      Needs: {passwordStrength.errors.join(" • ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Turnstile Bot Shield */}
        <div className="mt-3">
          <Turnstile
            onVerify={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken("")}
            theme="dark"
          />
        </div>

        {message && (
          <p
            className={`mt-3 text-sm ${
              isSuccessMessage ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="mt-4 w-full rounded-xl bg-[#FF8B64] px-4 py-3 font-medium text-black transition hover:opacity-90 disabled:opacity-60"
        >
          {loading
            ? "Working..."
            : authMode === "sign-up"
            ? "Create account"
            : authMode === "forgot-password"
            ? "Send reset link"
            : "Sign in"}
        </button>

        {authMode === "forgot-password" ? (
          <button
            type="button"
            onClick={() => {
              setMessage("");
              setIsSuccessMessage(false);
              setAuthMode("sign-in");
            }}
            className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white/80 transition hover:bg-white/10"
          >
            Back to Sign in
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMessage("");
              setIsSuccessMessage(false);
              setTurnstileToken("");
              setAuthMode(authMode === "sign-up" ? "sign-in" : "sign-up");
            }}
            className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white/80 transition hover:bg-white/10"
          >
            {authMode === "sign-up"
              ? "Already have an account? Sign in"
              : "Need an account? Create one"}
          </button>
        )}
      </form>
    </div>
  );
}
