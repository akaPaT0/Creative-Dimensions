import type { Metadata } from "next";
import { SITE_URL } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "About Creative Dimensions",
  description:
    "Creative Dimensions is a Lebanon-based 3D printing studio for custom prints, figurines, gifts, accessories, practical parts, and small-batch projects.",
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
