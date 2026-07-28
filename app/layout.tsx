import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/app/lib/site";
import BackgroundMusic from "@/app/components/BackgroundMusic";
import { SupabaseAuthProvider } from "@/app/lib/supabase/auth-client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Creative Dimensions",
    template: "%s | Creative Dimensions",
  },
  description:
    "Creative Dimensions Lebanon: custom 3D printed products, keychains, fan items, and custom requests.",
  openGraph: {
    type: "website",
    siteName: "Creative Dimensions",
    title: "Creative Dimensions",
    description:
      "Creative Dimensions Lebanon: custom 3D printed products, keychains, fan items, and custom requests.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Creative Dimensions",
    description:
      "Creative Dimensions Lebanon: custom 3D printed products, keychains, fan items, and custom requests.",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Creative Dimensions",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    email: "info@creativedimensionslb.com",
    sameAs: ["https://instagram.com/creativedimensions.lb"],
  };

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SupabaseAuthProvider>
          <BackgroundMusic />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
          />
          {children}
          {modal}
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
