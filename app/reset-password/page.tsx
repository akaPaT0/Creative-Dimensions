"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { validatePassword } from "@/app/lib/security/password-policy";
import Background from "../components/Background";

function subscribeToHashChange(notify: () => void) {
  window.addEventListener("hashchange", notify);
  return () => window.removeEventListener("hashchange", notify);
}

function getRecoveryToken() {
  return new URLSearchParams(window.location.hash.slice(1)).get("recovery");
}

export default function ResetPasswordPage() {
  const recoveryToken = useSyncExternalStore(subscribeToHashChange, getRecoveryToken, () => undefined);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordStrength = validatePassword(password);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!recoveryToken || loading) return;

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!passwordStrength.valid) {
      setError(`Password needs: ${passwordStrength.errors[0]}`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, tokenHash: recoveryToken }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Failed to update password.");
        return;
      }

      const url = new URL(window.location.href);
      url.hash = "";
      window.history.replaceState(window.history.state, "", url);
      setSuccess(true);
    } catch {
      setError("Could not update your password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0D0D0D] text-white">
      <Background />
      <main className="relative z-20 flex min-h-screen items-center justify-center px-4 py-20">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0D0D0D]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Set New Password</h1>
            <p className="mt-1 text-sm text-white/60">
              Choose a new password for your Creative Dimensions account.
            </p>
          </div>

          {recoveryToken === undefined ? (
            <p className="mt-6 text-center text-sm text-white/60">Checking reset link…</p>
          ) : success ? (
            <div className="mt-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                ✓
              </div>
              <p className="mt-3 text-emerald-400 font-medium">Password updated successfully!</p>
              <p className="mt-1 text-xs text-white/50">Sign in with your new password.</p>
              <Link
                href="/sign-in"
                className="mt-5 inline-block rounded-xl bg-[#FF8B64] px-5 py-2.5 text-sm font-medium text-black"
              >
                Sign in
              </Link>
            </div>
          ) : !recoveryToken ? (
            <p className="mt-6 text-center text-sm text-white/70">
              Open the link in your reset email or <Link href="/sign-in" className="underline">request a new link</Link>.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <div>
                <label className="text-xs text-white/60">New Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-[#FF8B64]/60 transition"
                />

                {password.length > 0 && (
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

              <div>
                <label className="text-xs text-white/60">Confirm Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-[#FF8B64]/60 transition"
                />
              </div>

              {error && <p className="text-xs text-rose-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-[#FF8B64] px-4 py-3 font-medium text-black transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>

              <Link
                href="/sign-in"
                className="text-center text-xs text-white/50 hover:text-white transition"
              >
                Back to Sign in
              </Link>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
