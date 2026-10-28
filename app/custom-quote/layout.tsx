import type { Metadata } from "next";
import { SITE_URL } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "Custom 3D Printing Quote in Lebanon",
  description: "Upload your 3D model and estimate a custom 3D printing quote from Creative Dimensions in Lebanon.",
  alternates: { canonical: `${SITE_URL}/custom-quote` },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
