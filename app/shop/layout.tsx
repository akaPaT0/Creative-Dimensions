import type { Metadata } from "next";
import { SITE_URL } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "3D Printed Products in Lebanon",
  description:
    "Shop Creative Dimensions for made-to-order 3D printed keychains, figurines, desk accessories, collectibles, and custom prints with delivery across Lebanon.",
  alternates: { canonical: `${SITE_URL}/shop` },
  openGraph: {
    title: "3D Printed Products in Lebanon | Creative Dimensions",
    description:
      "Made-to-order 3D printed products, gifts, accessories, collectibles, and custom prints in Lebanon.",
    url: `${SITE_URL}/shop`,
    type: "website",
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
