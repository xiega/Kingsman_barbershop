import type { Metadata } from "next";
import SitePage from "../components/SitePage";

export const metadata: Metadata = {
  title: "Kingsman Barbershop Poznań | Barber in Wilda",
  description:
    "Classic barbershop in Poznań's Wilda district (Różana 6). Men's haircuts, beard trims and combo packages. Book your visit online on Booksy.",
  keywords: "barber poznań, barbershop wilda, men's haircut poznań, beard trim, kingsman barber poznań",
  alternates: {
    canonical: "/en/",
    languages: { pl: "/", en: "/en/", "x-default": "/" },
  },
  openGraph: {
    title: "Kingsman Barbershop Poznań",
    description: "Classic barbershop in Poznań's Wilda district. Haircuts, beard care, combo packages.",
    url: "/en/",
    siteName: "Kingsman Barbershop",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Kingsman Barbershop Poznań" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kingsman Barbershop Poznań",
    description: "Classic barbershop in Poznań's Wilda district.",
    images: ["/og.jpg"],
  },
};

export default function HomeEn() {
  return <SitePage lang="en" />;
}
