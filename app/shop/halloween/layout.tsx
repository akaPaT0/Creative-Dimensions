import type { Metadata } from "next";
import { SITE_URL } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "Halloween Decorations in Lebanon",
  description:
    "Shop 3D printed Halloween candy bowls, skull pots, skeletons, bat decorations and coffin lanterns from Creative Dimensions, with delivery across Lebanon.",
  alternates: { canonical: `${SITE_URL}/shop/halloween` },
};

export default function HalloweenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
