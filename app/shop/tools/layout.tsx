import type { Metadata } from "next";
import { SITE_URL } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "3D Printed Tools & Utilities in Lebanon",
  description:
    "Explore practical 3D printed tools and utility items from Creative Dimensions in Lebanon.",
  alternates: { canonical: `${SITE_URL}/shop/tools` },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
