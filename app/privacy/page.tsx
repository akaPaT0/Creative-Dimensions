import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Fingerprint, Mail, UserRound } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Creative Dimensions handles Google sign-in, shop accounts, orders, and privacy requests.",
  alternates: { canonical: "/privacy" },
};

const supportEmail = "support@creativedimensionslb.com";

const sections = [
  { id: "google-data", title: "Google data we collect" },
  { id: "data-use", title: "How we use Google data" },
  { id: "sharing", title: "Who receives your data" },
  { id: "safeguards", title: "Storage and safeguards" },
  { id: "retention", title: "Retention and deletion" },
  { id: "shop-data", title: "Other shop information" },
] as const;

const googleData = [
  {
    icon: Fingerprint,
    label: "Account identifier",
    description: "Google’s unique ID for your account, used to recognize your sign-in.",
  },
  {
    icon: Mail,
    label: "Email address",
    description: "Your Google email address and whether Google has verified it.",
  },
  {
    icon: UserRound,
    label: "Basic profile",
    description: "Your name and profile picture when Google provides them.",
  },
];

const linkClass =
  "rounded-sm font-medium text-[#ffad92] underline decoration-[#ff8b64]/50 underline-offset-4 hover:text-[#ffd2c2] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffad92]";

function PolicySection({
  section,
  index,
  children,
}: {
  section: (typeof sections)[number];
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

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-5 max-w-[36rem] text-base leading-relaxed text-[#e1d3ce] sm:mt-6 sm:text-lg">
            How Creative Dimensions handles your information when you use Google Sign-In, shop for 3D printed products, or request a custom print.
          </p>
          <p className="mt-6 border-t border-[#f5d7c3]/15 pt-4 text-sm text-[#cdbdb6]">
            <time dateTime="2026-11-08">Updated November 8, 2026</time>
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

          <article className="min-w-0">
            <PolicySection section={sections[0]} index={0}>
              <p>If you choose Sign in with Google, Creative Dimensions requests basic identity information through the <strong className="font-semibold text-[#fff4ec]">OpenID, email and profile</strong> permissions.</p>
              <dl className="divide-y divide-[#3a302d] rounded-xl border border-[#3a302d] bg-[#1c1717] sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {googleData.map(({ icon: Icon, label, description }) => (
                  <div key={label} className="p-4 sm:p-5">
                    <dt className="flex items-center gap-2 text-sm leading-snug font-semibold text-[#fff4ec] sm:block">
                      <Icon size={18} aria-hidden="true" className="shrink-0 text-[#ffad92] sm:mb-3" />
                      {label}
                    </dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-[#cdbfba]">{description}</dd>
                  </div>
                ))}
              </dl>
              <p>These permissions cover basic identity data. Your Gmail messages, Drive files and Google password remain in your Google account.</p>
            </PolicySection>

            <PolicySection section={sections[1]} index={1}>
              <p>We use your Google identifier and email to recognize your Creative Dimensions account and sign you in. When available, your name and profile picture appear in the account interface. Your shop account links you to your saved items, addresses and order history.</p>
              <p>Our team uses your account name and email to identify your account when helping you or managing an order. We limit our use and sharing of Google user data to the shop functions described here and handle it in accordance with the <a className={linkClass} href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including its Limited Use requirements.</p>
            </PolicySection>

            <PolicySection section={sections[2]} index={2}>
              <ul className="list-disc space-y-3 pl-5 marker:text-[#ff9e7f]">
                <li><strong className="font-semibold text-[#fff4ec]">Supabase Auth</strong> processes sign-in and stores your linked Google identity and profile information with your authentication record.</li>
                <li><strong className="font-semibold text-[#fff4ec]">Telegram</strong> carries order notifications and invoices to our fulfillment team when you place an order. They can include your account email, including your Google email if you used it to sign in. Your Google account identifier and Google profile picture are used for sign-in and your shop profile.</li>
              </ul>
            </PolicySection>

            <PolicySection section={sections[3]} index={3}>
              <p>Supabase stores shop account and order data. We use HTTPS to protect information in transit. The shop checks your session before granting access to account records, and administrative tools require a separate staff permission check.</p>
            </PolicySection>

            <PolicySection section={sections[4]} index={4}>
              <p>We keep your linked Google information while it is needed for your shop account and sign-in. We may keep order and invoice records longer to fulfill orders, resolve disputes or meet legal obligations.</p>
              <p>You can remove Creative Dimensions from your Google Account’s third-party connections. To request access, correction or deletion of information the shop holds, email <a className={`${linkClass} break-all sm:break-normal`} href={`mailto:${supportEmail}`}>{supportEmail}</a> and include the email associated with your shop account. We may ask you to verify that you control the account before we act on the request.</p>
            </PolicySection>

            <PolicySection section={sections[5]} index={5}>
              <p>We use the contact, delivery and product details you provide to fulfill orders and answer questions about them. When you contact us through WhatsApp, WhatsApp processes the information you send there.</p>
              <p>We use session cookies to keep you signed in and browser storage to remember your cart.</p>
            </PolicySection>

            <div className="flex flex-col gap-4 rounded-2xl border border-[#49342e] bg-[#211918] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h2 className="font-semibold text-[#fff4ec]">Privacy questions?</h2>
                <p className="mt-1 text-sm leading-relaxed text-[#d5c7c1]">Contact Creative Dimensions about your data.</p>
              </div>
              <a href={`mailto:${supportEmail}`} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-[#ffad92] px-4 py-2 text-sm font-semibold text-[#27150f] transition hover:bg-[#ffc5b1] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffad92]">
                Email us <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
          </article>
        </div>

        <footer className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-[#332e2e] pt-5 text-sm text-[#c6b7b3]">
          <span>Creative Dimensions</span>
          <Link href="/terms" className={linkClass}>Terms of Service</Link>
        </footer>
      </div>
    </main>
  );
}
