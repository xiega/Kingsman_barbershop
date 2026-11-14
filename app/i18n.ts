/**
 * Teksty interfejsu w dwóch językach. Treści, które właściciel edytuje w panelu
 * (ceny, zespół, godziny, komunikat), mają własne pola *_en w content.json.
 */

export type Lang = "pl" | "en";

export const LANGS: Lang[] = ["pl", "en"];

/** Ścieżka strony w danym języku (trailingSlash: true). */
export const LANG_PATH: Record<Lang, string> = { pl: "/", en: "/en/" };

const PL = {
  htmlLang: "pl",
  nav: [
    { href: "#about", label: "O nas" },
    { href: "#pricing", label: "Cennik" },
    { href: "#team", label: "Zespół" },
    { href: "#gallery", label: "Realizacje" },
    { href: "#contact", label: "Kontakt" },
  ],
  book: "Zarezerwuj wizytę",
  bookBooksy: "Zarezerwuj w Booksy",
  homeLabel: "Kingsman Barbershop – strona główna",
  mainNav: "Główna nawigacja",
  mobileNav: "Menu mobilne",
  menuOpen: "Otwórz menu",
  menuClose: "Zamknij menu",
  switchTo: "Switch to English",
  announcement: "Komunikat",
  hero: {
    eyebrow: "Barbershop · Wilda, Poznań",
    h1a: "Twój styl to zbroja współczesnego ",
    h1b: "dżentelmena.",
    lead: "Kingsman to zbrojownia, w której wykuwamy ją na nowo. Klasyczne strzyżenie i pielęgnacja brody w sercu poznańskiej Wildy.",
    seePrices: "Zobacz cennik",
    onGoogle: (r: string) => `${r} w Google`,
  },
  about: {
    eyebrow: "O nas",
    h2a: "Tworzymy ",
    h2b: "tożsamość",
    p: "Nasza tajna baza na poznańskiej Wildzie to miejsce, w którym rzemiosło spotyka się z kinową elegancją. Wchodzisz tu jako mężczyzna, wychodzisz jako członek najbardziej elitarnego klubu w mieście.",
    quote: "„Oksfordy. Nie brogsy.”",
    photo1: "Barber przy pracy",
    photo2: "Barber układa przedziałek brzytwą i grzebieniem",
    tag1: "01 / Rzemiosło",
    tag2: "02 / Charakter",
    ident: "IDENT. / 001",
    place: "WILDA / POZNAŃ",
    rating: "Ocena Google",
    open: "Otwarte",
    from: (t: string) => `od ${t}`,
    location: "Lokalizacja",
    district: "Wilda",
  },
  pricing: {
    eyebrow: "Cennik",
    h2a: "Usługi i ",
    h2b: "ceny",
    intro: "Przejrzysty cennik i czas trwania każdej usługi. Termin wybierasz online w Booksy.",
    plus: "Ceny z plusem („+”) to ceny od.",
    currency: "zł",
  },
  team: {
    eyebrow: "Zespół",
    h2a: "Ludzie za ",
    h2b: "fotelem",
    intro: "Poznaj osoby, które zadbają o Twój styl.",
    profile: "// profil",
    alt: (name: string, role: string) => `${name}, ${role} w Kingsman Barbershop`,
  },
  gallery: {
    eyebrow: "Realizacje",
    h2a: "Efekty, które ",
    h2b: "mówią same za siebie",
  },
  reviews: {
    eyebrow: "Opinie",
    h2a: "Co mówią ",
    h2b: "klienci",
    intro: (rating: string | null, count: number | null) =>
      rating
        ? `Ocena ${rating} / 5 w Google${count ? ` · ${count} ${plOpinions(count)}` : ""}.`
        : "Ocena 5,0 / 5 w Google.",
    all: "Zobacz wszystkie opinie w Google",
    prev: "Poprzednie opinie",
    next: "Następne opinie",
    list: "Opinie klientów",
    stars: (n: number) => `Ocena ${n} na 5`,
    google: "Opinia z Google",
  },
  footer: {
    tagline: "Klasyczny barbershop na Wildzie. Miejsce, gdzie rzemiosło spotyka się z nienagannym stylem.",
    hours: "Godziny otwarcia",
    contact: "Kontakt",
    booking: "Rezerwacja",
    bookingText: "Wybierz usługę i dogodny termin. Rezerwacja online zajmuje minutę.",
    rights: (year: number) => `© ${year} Kingsman Barbershop Poznań. Wszelkie prawa zastrzeżone.`,
    closed: "Zamknięte",
  },
  days: ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"],
  daysOn: ["w poniedziałek", "we wtorek", "w środę", "w czwartek", "w piątek", "w sobotę", "w niedzielę"],
  status: {
    openNow: (until: string) => `Otwarte teraz · do ${until}`,
    closedToday: (t: string) => `Zamknięte · otwieramy dziś o ${t}`,
    closedTomorrow: (t: string) => `Zamknięte · otwieramy jutro o ${t}`,
    closedOn: (day: string, t: string) => `Zamknięte · otwieramy ${day} o ${t}`,
    closed: "Zamknięte",
  },
};

