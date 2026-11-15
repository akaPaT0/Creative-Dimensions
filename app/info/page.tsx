import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Gift,
  Globe,
  Instagram,
  Mail,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  UserPlus,
} from "lucide-react";
import Background from "../components/Background";
import { SITE_URL } from "@/app/lib/site";

// Business-card landing page: the QR code on the printed cards points here.
export const metadata: Metadata = {
  title: "Creative Dimensions | Contact & Links",
  description:
    "All the ways to reach Creative Dimensions, a 3D printing studio in Lebanon: WhatsApp, phone, Instagram, email and shop.",
  alternates: { canonical: `${SITE_URL}/info` },
};

const PHONE_DISPLAY = "+961 70 304 007";
const SUPPORT_EMAIL = "support@creativedimensionslb.com";

type Item = {
  href: string;
  label: string;
  detail: string;
  icon: typeof Mail;
  iconClass: string;
  external?: boolean;
  internal?: boolean;
};

const contact: Item[] = [
  {
    href: "https://wa.me/96170304007?text=Hi%20Creative%20Dimensions%2C%20I%20got%20your%20card%20and%20want%20to%20ask%20about...",
    label: "WhatsApp",
    detail: `${PHONE_DISPLAY} · fastest reply`,
    icon: MessageCircle,
    iconClass: "bg-[#25D366] text-[#0B2A17]",
    external: true,
  },
  {
    href: "https://instagram.com/creativedimensions.lb",
    label: "Instagram",
    detail: "@creativedimensions.lb",
    icon: Instagram,
    iconClass: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white",
    external: true,
  },
  {
    href: `mailto:${SUPPORT_EMAIL}`,
    label: "Email",
    detail: SUPPORT_EMAIL,
    icon: Mail,
    iconClass: "bg-white/10 text-white",
  },
];

const shop: Item[] = [
  {
    href: "/shop",
    label: "Shop all products",
    detail: "Figurines, keychains, gifts and decor",
    icon: ShoppingBag,
    iconClass: "bg-[#FF8B64]/15 text-[#FF8B64]",
    internal: true,
  },
  {
    href: "/shop/christmas",
    label: "Christmas collection",
    detail: "Ornaments, gnomes, reindeer and more",
    icon: Gift,
    iconClass: "bg-[#FF8B64]/15 text-[#FF8B64]",
    internal: true,
  },
  {
    href: "/custom-quote",
    label: "Custom 3D print",
    detail: "Send an idea, photo or file for a quote",
    icon: Sparkles,
    iconClass: "bg-[#FF8B64]/15 text-[#FF8B64]",
    internal: true,
  },
  {
    href: "/",
    label: "Website",
    detail: "creativedimensionslb.com",
    icon: Globe,
    iconClass: "bg-white/10 text-white",
    internal: true,
  },
];

function Row({ item }: { item: Item }) {
  const { href, label, detail, icon: Icon, iconClass, external, internal } = item;
  const inner = (
    <>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
        <Icon size={20} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-white">{label}</span>
        <span className="block truncate text-xs text-white/55">{detail}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/60" aria-hidden="true" />
    </>
  );
  const cls = "group flex items-center gap-3 px-4 py-3.5 transition hover:bg-white/[0.05]";
  return (
    <li>
      {internal ? (
        <Link href={href} className={cls}>{inner}</Link>
      ) : (
        <a href={href} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {inner}
        </a>
      )}
    </li>
  );
}

function Group({ title, items }: { title: string; items: Item[] }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">{title}</h2>
      <ul className="divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
        {items.map((item) => (
          <Row key={item.label} item={item} />
        ))}
      </ul>
    </section>
  );
}

export default function InfoPage() {
  return (
    <div className="relative min-h-screen bg-[#0D0D0D] text-white">
      <Background />
      <main className="relative z-10 mx-auto w-full max-w-md px-5 pb-16 pt-14 sm:pt-20">
        <header className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="" width={88} height={88} className="mx-auto h-[88px] w-[88px]" />
          <h1 className="mt-3 text-[28px] font-extrabold tracking-tight">
            Creative <span className="text-[#FF8B64]">Dimensions</span>
          </h1>
          <p className="mt-1.5 text-sm text-white/60">
            3D printing studio in Lebanon · custom prints, gifts &amp; decor
          </p>
        </header>

        <a
          href="/creative-dimensions.vcf"
          download="Creative Dimensions.vcf"
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF8B64] px-5 py-3.5 text-[15px] font-bold text-[#0D0D0D] transition hover:bg-[#ffa282]"
        >
          <UserPlus size={19} aria-hidden="true" />
          Save our contact
        </a>

        <Group title="Contact us" items={contact} />
        <Group title="Shop" items={shop} />

        <p className="mt-8 text-center text-xs text-white/45">
          Pickup or delivery across Lebanon
          <br />
          Designed with taste. Printed with precision.
        </p>
      </main>
    </div>
  );
}
