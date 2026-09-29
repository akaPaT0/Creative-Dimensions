import type { Metadata } from "next";
import { SITE_URL } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "3D Printed Accessories in Lebanon",
  description:
    "Browse practical and personalized 3D printed accessories made to order by Creative Dimensions with delivery across Lebanon.",
  alternates: { canonical: `${SITE_URL}/shop/accessories` },
};

export default function AccessoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
