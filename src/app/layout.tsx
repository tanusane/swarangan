import type { Metadata, Viewport } from "next";
import { Inter, Marcellus, Noto_Sans_Devanagari } from "next/font/google";

import { siteConfig } from "@/lib/site-config";

import "./globals.css";

/* Fonts are self-hosted by next/font at build time: no runtime request to
   Google, and no layout shift while a webfont loads. */
const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-marcellus",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/* Loaded now so the swara glyphs in the section headings and the hero render in
   their intended face, and so future Hindi/Marathi content needs no change. */
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  display: "swap",
  variable: "--font-noto-devanagari",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default:
      "Swarangan — Indian classical, semi-classical & light vocal music classes, Singapore",
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "Hindustani classical music classes Singapore",
    "Indian vocal classes Singapore",
    "Indian classical singing lessons Singapore",
    "semi-classical vocal music",
    "Tanuja Sane",
    "Swarangan",
    "music classes West Coast Singapore",
    "online Indian classical vocal classes",
  ],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  alternates: { canonical: "/", languages: { "en-SG": "/" } },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: "en_SG",
    url: siteConfig.url,
    title:
      "Swarangan — Indian classical, semi-classical & light vocal music classes, Singapore",
    description: siteConfig.description,
    images: [
      {
        url: "/images/events/af2026-thumri-se-ghazal-tak.jpg",
        width: 1280,
        height: 720,
        alt: "Swarangan students and teachers performing on stage in Singapore",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Swarangan — Hindustani vocal music classes, Singapore",
    description: siteConfig.description,
    images: ["/images/events/af2026-thumri-se-ghazal-tak.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "education",
  // Regional signals. Google mostly relies on the structured data and the
  // Business Profile instead, but other engines and AI tools do read these.
  other: {
    "geo.region": "SG",
    "geo.placename": `${siteConfig.address.neighbourhood}, Singapore`,
    "geo.position": `${siteConfig.address.geo.lat};${siteConfig.address.geo.lng}`,
    ICBM: `${siteConfig.address.geo.lat}, ${siteConfig.address.geo.lng}`,
  },
};

export const viewport: Viewport = {
  themeColor: "#00193f",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-SG"
      className={`${marcellus.variable} ${inter.variable} ${notoDevanagari.variable}`}
    >
      {/* Deliberately bare: the public chrome lives in (site)/layout.tsx and the
          admin chrome in admin/layout.tsx, so neither leaks into the other. */}
      <body className="min-h-svh antialiased">{children}</body>
    </html>
  );
}
