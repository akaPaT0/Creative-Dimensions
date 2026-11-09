import Image from "next/image";
import Link from "next/link";
import { Anton } from "next/font/google";

const display = Anton({ weight: "400", subsets: ["latin"], display: "swap" });

export type HeroEventItem = {
  key: string;
  slug: string;
  href: string;
  title: string;
  image: string;
  price?: string;
};

type Props = {
  word: string;
  eyebrow: string;
  blurb: string;
  href: string;
  ctaLabel: string;
  items: HeroEventItem[];
};

// Lineup slots from left to right. The middle slot is the hero piece and sits on top.
// Outer slots are hidden on phones so the three middle pieces stay large;
// on phones only the centre piece shows its name and price.
const SLOTS = [
  "hidden sm:block w-[22%] -mr-[6%] z-10",
  "w-[44%] shrink-0 sm:shrink sm:w-[26%] -mr-[14%] sm:-mr-[6%] z-20",
  "w-[64%] shrink-0 sm:shrink sm:w-[34%] z-30",
  "w-[44%] shrink-0 sm:shrink sm:w-[26%] -ml-[14%] sm:-ml-[6%] z-20",
  "hidden sm:block w-[22%] -ml-[6%] z-10",
];

// Put the first configured piece in the centre, then fan the rest outwards.
const ORDER = [3, 1, 0, 2, 4];

export default function HeroEventDrop({ word, eyebrow, blurb, href, ctaLabel, items }: Props) {
  const lineup = ORDER.map((i) => items[i]).filter(Boolean);
  if (lineup.length === 0) return null;
  const slots = lineup.length === SLOTS.length ? SLOTS : SLOTS.slice(0, lineup.length);

  return (
    <section
      aria-label={`${word} drop`}
      className="relative isolate -mx-4 sm:-mx-6 lg:-mx-10 xl:-mx-14 overflow-hidden bg-[#0b0b0b] [mask-image:linear-gradient(to_bottom,transparent,black_9%,black_88%,transparent),linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] [mask-composite:intersect] [-webkit-mask-composite:source-in]"
    >
      {/* floor light shared by the whole lineup */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[14%] h-[45%] bg-[radial-gradient(50%_60%_at_50%_100%,rgba(255,110,30,0.20),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 xl:px-14 pt-12 sm:pt-16">
        <p className="text-center text-[11px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-[#ff8a3d]/90">
          {eyebrow}
        </p>

        {/* the word sits behind the lineup; each photo fades into the stage at its edges */}
        <p
          aria-hidden="true"
          className={`${display.className} pointer-events-none select-none text-center uppercase leading-[0.8] tracking-[0.01em] text-[21vw] sm:text-[19vw] xl:text-[17.5rem] mt-3 sm:mt-2 bg-gradient-to-b from-[#ff8a3d] via-[#b8460f] to-[#2a0f05] bg-clip-text text-transparent`}
        >
          {word}
        </p>

        <ul className="relative -mt-[13vw] sm:-mt-[12vw] xl:-mt-[11rem] flex items-end justify-center">
          {lineup.map((item, i) => {
            const isLantern = /lantern/.test(item.slug);
            return (
              <li key={item.key} className={`relative ${slots[i]}`}>
                <Link
                  href={item.href}
                  className="group relative block transition-transform duration-500 ease-out hover:-translate-y-2 focus-visible:-translate-y-2 focus-visible:outline-none"
                >
                  <span className="relative block aspect-square">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      priority={i === 2}
                      sizes="(max-width: 640px) 64vw, (max-width: 1440px) 34vw, 490px"
                      className="object-contain [mask-image:radial-gradient(closest-side,black_62%,transparent)] transition duration-500 group-hover:brightness-110"
                    />
                    {isLantern && (
                      <span
                        className="lantern-flicker pointer-events-none absolute inset-[22%] rounded-full bg-[radial-gradient(closest-side,rgba(110,255,50,0.28),transparent)] mix-blend-screen blur-2xl"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <span
                    className={`relative -mt-[9%] flex-col items-center text-center leading-tight ${
                      i === 2 ? "flex" : "hidden sm:flex"
                    }`}
                  >
                    <span className="max-w-[92%] truncate text-[10px] sm:text-xs font-semibold text-white/70 group-hover:text-white transition-colors">
                      {item.title}
                    </span>
                    {item.price && (
                      <span className="mt-0.5 text-[10px] sm:text-xs font-medium text-[#ff8a3d]/80">
                        {item.price}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="relative mx-auto mt-6 sm:mt-8 flex max-w-3xl flex-col items-center gap-5 pb-16 sm:pb-20 text-center">
          <p className="max-w-xl text-sm sm:text-base text-white/65 leading-relaxed">{blurb}</p>
          <Link
            href={href}
            className="inline-flex items-center justify-center rounded-2xl bg-[#ff7a28] px-8 py-3.5 text-sm sm:text-base font-bold text-[#0D0D0D] hover:bg-[#ff9a55] transition hover:scale-[1.02] active:scale-[0.98]"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
