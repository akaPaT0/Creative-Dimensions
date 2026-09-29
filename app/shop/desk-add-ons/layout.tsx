import type { Metadata } from "next";
import { SITE_URL } from "@/app/lib/site";

export const metadata: Metadata = {
  title: "3D Printed Desk Accessories in Lebanon",
  description:
    "Shop 3D printed desk accessories, stands, organizers, and setup add-ons made to order by Creative Dimensions in Lebanon.",
  alternates: { canonical: `${SITE_URL}/shop/desk-add-ons` },
};

export default function DeskAddOnsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
