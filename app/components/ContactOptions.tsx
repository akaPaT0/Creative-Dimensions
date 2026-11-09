import { ChevronRight, Instagram, Mail, MessageCircle, Phone, Sparkles } from "lucide-react";
import TemphomeCustomRequestCta from "./TemphomeCustomRequestCta";

const PHONE_DISPLAY = "+961 70 304 007";
const SUPPORT_EMAIL = "support@creativedimensionslb.com";

const options = [
  {
    href: "https://wa.me/96170304007?text=Hi%20Creative%20Dimensions%2C%20I%20want%20to%20ask%20about...",
    external: true,
    label: "WhatsApp",
    detail: `${PHONE_DISPLAY} · fastest reply`,
    icon: MessageCircle,
    iconClass: "bg-[#25D366] text-[#0B2A17]",
  },
  {
    href: "tel:+96170304007",
    external: false,
    label: "Call",
    detail: PHONE_DISPLAY,
    icon: Phone,
    iconClass: "bg-white/10 text-white",
  },
  {
    href: "https://instagram.com/creativedimensions.lb",
    external: true,
    label: "Instagram",
    detail: "@creativedimensions.lb",
    icon: Instagram,
    iconClass: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white",
  },
  {
    href: `mailto:${SUPPORT_EMAIL}`,
    external: false,
    label: "Email",
    detail: SUPPORT_EMAIL,
    icon: Mail,
    iconClass: "bg-white/10 text-white",
  },
];

/** Ways to reach the shop; shared by the contact page and contact popup. */
export default function ContactOptions() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#FF8B64]/30 bg-[#FF8B64]/[0.07] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF8B64]/15 text-[#FF8B64]">
            <Sparkles size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-white">Want something made?</p>
            <p className="mt-0.5 text-sm text-white/60">
              Send a photo, sketch or idea and we&rsquo;ll get back to you with a preview and a price.
            </p>
          </div>
        </div>
        <TemphomeCustomRequestCta
          productName="Custom Order"
          productUrl="https://creativedimensionslb.com/contact"
          buttonLabel="Get a Quote"
          className="mt-4 w-full rounded-xl bg-[#FF8B64] px-5 py-3 text-sm font-bold text-[#0D0D0D] hover:bg-[#ffa282] transition"
        />
      </div>

      <ul className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/[0.07]">
        {options.map(({ href, external, label, detail, icon: Icon, iconClass }) => (
          <li key={label}>
            <a
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.05] transition"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">{label}</span>
                <span className="block truncate text-xs text-white/55">{detail}</span>
              </span>
              <ChevronRight
                size={16}
                className="shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/70"
                aria-hidden="true"
              />
            </a>
          </li>
        ))}
      </ul>

      <p className="text-center text-xs text-white/40">Based in Lebanon · Delivery across Lebanon</p>
    </div>
  );
}
