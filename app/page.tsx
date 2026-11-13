import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { FaClock, FaInstagram, FaMapMarkerAlt, FaPhoneAlt, FaStar } from "react-icons/fa";
import { asset, imgSrcSet, unsplashSrcSet } from "@/lib/assets";
import Img from "./components/Img";
import ReviewsCarousel from "./components/ReviewsCarousel";
import ScrollEffects from "./components/ScrollEffects";
import SiteHeader from "./components/SiteHeader";
import {
  BOOKING_URL,
  CONTACT,
  CUTS,
  HOURS,
  PRICE_GROUPS,
  REVIEWS,
  SITE_URL,
  TEAM,
} from "./data";

const HERO_PHOTO = "photo-1599351431202-1e0f0137899a";

/** Zdjęcie zespołu jest pokazywane, gdy plik istnieje w public/img/team. */
function hasTeamPhoto(slug: string): boolean {
  return existsSync(join(process.cwd(), "public", "img", "team", `${slug}-400.webp`));
}

function SectionHeading({
  eyebrow,
  title,
  intro,
  center = false,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: string;
  center?: boolean;
}) {
  return (
    <div data-reveal className={`mb-12 max-w-2xl md:mb-16 ${center ? "mx-auto text-center" : ""}`}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
      <h2 className="font-display text-3xl leading-tight text-bone md:text-5xl">{title}</h2>
      <div className={`mt-5 h-px w-16 bg-gold/60 ${center ? "mx-auto" : ""}`} />
      {intro && <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">{intro}</p>}
    </div>
  );
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BarberShop",
  name: "Kingsman Barbershop",
  url: SITE_URL,
  telephone: CONTACT.phone,
  image: `${SITE_URL}/og.jpg`,
  address: {
    "@type": "PostalAddress",
    streetAddress: CONTACT.street,
    postalCode: CONTACT.postalCode,
    addressLocality: CONTACT.city,
    addressCountry: "PL",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      opens: "07:00",
      closes: "16:00",
    },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "07:00", closes: "20:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "07:00", closes: "16:00" },
  ],
  sameAs: [CONTACT.instagramUrl, BOOKING_URL],
};

