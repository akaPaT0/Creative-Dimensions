import type { Metadata } from "next";
import { SITE_URL } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "3D Printed Keychains in Lebanon",
  description:
    "Shop made-to-order 3D printed keychains from Creative Dimensions, including automotive, personalized, and custom designs with delivery across Lebanon.",
  alternates: { canonical: `${SITE_URL}/shop/keychains` },
};

export default function KeychainsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
