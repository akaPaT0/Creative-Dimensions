import type { Metadata } from "next";
import { getAuthReturnPath } from "@/app/lib/auth-navigation";

export const metadata: Metadata = {
  title: "Sign-in help | Creative Dimensions",
  robots: { index: false, follow: false },
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = getAuthReturnPath((await searchParams).next);
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6 py-28 text-white">
      <p className="text-sm font-medium text-[#3BC7C4]">Creative Dimensions</p>
      <h1 className="mt-3 text-3xl font-semibold">Let’s try signing in again</h1>
      <p className="mt-4 text-white/65">
        Google sign-in wasn’t completed. Your link may have expired, or you may have cancelled.
        Please try again in the same browser where you started.
      </p>
      <a
        href={`/auth/google?next=${encodeURIComponent(next)}`}
        className="mt-7 rounded-xl bg-[#FF8B64] px-5 py-3 text-center font-medium text-black"
      >
        Try Google sign-in again
      </a>
      <a href={next} className="mt-3 rounded-xl border border-white/15 px-5 py-3 text-center text-white/80">
        Back to the shop
      </a>
      <p className="mt-6 text-sm text-white/55">
        Need help? <a href="mailto:support@creativedimensionslb.com" className="underline">Contact support</a>
      </p>
    </section>
  );
}
