import type { Metadata } from "next";
import { SITE_URL } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "New 3D Printed Products",
  description:
    "See the latest 3D printed products and fresh releases from Creative Dimensions in Lebanon.",
  alternates: { canonical: `${SITE_URL}/shop/new-arrivals` },
};

export default function NewArrivalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