function plOpinions(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 1) return "opinia";
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return "opinie";
  return "opinii";
}

export type Dict = typeof PL;

const EN: Dict = {
  htmlLang: "en",
  nav: [
    { href: "#about", label: "About" },
    { href: "#pricing", label: "Prices" },
    { href: "#team", label: "Team" },
    { href: "#gallery", label: "Our work" },
    { href: "#contact", label: "Contact" },
  ],
  book: "Book a visit",
  bookBooksy: "Book on Booksy",
  homeLabel: "Kingsman Barbershop – home",
  mainNav: "Main navigation",
  mobileNav: "Mobile menu",
  menuOpen: "Open menu",
  menuClose: "Close menu",
  switchTo: "Przełącz na polski",
  announcement: "Announcement",
  hero: {
    eyebrow: "Barbershop · Wilda, Poznań",
    h1a: "Your style is the armour of the modern ",
    h1b: "gentleman.",
    lead: "Kingsman is the armoury where we forge it anew. Classic haircuts and beard care in the heart of Poznań's Wilda district.",
    seePrices: "See prices",
    onGoogle: (r: string) => `${r} on Google`,
  },
  about: {
    eyebrow: "About us",
    h2a: "We create ",
    h2b: "identity",
    p: "Our secret base in Poznań's Wilda district is a place where craft meets cinematic elegance. You walk in as a man and walk out as a member of the most elite club in town.",
    quote: "“Oxfords. Not brogues.”",
    photo1: "Barber at work",
    photo2: "Barber styling a parting with a razor and comb",
    tag1: "01 / Craft",
    tag2: "02 / Character",
    ident: "IDENT. / 001",
    place: "WILDA / POZNAŃ",
    rating: "Google rating",
    open: "Open",
    from: (t: string) => `from ${t}`,
    location: "Location",
    district: "Wilda",
  },
  pricing: {
    eyebrow: "Prices",
    h2a: "Services and ",
    h2b: "prices",
    intro: "A clear price list and the duration of every service. You pick your appointment online on Booksy.",
    plus: "Prices with a plus (“+”) are starting prices.",
    currency: "PLN",
  },
  team: {
    eyebrow: "Team",
    h2a: "The people behind the ",
    h2b: "chair",
    intro: "Meet the people who will take care of your style.",
    profile: "// profile",
    alt: (name: string, role: string) => `${name}, ${role} at Kingsman Barbershop`,
  },
  gallery: {
    eyebrow: "Our work",
    h2a: "Results that ",
    h2b: "speak for themselves",
  },
  reviews: {
    eyebrow: "Reviews",
    h2a: "What our ",
    h2b: "clients say",
    intro: (rating: string | null, count: number | null) =>
      rating
        ? `Rated ${rating} / 5 on Google${count ? ` · ${count} ${count === 1 ? "review" : "reviews"}` : ""}.`
        : "Rated 5.0 / 5 on Google.",
    all: "See all reviews on Google",
    prev: "Previous reviews",
    next: "Next reviews",
    list: "Client reviews",
    stars: (n: number) => `Rated ${n} out of 5`,
    google: "Google review",
  },
  footer: {
    tagline: "A classic barbershop in Wilda. A place where craft meets impeccable style.",
    hours: "Opening hours",
    contact: "Contact",
    booking: "Booking",
    bookingText: "Pick a service and a time that suits you. Booking online takes a minute.",
    rights: (year: number) => `© ${year} Kingsman Barbershop Poznań. All rights reserved.`,
    closed: "Closed",
  },
  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  daysOn: ["on Monday", "on Tuesday", "on Wednesday", "on Thursday", "on Friday", "on Saturday", "on Sunday"],
  status: {
    openNow: (until: string) => `Open now · until ${until}`,
    closedToday: (t: string) => `Closed · opens today at ${t}`,
    closedTomorrow: (t: string) => `Closed · opens tomorrow at ${t}`,
    closedOn: (day: string, t: string) => `Closed · opens ${day} at ${t}`,
    closed: "Closed",
  },
};

export const DICT: Record<Lang, Dict> = { pl: PL, en: EN };

/** "1 godz. 20 min" -> "1 h 20 min" */
export function localDuration(duration: string, lang: Lang): string {
  return lang === "en" ? duration.replace(/\bgodz\.?/g, "h") : duration;
}

/** Skraca "07:00" do "7:00" tylko tam, gdzie to ma sens wizualnie. */
export function shortTime(t: string): string {
  return t.replace(/^0/, "");
}
