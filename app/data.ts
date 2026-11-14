/**
 * Cała treść strony w jednym miejscu: cennik, zespół, opinie, dane kontaktowe.
 * Ceny zgodne z profilem w Booksy (ceny katalogowe, bez rabatu online).
 */

import defaults from "./content-defaults.json";
import type { Hours } from "./hours";

export const BOOKING_URL =
  "https://booksy.com/pl-pl/291654_kingsman-barbershop_barber-shop_15608_poznan";

export const CONTACT = {
  phone: "+48 795 000 934",
  phoneHref: "tel:+48795000934",
  street: "Różana 6",
  postalCode: "61-577",
  city: "Poznań",
  district: "Wilda",
  instagramUrl: "https://www.instagram.com/kingsman_barbershop_poznan/",
  instagramHandle: "@kingsman_barbershop_poznan",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Kingsman+Barbershop+R%C3%B3%C5%BCana+6+Pozna%C5%84",
  googleReviewsUrl: "https://www.google.com/search?q=Kingsman+Barbershop+Pozna%C5%84+opinie",
};

export const SITE_URL = "https://kingsman-barbershop.pl";

/** Godziny, zespół i komunikat są w app/content-defaults.json; panel /admin.php nadpisuje je w content.json. */
export const DEFAULT_HOURS: Hours = defaults.hours as Hours;

export type PriceItem = {
  name: string;
  price: string; // "100" albo "120+" (cena od)
  duration: string;
  note?: string;
  name_en?: string;
  note_en?: string;
};

export type PriceGroup = {
  title: string;
  title_en?: string;
  items: PriceItem[];
};

/**
 * Ceny i zdjęcia galerii są w app/content-defaults.json. To wartości domyślne:
 * na serwerze panel /admin.php zapisuje zmiany do content.json, który ma pierwszeństwo.
 */
export const PRICE_GROUPS: PriceGroup[] = defaults.prices;

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  role_en?: string;
  /** Krótki opis. Gdy pusty, karta pokazuje tylko imię i rolę. */
  bio?: string;
  bio_en?: string;
  /** Zdjęcie: ścieżka bez rozmiaru i rozszerzenia (np. /img/team/julita). Brak = logo zamiast zdjęcia. */
  photo?: { base: string; widths: number[] } | null;
};

export const TEAM: TeamMember[] = defaults.team as TeamMember[];

export type Announcement = {
  enabled: boolean;
  text: string;
  text_en: string;
  /** ostatni dzień wyświetlania (YYYY-MM-DD) albo pusty tekst = bez końca */
  until: string;
  url?: string;
};

export const DEFAULT_ANNOUNCEMENT: Announcement = defaults.announcement;

export type Cut = {
  name: string; // plik: public/img/<name>-<szerokość>.webp
  widths: readonly number[];
  alt: string;
  alt_en?: string;
  speed: number; // siła parallaxu na desktopie
};

export const CUTS: Cut[] = defaults.gallery.map((g) => ({
  name: g.base.replace(/^\/img\//, ""),
  widths: g.widths,
  alt: g.alt,
  alt_en: g.alt_en,
  speed: g.speed,
}));

export type Review = {
  name: string;
  date: string;
  text: string;
  /** 1-5; domyślnie 5 (opinie statyczne) */
  rating?: number;
  /** link do profilu autora w Google (atrybucja wymagana przez Google) */
  url?: string | null;
};

/** Kształt pliku app/google-reviews.json, który zapisuje scripts/fetch-google-reviews.mjs */
export type GoogleReviewsData = {
  fetchedAt?: string;
  placeId?: string;
  rating?: number;
  count?: number;
  mapsUri?: string;
  reviews: Review[];
};

export const REVIEWS: Review[] = [
  { name: "Kacper D.", date: "2 tygodnie temu", text: "Świetna atmosfera, a strzyżenie wykonane z ogromną precyzją. Najlepszy barber na Wildzie, polecam w 100%!" },
  { name: "Michał N.", date: "Miesiąc temu", text: "Super atmosfera, świetne strzyżenie i broda zrobiona idealnie. Pełen profesjonalizm. Na pewno wrócę." },
  { name: "Tomasz K.", date: "2 miesiące temu", text: "Krótko i na temat - mistrzostwo. Chłopaki znają się na rzeczy. Termin z Booksy zrealizowany punktualnie." },
  { name: "Adam W.", date: "3 tygodnie temu", text: "Wystrój i obsługa na najwyższym poziomie. Zdecydowanie polecam każdemu dżentelmenowi. Klasa." },
  { name: "Dawid P.", date: "Tydzień temu", text: "Moje nowe stałe miejsce na mapie Poznania. Strzyżenie brody to czysta poezja i relaks." },
  { name: "Piotr S.", date: "Miesiąc temu", text: "Od wejścia czuć klimat premium. Fryzura trzyma się idealnie, a doradztwo ze strony barbera bezcenne." },
];
