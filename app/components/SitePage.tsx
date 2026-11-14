import type { ReactNode } from "react";
import { FaClock, FaInstagram, FaMapMarkerAlt, FaPhoneAlt, FaStar } from "react-icons/fa";
import { asset, imgSrcSet, unsplashSrcSet } from "@/lib/assets";
import { DICT, LANG_PATH, type Lang } from "../i18n";
import Img from "./Img";
import { HoursList, OpenBadge, OpenFrom } from "./LiveBits";
import { GalleryGrid, PriceGrid } from "./LiveContent";
import ReviewsCarousel from "./ReviewsCarousel";
import ScrollEffects from "./ScrollEffects";
import SiteHeader from "./SiteHeader";
import TeamGrid from "./TeamGrid";
import Tracker from "./Tracker";
import {
  BOOKING_URL,
  CONTACT,
  CUTS,
  DEFAULT_HOURS,
  PRICE_GROUPS,
  REVIEWS,
  SITE_URL,
  TEAM,
  type GoogleReviewsData,
} from "../data";
import { DAY_KEYS } from "../hours";
import googleData from "../google-reviews.json";

const HERO_PHOTO = "photo-1599351431202-1e0f0137899a";

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
const reviewsUrl = google.mapsUri ?? CONTACT.googleReviewsUrl;

const DAY_NAMES_SCHEMA = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Godziny do JSON-LD: z wartości domyślnych (ta część strony jest statyczna, panel jej nie zmienia). */
function openingHoursSpec() {
  return DAY_KEYS.flatMap((k, i) => {
    const h = DEFAULT_HOURS[k];
    return h
      ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: DAY_NAMES_SCHEMA[i], opens: h[0], closes: h[1] }]
      : [];
  });
}

function buildJsonLd(lang: Lang) {
  return {
    "@context": "https://schema.org",
    "@type": "BarberShop",
    name: "Kingsman Barbershop",
    url: `${SITE_URL}${LANG_PATH[lang]}`,
    inLanguage: lang,
    telephone: CONTACT.phone,
    image: `${SITE_URL}/og.jpg`,
    address: {
      "@type": "PostalAddress",
      streetAddress: CONTACT.street,
      postalCode: CONTACT.postalCode,
      addressLocality: CONTACT.city,
      addressCountry: "PL",
    },
    openingHoursSpecification: openingHoursSpec(),
    sameAs: [CONTACT.instagramUrl, BOOKING_URL],
    ...(google.rating && google.count
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: google.rating, reviewCount: google.count } }
      : {}),
  };
}

