import type { Metadata } from "next";
import { SITE_URL } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "Christmas Decorations in Lebanon",
  description: "Shop Christmas crabs, a tree advent calendar and personalised name and photo ornaments from Creative Dimensions, with delivery across Lebanon.",
  alternates: { canonical: `${SITE_URL}/shop/christmas` },
};

export default function ChristmasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
