/**
 * Cała treść strony w jednym miejscu: cennik, zespół, opinie, dane kontaktowe.
 * Ceny zgodne z profilem w Booksy (ceny katalogowe, bez rabatu online).
 */

import defaults from "./content-defaults.json";

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

export const HOURS = [
  { days: "Poniedziałek – Czwartek", time: "07:00 – 16:00" },
  { days: "Piątek", time: "07:00 – 20:00" },
  { days: "Sobota", time: "07:00 – 16:00" },
  { days: "Niedziela", time: "Zamknięte" },
];

export type PriceItem = {
  name: string;
  price: string; // "100" albo "120+" (cena od)
  duration: string;
  note?: string;
};

export type PriceGroup = {
  title: string;
  items: PriceItem[];
};

/**
 * Ceny i zdjęcia galerii są w app/content-defaults.json. To wartości domyślne:
 * na serwerze panel /admin.php zapisuje zmiany do content.json, który ma pierwszeństwo.
 */
export const PRICE_GROUPS: PriceGroup[] = defaults.prices;

export type TeamMember = {
  /** Nazwa pliku ze zdjęciem: public/img/team/<slug>-400.webp i -800.webp */
  slug: string;
  name: string;
  role: string;
  /** Krótki opis. Gdy pusty, sekcja pokazuje tylko imię i rolę. */
  bio?: string;
};

export const TEAM: TeamMember[] = [
  {
    slug: "julita",
    name: "Julita",
    role: "Barber",
    bio: "Dietetykiem nie jest, ale ma duże zamiłowanie do brokułów 🥦. Jeśli jeździsz na Kukirinie lub słuchasz Okekela, koniecznie wpadnij na jej fotel 🤤🤤",
  },
  {
    slug: "kacper",
    name: "Kacper",
    role: "Barber",
    bio: "Kacper, inaczej grubson 🎤. Ciężki humor, debaty polityczne? Nie ma znaczenia, z nim każdy temat może być poruszony 😎 Ulubione strzyżenia? Każde 🥸. Nie ma znaczenia, z czym przyjdziesz na głowie, zawsze będzie ugotowane 🤤. Jestem tego pewny, w głębi duszy o tym wiem, że gdzieś na Różanej wszyscy razem spotkamy się ⛰️",
  },
  {
    slug: "wojtek",
    name: "Wojtek",
    role: "Barber",
    bio: "Nasz polsko-turecki wojownik zaprasza na fotel 💺\nŚrednio mówi po polsku, jeszcze gorzej po turecku 😩\nJedno jest pewne: zrobi strzyżenie lepiej niż twoja osiedlowa fryzjerka 💇 Buyrun 🇹🇷😆",
  },
];

export type Cut = {
  name: string; // plik: public/img/<name>-<szerokość>.webp
  widths: readonly number[];
  alt: string;
  speed: number; // siła parallaxu na desktopie
};

export const CUTS: Cut[] = defaults.gallery.map((g) => ({
  name: g.base.replace(/^\/img\//, ""),
  widths: g.widths,
  alt: g.alt,
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
