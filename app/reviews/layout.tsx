import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "Customer Reviews",
  description: "Reviews from Creative Dimensions customers on our custom 3D prints, gifts and made-to-order products in Lebanon.",
  alternates: { canonical: `${SITE_URL}/reviews` },
  openGraph: {
    title: "Creative Dimensions customer reviews",
    description: "What customers say about our custom 3D prints.",
    url: `${SITE_URL}/reviews`,
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
