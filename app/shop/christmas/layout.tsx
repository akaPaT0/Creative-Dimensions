import type { Metadata } from "next";
import { SITE_URL } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "Christmas Decorations in Lebanon",
  description: "Shop Christmas trees, ornaments, nativity scenes, figurines and personalised gifts from Creative Dimensions, with delivery across Lebanon.",
  alternates: { canonical: `${SITE_URL}/shop/christmas` },
};

export default function ChristmasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
