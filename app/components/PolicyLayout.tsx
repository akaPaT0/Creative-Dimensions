import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type PolicySectionLink = { id: string; title: string };

export const policyLinkClass =
  "rounded-sm font-medium text-[#ffad92] underline decoration-[#ff8b64]/50 underline-offset-4 hover:text-[#ffd2c2] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffad92]";

export function PolicySection({
  section,
  index,
  children,
}: {
  section: PolicySectionLink;
  index: number;
  children: React.ReactNode;
}) {
  return (
    <section id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-8 border-t border-[#332e2e] py-8 sm:py-10">
      <div className="mb-4 flex items-baseline gap-3 sm:gap-4">
        <span aria-hidden="true" className="font-mono text-sm text-[#ff9e7f]">0{index + 1}</span>
        <h2 id={`${section.id}-title`} className="text-[1.55rem] leading-tight font-semibold tracking-[-0.035em] text-[#fcf4ef] sm:text-3xl">
          {section.title}
        </h2>
      </div>
      <div className="space-y-4 text-base leading-[1.75] text-[#d0c5c1]">{children}</div>
    </section>
  );
}

export default function PolicyLayout({
  title,
  description,
  updatedOn,
  sections,
  relatedLink,
  children,
}: {
  title: string;
  description: string;
  updatedOn: string;
  sections: readonly PolicySectionLink[];
  relatedLink: { href: string; label: string };
  children: React.ReactNode;
}) {
  const updatedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(updatedOn));

  return (
    <main className="min-h-screen bg-[#100f10] text-[#fcf4ef]">
      <div className="mx-auto max-w-[73rem] px-5 pb-14 sm:px-8 lg:px-10">
        <header className="flex min-h-20 items-center justify-between gap-4">
          <Link href="/" className="rounded-sm text-[0.9rem] leading-tight font-semibold text-[#fcf4ef] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffad92] sm:text-base">
            Creative Dimensions<span aria-hidden="true" className="ml-0.5 text-[#ff8b64]">.</span>
          </Link>
          <Link href="/shop" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#433734] px-3 py-2.5 text-xs font-medium text-[#f0ded6] transition hover:border-[#ff8b64]/60 hover:bg-[#ff8b64]/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffad92] sm:px-4 sm:text-sm">
            <ArrowLeft size={14} aria-hidden="true" /> Back to shop
          </Link>
        </header>

        <div className="overflow-hidden rounded-[1.55rem] border border-[#46312b] bg-linear-to-br from-[#281b19] via-[#1c1516] to-[#15191a] px-6 py-9 sm:rounded-[2rem] sm:px-11 sm:py-12 lg:px-14 lg:py-14">
          <div className="mb-5 flex items-center gap-3 text-xs font-semibold tracking-[0.16em] text-[#ffad92] uppercase">
            <span aria-hidden="true" className="h-px w-7 bg-[#ff8b64]" /> Shop policies
          </div>
          <h1 className="text-[clamp(2.65rem,7.5vw,5.5rem)] leading-[0.98] font-semibold tracking-[-0.065em] text-[#fff6f0]">
            {title}
          </h1>
          <p className="mt-5 max-w-[36rem] text-base leading-relaxed text-[#e1d3ce] sm:mt-6 sm:text-lg">
            {description}
          </p>
          <p className="mt-6 border-t border-[#f5d7c3]/15 pt-4 text-sm text-[#cdbdb6]">
            <time dateTime={updatedOn}>Updated {updatedDate}</time>
          </p>
        </div>

        <div className="mt-7 grid items-start gap-7 lg:mt-12 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          <nav aria-label="On this page" className="rounded-2xl border border-[#332e2e] bg-[#191718] p-3 lg:sticky lg:top-6 lg:p-4">
            <p className="mb-1 px-2 pt-1 text-xs font-semibold tracking-[0.12em] text-[#efbaa7] uppercase">On this page</p>
            <ul className="grid min-[380px]:grid-cols-2 lg:grid-cols-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="flex min-h-11 items-center rounded-lg px-2 text-sm leading-snug text-[#e0d5d1] transition hover:bg-[#ff8b64]/10 hover:text-[#ffbb9f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffad92]">
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <article className="min-w-0">{children}</article>
        </div>

        <footer className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-[#332e2e] pt-5 text-sm text-[#c6b7b3]">
          <span>Creative Dimensions</span>
          <Link href={relatedLink.href} className={policyLinkClass}>{relatedLink.label}</Link>
        </footer>
      </div>
    </main>
  );
}
