import Background from "./components/Background";
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function Home() {
  return (
    <main className="relative min-h-screen text-white">
      <Background />
      <section className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-white/70">
          Creative Dimensions
        </p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
          We’re Updating Our Website
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
          We’re refining a few things behind the scenes. Thanks for your
          patience — we’ll be back soon.
        </p>
      </section>
    </main>
  );
}