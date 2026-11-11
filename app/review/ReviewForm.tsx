"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Star } from "lucide-react";
import Turnstile from "../components/Turnstile";
import { REVIEW_LIMITS, orderProductSummary } from "@/app/lib/reviews";
import { authFetch, useSupabaseAuth } from "@/app/lib/supabase/auth-client";

type MyOrder = { orderNumber: string; createdAt: string; items?: { name: string }[] };

const orderDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

const RATING_WORDS = ["", "Poor", "Fair", "Good", "Great", "Amazing"];

const input =
  "w-full rounded-xl border border-white/10 bg-[#0f0f11] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#FF8B64]/60 focus:ring-2 focus:ring-[#FF8B64]/15 disabled:opacity-60";
const label = "block text-xs font-semibold uppercase tracking-[0.08em] text-white/50";

export default function ReviewForm({
  initialName = "",
  initialProduct = "",
  initialOrderRef = "",
}: {
  initialName?: string;
  initialProduct?: string;
  initialOrderRef?: string;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState(initialName);
  const [product, setProduct] = useState(initialProduct);
  const [orderRef, setOrderRef] = useState(initialOrderRef);
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [token, setToken] = useState("");
  const [challengeAttempt, setChallengeAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const { isLoaded, isSignedIn } = useSupabaseAuth();
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  // The link already says which order this is, so don't ask again.
  const orderFromLink = Boolean(initialOrderRef);

  // Signed-in clients pick from their own orders instead of typing a number.
  useEffect(() => {
    if (orderFromLink || !isLoaded || !isSignedIn) return;
    let alive = true;
    authFetch("/api/orders", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { orders: [] }))
      .then((data: { orders?: MyOrder[] }) => {
        if (alive) setMyOrders(Array.isArray(data.orders) ? data.orders.slice(0, 30) : []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [orderFromLink, isLoaded, isSignedIn]);

  function pickOrder(orderNumber: string) {
    setOrderRef(orderNumber);
    const picked = myOrders.find((o) => o.orderNumber === orderNumber);
    if (picked && !product.trim()) setProduct(orderProductSummary(picked.items));
  }

  const clearToken = useCallback(() => setToken(""), []);
  const shown = hover || rating;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!rating) return setError("Please pick a star rating.");
    if (!name.trim()) return setError("Please add your name.");
    if (comment.trim().length < REVIEW_LIMITS.commentMin) {
      return setError(`Please write at least ${REVIEW_LIMITS.commentMin} characters.`);
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, name, product, orderRef, comment, website, turnstileToken: token }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not send your review. Please try again.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your review. Please try again.");
      setToken("");
      setChallengeAttempt((n) => n + 1);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#141417]/90 p-6 sm:p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[#FF8B64]" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="mt-4 text-xl font-bold">Thank you{name.trim() ? `, ${name.trim().split(/\s+/)[0]}` : ""}!</h2>
        <p className="mt-2 text-sm text-white/60">
          We got your review. It will show on the site once we&rsquo;ve had a look.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/shop"
            className="inline-flex rounded-xl bg-[#FF8B64] px-5 py-2.5 text-sm font-bold text-[#0D0D0D] transition hover:bg-[#ffa282]"
          >
            Keep shopping
          </Link>
          <Link
            href="/reviews"
            className="inline-flex rounded-xl border border-white/10 bg-[#232326] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2c2c30]"
          >
            Read other reviews
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-5 rounded-3xl border border-white/10 bg-[#141417]/90 p-5 sm:p-7"
    >
      <fieldset>
        <legend className={label}>Your rating</legend>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex gap-1" role="radiogroup" aria-label="Star rating" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onFocus={() => setHover(n)}
                onBlur={() => setHover(0)}
                className="rounded-md p-0.5 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8B64]/60"
              >
                <Star
                  className={`h-9 w-9 transition ${n <= shown ? "fill-[#FF8B64] text-[#FF8B64]" : "text-white/25"}`}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
          <span className="text-sm font-semibold text-white/70" aria-live="polite">
            {RATING_WORDS[shown]}
          </span>
        </div>
      </fieldset>

      <label className="block">
        <span className={label}>Your name</span>
        <input
          className={`${input} mt-1.5`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={REVIEW_LIMITS.name}
          autoComplete="name"
          placeholder="e.g. Rana Khoury"
          required
        />
        <span className="mt-1.5 block text-xs text-white/40">We only show your first name and last initial.</span>
      </label>

      <label className="block">
        <span className={label}>What did you get? <span className="normal-case tracking-normal text-white/30">(optional)</span></span>
        <input
          className={`${input} mt-1.5`}
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          maxLength={REVIEW_LIMITS.product}
          placeholder="e.g. Ghost Candy Bowl, custom keychain"
        />
      </label>

      <label className="block">
        <span className={label}>Your review</span>
        <textarea
          className={`${input} mt-1.5 min-h-[130px] resize-y`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={REVIEW_LIMITS.comment}
          placeholder="How was the print quality, the colours, delivery, the whole experience?"
          required
        />
        <span className="mt-1.5 block text-right text-[11px] tabular-nums text-white/30">
          {comment.length}/{REVIEW_LIMITS.comment}
        </span>
      </label>

      {orderFromLink ? (
        <p className="text-xs text-white/40">
          Reviewing order <span className="font-mono text-white/60">{orderRef}</span>
        </p>
      ) : (
        myOrders.length > 0 && (
          <label className="block">
            <span className={label}>Which order? <span className="normal-case tracking-normal text-white/30">(optional, never shown)</span></span>
            <select
              className={`${input} mt-1.5 [&>option]:bg-[#161619]`}
              value={orderRef}
              onChange={(e) => pickOrder(e.target.value)}
            >
              <option value="">Not listed / ordered on WhatsApp or Instagram</option>
              {myOrders.map((o) => (
                <option key={o.orderNumber} value={o.orderNumber}>
                  {orderDate.format(new Date(o.createdAt))} · {orderProductSummary(o.items) || o.orderNumber}
                </option>
              ))}
            </select>
          </label>
        )
      )}

      {/* Honeypot for bots: hidden from people and screen readers. */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <Turnstile key={challengeAttempt} action="review" onVerify={setToken} onExpire={clearToken} />

      {error && (
        <p role="alert" className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-[#FF8B64] px-5 py-3 text-sm font-bold text-[#0D0D0D] transition hover:bg-[#ffa282] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Send review"}
      </button>
      <p className="text-center text-xs text-white/35">
        Reviews appear on our site after a quick check. See our <Link href="/privacy" className="underline hover:text-white/60">privacy policy</Link>.
      </p>
    </form>
  );
}