export default function Home() {
  return (
    <main id="top" className="min-h-screen overflow-x-clip bg-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ScrollEffects />
      <SiteHeader />

      {/* ============ HERO ============ */}
      <section className="slant-bottom relative isolate flex min-h-[88svh] items-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://images.unsplash.com/${HERO_PHOTO}?q=65&w=1280&auto=format&fit=crop`}
          srcSet={unsplashSrcSet(HERO_PHOTO, [640, 960, 1280, 1920])}
          sizes="100vw"
          width={1920}
          height={1280}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/70 via-ink/30 to-ink" />

        <div className="mx-auto w-full max-w-6xl px-5 pb-28 pt-32 md:px-8">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            Barbershop · Wilda, Poznań
          </p>
          <h1 className="max-w-3xl font-display text-4xl leading-[1.1] text-bone sm:text-5xl md:text-6xl">
            Twój styl to zbroja współczesnego <span className="text-gold">dżentelmena.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-bone/75 md:text-lg">
            Kingsman to zbrojownia, w której wykuwamy ją na nowo. Klasyczne strzyżenie i pielęgnacja
            brody w sercu poznańskiej Wildy.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gold px-8 py-4 text-center text-[13px] font-semibold uppercase tracking-[0.18em] text-black transition-colors hover:bg-gold-light"
            >
              Zarezerwuj wizytę
            </a>
            <a
              href="#pricing"
              className="border border-white/25 px-8 py-4 text-center text-[13px] font-semibold uppercase tracking-[0.18em] text-bone transition-colors hover:border-gold hover:text-gold"
            >
              Zobacz cennik
            </a>
          </div>

          <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-bone/70">
            <li className="flex items-center gap-2">
              <FaStar className="text-gold" aria-hidden="true" /> 5,0 w Google
            </li>
            <li className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-gold" aria-hidden="true" /> {CONTACT.street}, {CONTACT.district}
            </li>
            <li className="flex items-center gap-2">
              <FaClock className="text-gold" aria-hidden="true" /> Pon–Sob od 7:00
            </li>
          </ul>
        </div>
      </section>

      {/* ============ O NAS ============ */}
      <section id="about" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 md:px-8 md:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div data-reveal className="relative mx-auto w-full max-w-md pb-6 lg:max-w-none">
            <div
              aria-hidden="true"
              className="cut-corner absolute inset-0 translate-x-4 translate-y-4 border border-gold/40"
            />
            <div className="cut-corner relative aspect-[4/5] overflow-hidden bg-surface">
              <Img
                name="about"
                widths={[480, 800, 1200]}
                sizes="(min-width: 1024px) 560px, 90vw"
                width={800}
                height={1200}
                alt="Barber układa przedziałek brzytwą i grzebieniem"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div data-reveal="1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold">O nas</p>
            <h2 className="font-display text-3xl leading-tight md:text-5xl">
              Tworzymy <span className="text-gold">tożsamość</span>
            </h2>
            <div className="mt-5 h-px w-16 bg-gold/60" />
            <p className="mt-6 text-base leading-relaxed text-bone/80 md:text-lg">
              Nasza tajna baza na poznańskiej Wildzie to miejsce, w którym rzemiosło spotyka się z kinową
              elegancją. Wchodzisz tu jako mężczyzna, wychodzisz jako członek najbardziej elitarnego klubu
              w mieście.
            </p>
            <p className="mt-5 font-display text-lg italic text-gold/90">„Oksfordy. Nie brogsy.”</p>

            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.2em] text-muted">Ocena Google</dt>
                <dd className="mt-1 font-display text-2xl text-gold md:text-3xl">5,0</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.2em] text-muted">Otwarte</dt>
                <dd className="mt-1 font-display text-2xl text-gold md:text-3xl">od 7:00</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.2em] text-muted">Lokalizacja</dt>
                <dd className="mt-1 font-display text-2xl text-gold md:text-3xl">Wilda</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ============ CENNIK ============ */}
      <section id="pricing" className="scroll-mt-20 border-y border-white/5 bg-[#0e0e0e] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <SectionHeading
            eyebrow="Cennik"
            title={
              <>
                Usługi i <span className="text-gold">ceny</span>
              </>
            }
            intro="Przejrzysty cennik i czas trwania każdej usługi. Termin wybierasz online w Booksy."
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {PRICE_GROUPS.map((group, index) => (
              <div
                key={group.title}
                data-reveal={index === 1 ? "1" : index === 2 ? "2" : undefined}
                className="border border-white/10 bg-surface p-6 md:p-8"
              >
                <h3 className="font-display text-2xl text-gold">{group.title}</h3>
                <ul className="mt-4 divide-y divide-white/5">
                  {group.items.map((item) => (
                    <li key={item.name} className="py-4">
                      <div className="flex items-baseline gap-3">
                        <span className="min-w-0 text-[15px] text-bone">{item.name}</span>
                        <span
                          aria-hidden="true"
                          className="min-w-4 flex-1 -translate-y-1 border-b border-dotted border-white/20"
                        />
                        <span className="whitespace-nowrap font-display text-xl text-gold">
                          {item.price} <span className="font-sans text-xs text-muted">zł</span>
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {item.duration}
                        {item.note ? ` · ${item.note}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <p className="text-sm text-muted">Ceny z plusem („+”) to ceny od.</p>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gold px-8 py-4 text-center text-[13px] font-semibold uppercase tracking-[0.18em] text-black transition-colors hover:bg-gold-light sm:w-auto"
            >
              Zarezerwuj w Booksy
            </a>
          </div>
        </div>
      </section>

      {/* ============ ZESPÓŁ ============ */}
      <section id="team" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 md:px-8 md:py-28">
        <SectionHeading
          eyebrow="Zespół"
          title={
            <>
              Ludzie za <span className="text-gold">fotelem</span>
            </>
          }
          intro="Poznaj osoby, które zadbają o Twój styl."
        />

        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((member, index) => {
            const photo = hasTeamPhoto(member.slug);
            return (
              <article
                key={member.slug}
                data-reveal={index === 1 ? "1" : index === 2 ? "2" : undefined}
              >
                <div
                  className={`cut-corner relative overflow-hidden border border-white/10 bg-surface ${
                    photo ? "aspect-[4/5]" : "aspect-[16/9] sm:aspect-[4/5]"
                  }`}
                >
                  {photo ? (
                    <Img
                      name={`team/${member.slug}`}
                      widths={[400, 800]}
                      sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
                      width={800}
                      height={1000}
                      alt={`${member.name}, ${member.role} w Kingsman Barbershop`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#161616] to-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset("/img/logo-full-480.webp")}
                        srcSet={imgSrcSet("logo-full", [480, 966])}
                        sizes="200px"
                        width={200}
                        height={51}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-40 opacity-30"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-5">
                  <h3 className="font-display text-2xl text-bone">{member.name}</h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-gold">{member.role}</p>
                  {member.bio && <p className="mt-4 text-[15px] leading-relaxed text-muted">{member.bio}</p>}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ============ REALIZACJE ============ */}
      <section id="gallery" className="scroll-mt-20 overflow-hidden border-t border-white/5 bg-[#0e0e0e] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <SectionHeading
            eyebrow="Realizacje"
            title={
              <>
                Efekty, które <span className="text-gold">mówią same za siebie</span>
              </>
            }
          />

          <div data-parallax className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-0">
            {CUTS.map((cut, index) => (
              <div
                key={cut.name}
                data-speed={cut.speed}
                className={`lg:-mx-3 ${index % 2 === 1 ? "lg:mt-16" : ""}`}
              >
                <div className="cut hex aspect-[3/4] w-full bg-gold p-[2px]">
                  <div className="hex relative h-full w-full overflow-hidden bg-black">
                    <Img
                      name={cut.name}
                      widths={cut.widths}
                      sizes="(min-width: 1024px) 300px, 46vw"
                      width={cut.widths[cut.widths.length - 1]}
                      height={Math.round((cut.widths[cut.widths.length - 1] * 4) / 3)}
                      alt={cut.alt}
                      className="cut-img absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ OPINIE ============ */}
      <section id="reviews" className="mx-auto max-w-6xl scroll-mt-20 overflow-hidden px-5 py-20 md:px-8 md:py-28">
        <SectionHeading
          eyebrow="Opinie"
          title={
            <>
              Co mówią <span className="text-gold">klienci</span>
            </>
          }
          intro="Ocena 5,0 / 5 w Google."
        />
        <ReviewsCarousel reviews={REVIEWS} />
        <div className="mt-8">
          <a
            href={CONTACT.googleReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium uppercase tracking-[0.18em] text-gold underline underline-offset-8 transition-colors hover:text-gold-light"
          >
            Zobacz wszystkie opinie w Google
          </a>
        </div>
      </section>

      {/* ============ KONTAKT / STOPKA ============ */}
      <footer id="contact" className="scroll-mt-20 border-t border-white/10 bg-black px-5 pb-10 pt-20 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 border-b border-white/10 pb-14 md:grid-cols-2 lg:grid-cols-[1.1fr_1.5fr_1.2fr_1fr]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset("/img/logo-full-480.webp")}
              srcSet={imgSrcSet("logo-full", [480, 966])}
              sizes="220px"
              width={220}
              height={56}
              alt="Kingsman Barbershop"
              loading="lazy"
              decoding="async"
              className="w-52"
            />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted">
              Klasyczny barbershop na Wildzie. Miejsce, gdzie rzemiosło spotyka się z nienagannym stylem.
            </p>
          </div>

          <div>
            <h3 className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              <FaClock aria-hidden="true" /> Godziny otwarcia
            </h3>
            <ul className="space-y-3 text-sm">
              {HOURS.map((row) => (
                <li key={row.days} className="flex justify-between gap-4 border-b border-white/5 pb-3">
                  <span className="text-muted">{row.days}</span>
                  <span className={`whitespace-nowrap ${row.time === "Zamknięte" ? "text-muted" : "text-bone"}`}>
                    {row.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-gold">Kontakt</h3>
            <ul className="space-y-4 text-sm text-bone/85">
              <li>
                <a
                  href={CONTACT.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 transition-colors hover:text-gold"
                >
                  <FaMapMarkerAlt className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                  <span>
                    {CONTACT.street}, {CONTACT.postalCode} {CONTACT.city}
                    <br />
                    <span className="text-muted">{CONTACT.district}</span>
                  </span>
                </a>
              </li>
              <li>
                <a href={CONTACT.phoneHref} className="flex items-center gap-3 transition-colors hover:text-gold">
                  <FaPhoneAlt className="shrink-0 text-gold" aria-hidden="true" /> {CONTACT.phone}
                </a>
              </li>
              <li>
                <a
                  href={CONTACT.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 transition-colors hover:text-gold"
                >
                  <FaInstagram className="shrink-0 text-gold" aria-hidden="true" /> {CONTACT.instagramHandle}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-gold">Rezerwacja</h3>
            <p className="mb-6 text-sm leading-relaxed text-muted">
              Wybierz usługę i dogodny termin. Rezerwacja online zajmuje minutę.
            </p>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gold px-6 py-4 text-center text-[13px] font-semibold uppercase tracking-[0.18em] text-black transition-colors hover:bg-gold-light"
            >
              Zarezerwuj wizytę
            </a>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-muted md:flex-row">
          <p>© {new Date().getFullYear()} Kingsman Barbershop Poznań. Wszelkie prawa zastrzeżone.</p>
          <p>Różana 6, Wilda</p>
        </div>
      </footer>
    </main>
  );
}
