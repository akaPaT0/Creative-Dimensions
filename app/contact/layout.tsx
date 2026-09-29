import type { Metadata } from "next";
import { SITE_URL } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "Contact Creative Dimensions",
  description:
    "Contact Creative Dimensions for custom 3D printing, personalized products, and made-to-order 3D prints in Lebanon.",
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
