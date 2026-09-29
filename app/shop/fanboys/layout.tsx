import type { Metadata } from "next";
import { SITE_URL } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "3D Printed Figurines & Collectibles in Lebanon",
  description:
    "Browse made-to-order 3D printed figurines, fandom pieces, collectibles, and display items from Creative Dimensions in Lebanon.",
  alternates: { canonical: `${SITE_URL}/shop/fanboys` },
};

export default function FanboysLayout({ children }: { children: React.ReactNode }) {
  return children;
}
