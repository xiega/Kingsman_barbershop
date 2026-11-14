import type { Metadata } from "next";
import SitePage from "./components/SitePage";

// Metadane PL są domyślne w layout.tsx; tu dodajemy tylko odnośniki do wersji językowych (hreflang).
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    languages: { pl: "/", en: "/en/", "x-default": "/" },
  },
};

export default function Home() {
  return <SitePage lang="pl" />;
}
