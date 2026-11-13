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
  type GoogleReviewsData,
} from "./data";
import googleData from "./google-reviews.json";

const HERO_PHOTO = "photo-1599351431202-1e0f0137899a";

/** Zdjęcie zespołu jest pokazywane, gdy plik istnieje w public/img/team. */
/** Każda karta ma inny kształt opisu: skosy, schodki "piksel" i wcięta zakładka. */
const BIO_SHAPES = ["bio-a", "bio-b", "bio-c"];

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
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold">
        <span aria-hidden="true" className="neon-dash" />
        {eyebrow}
      </p>
      <h2 className="font-display text-3xl leading-tight text-bone md:text-5xl">{title}</h2>
      <div aria-hidden="true" className={`barber-pole mt-5 h-1.5 w-20 opacity-80 ${center ? "mx-auto" : ""}`} />
      {intro &&<p className="mt-5 text-base leading-relaxed text-muted md:text-lg">{intro}</p>}
    </div>
  );
}

/** Dane z Google (app/google-reviews.json, generowane przy buildzie). Bez nich zostają opinie z data.ts. */
const google = googleData as GoogleReviewsData;
const hasLiveReviews = google.reviews.length > 0;
const reviews = hasLiveReviews ? google.reviews : REVIEWS;
const ratingShort = google.rating ? google.rating.toFixed(1).replace(".", ",") : "5,0";
const reviewsUrl = google.mapsUri ?? CONTACT.googleReviewsUrl;

function opinionsLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 1) return "opinia";
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return "opinie";
  return "opinii";
}

