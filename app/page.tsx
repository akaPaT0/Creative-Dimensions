import type { Metadata } from "next";
import { SITE_URL } from "@/app/lib/site";
export { default } from "./temphome/page";

export const metadata: Metadata = {
  title: "Custom 3D Printing & 3D Printed Products in Lebanon",
  description:
    "Creative Dimensions makes custom 3D prints, figurines, keychains, desk accessories, collectibles, gifts, and made-to-order products with delivery across Lebanon.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Creative Dimensions | Custom 3D Printing in Lebanon",
    description:
      "Custom 3D printing and made-to-order 3D printed products with delivery across Lebanon.",
    url: SITE_URL,
    type: "website",
  },
};
