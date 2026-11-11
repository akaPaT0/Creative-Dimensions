import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "Leave a review",
  description: "Tell us how your Creative Dimensions 3D print turned out. It takes less than a minute.",
  alternates: { canonical: `${SITE_URL}/review` },
  // The form itself isn't useful in search results; /reviews is the public page.
  robots: { index: false, follow: true },
  openGraph: {
    title: "How did we do? Leave Creative Dimensions a review",
    description: "Tell us how your 3D print turned out. It takes less than a minute.",
    url: `${SITE_URL}/review`,
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
