import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kingsman Barbershop Poznań | Najlepszy Barber na Wildzie",
  description: "Klasyczny barbershop na poznańskiej Wildzie (ul. Różana 6). Rzemiosło, nienaganny styl i profesjonalne strzyżenie. Zarezerwuj wizytę przez Booksy.",
  keywords: "barber poznań, barbershop wilda, strzyżenie męskie poznań, trymowanie brody, kingsman barber poznań",
  openGraph: {
    title: "Kingsman Barbershop Poznań",
    description: "Klasyczny barbershop na poznańskiej Wildzie. Wejdź do bazy i stwórz swoją tożsamość.",
    url: "https://kingsmanbarbershop.pl", // Zmień na swoją domenę, jak już ją wykupisz
    siteName: "Kingsman Barbershop",
    images: [
      {
        url: "/logo_szerokie.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "pl_PL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}