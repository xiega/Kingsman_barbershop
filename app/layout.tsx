import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { CDN_ORIGIN } from "@/lib/assets";
import { SITE_URL } from "./data";
import "./globals.css";

// "latin-ext" jest konieczny dla polskich znaków (ą, ć, ę, ł, ń, ó, ś, ź, ż).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Kingsman Barbershop Poznań | Barber na Wildzie",
  description:
    "Klasyczny barbershop na poznańskiej Wildzie (ul. Różana 6). Strzyżenie męskie, trymowanie brody i pakiety combo. Zarezerwuj wizytę online przez Booksy.",
  keywords:
    "barber poznań, barbershop wilda, strzyżenie męskie poznań, trymowanie brody, kingsman barber poznań",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Kingsman Barbershop Poznań",
    description: "Klasyczny barbershop na poznańskiej Wildzie. Strzyżenie, broda, pakiety combo.",
    url: "/",
    siteName: "Kingsman Barbershop",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Kingsman Barbershop Poznań" }],
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kingsman Barbershop Poznań",
    description: "Klasyczny barbershop na poznańskiej Wildzie.",
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        {CDN_ORIGIN && <link rel="preconnect" href={CDN_ORIGIN} crossOrigin="anonymous" />}
      </head>
      <body className="bg-ink font-sans text-bone antialiased">{children}</body>
    </html>
  );
}