export default function SitePage({ lang }: { lang: Lang }) {
  const t = DICT[lang];
  const ratingShort = google.rating
    ? google.rating.toFixed(1).replace(".", lang === "en" ? "." : ",")
    : lang === "en"
      ? "5.0"
      : "5,0";
  const ratingIntro = t.reviews.intro(google.rating ? ratingShort : null, google.count ?? null);
  return (
    <>
    <main id="top" className="min-h-screen overflow-x-clip bg-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(lang)) }} />
      <ScrollEffects />
      <Tracker />
      <SiteHeader lang={lang} />

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
            {t.hero.eyebrow}
          </p>
          <h1 className="max-w-3xl font-display text-4xl leading-[1.1] text-bone sm:text-5xl md:text-6xl">
            {t.hero.h1a}
            <span className="text-gold">{t.hero.h1b}</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-bone/75 md:text-lg">
            {t.hero.lead}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gold px-8 py-4 text-center text-[13px] font-semibold uppercase tracking-[0.18em] text-black transition-colors hover:bg-gold-light"
            >
              {t.book}
            </a>
            <a
              href="#pricing"
              className="border border-white/25 px-8 py-4 text-center text-[13px] font-semibold uppercase tracking-[0.18em] text-bone transition-colors hover:border-gold hover:text-gold"
            >
              {t.hero.seePrices}
            </a>
          </div>

          <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-bone/70">
            <li className="flex items-center gap-2">
              <FaStar className="text-gold" aria-hidden="true" /> {t.hero.onGoogle(ratingShort)}
            </li>
            <li className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-gold" aria-hidden="true" /> {CONTACT.street}, {CONTACT.district}
            </li>
            <li className="flex items-center gap-2">
              <OpenBadge lang={lang} />
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
                    alt={t.about.photo1}
                    loading="lazy"
                    decoding="async"
                    className="about-img absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-gold/10" />
                  <div className="pointer-events-none absolute bottom-3 left-3 whitespace-nowrap text-[8px] uppercase tracking-[0.22em] text-bone/80 md:bottom-4 md:left-4 md:text-[10px] md:tracking-[0.28em]">
                    {t.about.tag1}
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
                    alt={t.about.photo2}
                    className="about-img absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="pointer-events-none absolute bottom-3 right-3 whitespace-nowrap text-[8px] uppercase tracking-[0.22em] text-bone/70 md:bottom-4 md:right-4 md:text-[10px] md:tracking-[0.28em]">
                    {t.about.tag2}
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
                {t.about.ident}
              </div>
              <div
                aria-hidden="true"
                className="absolute right-5 top-4 z-40 text-[9px] uppercase tracking-[0.35em] text-muted/70"
              >
                {t.about.place}
              </div>
            </div>

            {/* rama prowadząca wzrok */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-6 z-40 rounded-[2.2rem] border border-gold/10 md:inset-3"
            />
          </div>

          <div data-reveal="1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold">{t.about.eyebrow}</p>
            <h2 className="font-display text-3xl leading-tight md:text-5xl">
              {t.about.h2a}<span className="text-gold">{t.about.h2b}</span>
            </h2>
            <div aria-hidden="true" className="barber-pole mt-5 h-1.5 w-20 opacity-80" />
            <p className="mt-6 text-base leading-relaxed text-bone/80 md:text-lg">
              {t.about.p}
            </p>
            <p className="mt-5 font-display text-lg italic text-gold/90">{t.about.quote}</p>

            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.2em] text-muted">{t.about.rating}</dt>
                <dd className="mt-1 font-display text-2xl text-gold md:text-3xl">{ratingShort}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.2em] text-muted">{t.about.open}</dt>
                <dd className="mt-1 font-display text-2xl text-gold md:text-3xl">
                  <OpenFrom lang={lang} />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.2em] text-muted">{t.about.location}</dt>
                <dd className="mt-1 font-display text-2xl text-gold md:text-3xl">{t.about.district}</dd>
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
            eyebrow={t.pricing.eyebrow}
            title={
              <>
                {t.pricing.h2a}
                <span className="text-gold">{t.pricing.h2b}</span>
              </>
            }
            intro={t.pricing.intro}
          />

          <PriceGrid groups={PRICE_GROUPS} lang={lang} />

          <div className="mt-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <p className="text-sm text-muted">{t.pricing.plus}</p>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gold px-8 py-4 text-center text-[13px] font-semibold uppercase tracking-[0.18em] text-black transition-colors hover:bg-gold-light sm:w-auto"
            >
              {t.bookBooksy}
            </a>
          </div>
        </div>
      </section>

      {/* ============ ZESPÓŁ ============ */}
      <section id="team" className="team-grid relative scroll-mt-20 overflow-hidden py-20 md:py-28">
        <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-8">
          <SectionHeading
            eyebrow={t.team.eyebrow}
            title={
              <>
                {t.team.h2a}
                <span className="text-gold">{t.team.h2b}</span>
              </>
            }
            intro={t.team.intro}
          />

          <TeamGrid members={TEAM} lang={lang} />
        </div>
      </section>

      {/* ============ REALIZACJE ============ */}
      <section id="gallery" className="scroll-mt-20 overflow-hidden border-t border-white/5 bg-[#0e0e0e] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <SectionHeading
            eyebrow={t.gallery.eyebrow}
            title={
              <>
                {t.gallery.h2a}
                <span className="text-gold">{t.gallery.h2b}</span>
              </>
            }
          />

          <GalleryGrid
            items={CUTS.map((cut) => ({
              base: asset(`/img/${cut.name}`),
              widths: [...cut.widths],
              alt: cut.alt,
              alt_en: cut.alt_en,
              speed: cut.speed,
            }))}
            lang={lang}
          />
        </div>
      </section>

      {/* ============ OPINIE ============ */}
      <section id="reviews" className="mx-auto max-w-6xl scroll-mt-20 overflow-hidden px-5 py-20 md:px-8 md:py-28">
        <SectionHeading
          eyebrow={t.reviews.eyebrow}
          title={
            <>
              {t.reviews.h2a}
              <span className="text-gold">{t.reviews.h2b}</span>
            </>
          }
          intro={ratingIntro}
        />
        <ReviewsCarousel reviews={reviews} lang={lang} />
        <div className="mt-4">
          <a
            href={reviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium uppercase tracking-[0.18em] text-gold underline underline-offset-8 transition-colors hover:text-gold-light"
          >
            {t.reviews.all}
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
              {t.footer.tagline}
            </p>
          </div>

          <div>
            <h3 className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              <FaClock aria-hidden="true" /> {t.footer.hours}
            </h3>
            <HoursList lang={lang} />
            <p className="mt-5 text-sm">
              <OpenBadge lang={lang} icon={false} />
            </p>
          </div>

          <div>
            <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-gold">{t.footer.contact}</h3>
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
            <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-gold">{t.footer.booking}</h3>
            <p className="mb-6 text-sm leading-relaxed text-muted">
              {t.footer.bookingText}
            </p>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gold px-6 py-4 text-center text-[13px] font-semibold uppercase tracking-[0.18em] text-black transition-colors hover:bg-gold-light"
            >
              {t.book}
            </a>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-muted md:flex-row">
          <p>{t.footer.rights(new Date().getFullYear())}</p>
          <p>Różana 6, Wilda</p>
        </div>
      </footer>
    </main>
    </>
  );
}
