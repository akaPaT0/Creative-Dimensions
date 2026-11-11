import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";
import ReviewForm from "./ReviewForm";

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

// Prefill with links like /review?product=Ghost%20Candy%20Bowl&order=CD-0000123&name=Rana
export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  return (
    <div className="relative min-h-screen text-white">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">How did we do?</h1>
          <p className="mt-2 text-sm sm:text-base text-white/60">
            Thanks for ordering from Creative Dimensions. A quick review helps other people find us and helps us
            print better. It takes less than a minute.
          </p>
          <div className="mt-6">
            <ReviewForm
              initialName={first(sp.name).slice(0, 60)}
              initialProduct={first(sp.product).slice(0, 120)}
              initialOrderRef={first(sp.order).slice(0, 40)}
            />
          </div>
        </div>

        <div className="mt-14">
          <Footer />
        </div>
      </main>
    </div>
  );
}