const ratingIntro = google.rating
  ? `Ocena ${ratingShort} / 5 w Google${google.count ? ` · ${google.count} ${opinionsLabel(google.count)}` : ""}.`
  : "Ocena 5,0 / 5 w Google.";

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
  ...(google.rating && google.count
    ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: google.rating,
          reviewCount: google.count,
        },
      }
    : {}),
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
              <FaStar className="text-gold" aria-hidden="true" /> {ratingShort} w Google
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
          <div
            data-reveal
            data-anim
            data-parallax
            className="relative mx-auto flex h-[480px] w-full max-w-md items-center justify-center md:h-[620px] lg:max-w-none"
          >
            {/* dekoracje za kadrem */}
            <div
              aria-hidden="true"
              className="gold-orbit absolute h-72 w-72 rounded-full border border-gold/20 md:h-[28rem] md:w-[28rem]"
            />
            <div
              aria-hidden="true"
              className="micro-pulse shape-diamond absolute h-60 w-60 bg-gold/10 md:h-80 md:w-80"
            />
            <div
              aria-hidden="true"
              className="neon-flicker neon-glow absolute h-44 w-44 rotate-45 border-2 border-neon md:h-60 md:w-60"
            />
            <div
              aria-hidden="true"
              className="absolute h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(201,165,92,0.14),transparent_70%)] md:h-72 md:w-72"
            />

            {/* wspólny kadr: nic z ruchomych zdjęć nie wychodzi poza sekcję */}
            <div className="absolute inset-3 overflow-hidden rounded-[2rem] border border-white/5 bg-black/20 md:inset-0 md:rounded-[2.2rem]">
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-gold/25 to-transparent"
              />
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-3/4 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-gold/20 to-transparent"
              />

              {/* zdjęcie 01 */}
              <div
                data-speed="0.1"
                className="shape-para-a absolute left-2 top-8 z-20 h-56 w-44 md:left-6 md:top-10 md:h-80 md:w-64"
              >
                <div className="identity-float relative h-full w-full overflow-hidden border border-gold/30 shadow-[0_20px_60px_rgba(0,0,0,.45)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=70&w=480&auto=format&fit=crop"
                    srcSet={unsplashSrcSet("photo-1503951914875-452162b0f3f1", [320, 480, 640], 70)}
                    sizes="(min-width: 768px) 256px, 176px"
                    width={480}
                    height={600}
                    alt="Barber przy pracy"
                    loading="lazy"
                    decoding="async"
                    className="about-img absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-gold/10" />
                  <div className="pointer-events-none absolute bottom-3 left-3 whitespace-nowrap text-[8px] uppercase tracking-[0.22em] text-bone/80 md:bottom-4 md:left-4 md:text-[10px] md:tracking-[0.28em]">
                    01 / Rzemiosło
                  </div>
                  <div className="pointer-events-none absolute right-3 top-3 text-[8px] uppercase tracking-[0.22em] text-gold md:right-4 md:top-4 md:text-[10px] md:tracking-[0.28em]">
                    Kingsman
                  </div>
                </div>
              </div>

              {/* zdjęcie 02 */}
              <div
                data-speed="-0.1"
                className="shape-para-b absolute bottom-8 right-2 z-10 h-56 w-44 border-l-2 border-gold/30 md:bottom-10 md:right-6 md:h-80 md:w-64"
              >
                <div className="identity-float-reverse relative h-full w-full overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,.45)]">
                  <Img
                    name="about"
                    widths={[480, 800, 1200]}
                    sizes="(min-width: 768px) 256px, 176px"
                    width={800}
                    height={1200}
                    alt="Barber układa przedziałek brzytwą i grzebieniem"
                    className="about-img absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="pointer-events-none absolute bottom-3 right-3 whitespace-nowrap text-[8px] uppercase tracking-[0.22em] text-bone/70 md:bottom-4 md:right-4 md:text-[10px] md:tracking-[0.28em]">
                    02 / Charakter
                  </div>
                </div>
              </div>

              {/* znak środka kompozycji */}
              <div
                aria-hidden="true"
                className="micro-pulse absolute left-1/2 top-1/2 z-30 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold/30 bg-black/60 md:h-20 md:w-20"
              >
                <span className="text-lg text-gold">♛</span>
              </div>

              <div
                aria-hidden="true"
                className="absolute bottom-4 left-5 z-40 text-[9px] uppercase tracking-[0.35em] text-muted/70"
              >
                IDENT. / 001
              </div>
              <div
                aria-hidden="true"
                className="absolute right-5 top-4 z-40 text-[9px] uppercase tracking-[0.35em] text-muted/70"
              >
                WILDA / POZNAŃ
              </div>
            </div>

            {/* rama prowadząca wzrok */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-6 z-40 rounded-[2.2rem] border border-gold/10 md:inset-3"
            />
          </div>

          <div data-reveal="1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold">O nas</p>
            <h2 className="font-display text-3xl leading-tight md:text-5xl">
              Tworzymy <span className="text-gold">tożsamość</span>
            </h2>
            <div aria-hidden="true" className="barber-pole mt-5 h-1.5 w-20 opacity-80" />
            <p className="mt-6 text-base leading-relaxed text-bone/80 md:text-lg">
              Nasza tajna baza na poznańskiej Wildzie to miejsce, w którym rzemiosło spotyka się z kinową
              elegancją. Wchodzisz tu jako mężczyzna, wychodzisz jako członek najbardziej elitarnego klubu
              w mieście.
            </p>
            <p className="mt-5 font-display text-lg italic text-gold/90">„Oksfordy. Nie brogsy.”</p>

            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.2em] text-muted">Ocena Google</dt>
                <dd className="mt-1 font-display text-2xl text-gold md:text-3xl">{ratingShort}</dd>
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

      <div aria-hidden="true" className="barber-pole h-2 w-full opacity-60" />

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
      <section id="team" className="team-grid relative scroll-mt-20 overflow-hidden py-20 md:py-28">
        <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-8">
          <SectionHeading
            eyebrow="Zespół"
            title={
              <>
                Ludzie za <span className="text-gold">fotelem</span>
              </>
            }
            intro="Poznaj osoby, które zadbają o Twój styl."
          />

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((member, index) => {
              const photo = hasTeamPhoto(member.slug);
              const num = String(index + 1).padStart(2, "0");
              return (
                <article
                  key={member.slug}
                  data-reveal={index === 1 ? "1" : index === 2 ? "2" : undefined}
                  className="team-card flex flex-col"
                >
                  <div
                    className={`cut-corner relative overflow-hidden bg-black ${
                      photo ? "aspect-[4/5]" : "aspect-[16/9] sm:aspect-[4/5]"
                    }`}
                  >
                    {photo ? (
                      <Img
                        name={`team/${member.slug}`}
                        widths={[400, 800]}
                        sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
                        width={800}
                        height={800}
                        alt={`${member.name}, ${member.role} w Kingsman Barbershop`}
                        className="team-photo h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#161616] to-black">
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

                    {/* ton, linie i narożniki HUD: statyczne, bez ruchu */}
                    <div aria-hidden="true" className="team-tone pointer-events-none absolute inset-0" />
                    <div aria-hidden="true" className="team-lines pointer-events-none absolute inset-0" />
                    <span aria-hidden="true" className="team-bracket left-3 top-3 border-l-2 border-t-2" />
                    <span aria-hidden="true" className="team-bracket right-3 top-3 border-r-2 border-t-2" />
                    <span aria-hidden="true" className="team-bracket bottom-3 left-3 border-b-2 border-l-2" />

                    <div className="pointer-events-none absolute inset-x-8 top-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-gold">
                      <span className="neon-text">KM / {num}</span>
                      <span>{member.role}</span>
                    </div>
                    <div className="pointer-events-none absolute inset-x-5 bottom-5">
                      <h3 className="font-display text-3xl text-bone">{member.name}</h3>
                      <div aria-hidden="true" className="barber-pole mt-3 h-1 w-16 opacity-90" />
                    </div>
                  </div>

                  {member.bio && (
                    <div className={`bio ${BIO_SHAPES[index % BIO_SHAPES.length]} mt-3 flex-1`}>
                      <div className={`h-full bg-surface p-5 ${index % BIO_SHAPES.length === 2 ? "pt-8" : ""} ${index % BIO_SHAPES.length === 1 ? "pt-9" : ""}`}>
                        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">
                          {"// profil"}
                        </p>
                        <p className="whitespace-pre-line text-[15px] leading-relaxed text-bone/75">{member.bio}</p>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
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
                <div className="cut hex-glow">
                  <div className="hex relative aspect-[3/4] w-full overflow-hidden bg-surface">
                    <Img
                      name={cut.name}
                      widths={cut.widths}
                      sizes="(min-width: 1024px) 300px, 46vw"
                      width={cut.widths[cut.widths.length - 1]}
                      height={Math.round((cut.widths[cut.widths.length - 1] * 4) / 3)}
                      alt={cut.alt}
                      className="cut-img absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
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
          intro={ratingIntro}
        />
        <ReviewsCarousel reviews={reviews} />
        <div className="mt-8">
          <a
            href={reviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium uppercase tracking-[0.18em] text-gold underline underline-offset-8 transition-colors hover:text-gold-light"
          >
            Zobacz wszystkie opinie w Google
          </a>
        </div>
      </section>

      <div aria-hidden="true" className="barber-pole h-2 w-full opacity-60" />

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
