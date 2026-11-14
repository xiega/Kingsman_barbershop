"use client";

import { asset, imgSrcSet } from "@/lib/assets";
import type { TeamMember } from "../data";
import { DICT, type Lang } from "../i18n";
import { useLive } from "./LiveContent";

/** Każda karta ma inny kształt opisu: skosy, ścięte górne rogi i wcięta zakładka. */
const BIO_SHAPES = ["bio-a", "bio-b", "bio-c"];

/**
 * Zespół z panelu /admin.php (content.json). Statyczna strona zawiera wartości domyślne,
 * po załadowaniu lista jest podmieniana. Klucze = indeksy, żeby animacje pojawiania się działały dalej.
 */
export default function TeamGrid({ members: initial, lang = "pl" }: { members: TeamMember[]; lang?: Lang }) {
  const members = useLive((d) => d.team, initial);
  const t = DICT[lang].team;

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member, index) => {
        const photo = member.photo;
        const role = lang === "en" ? member.role_en || member.role : member.role;
        const bio = lang === "en" ? member.bio_en || member.bio : member.bio;
        const num = String(index + 1).padStart(2, "0");
        const shape = index % BIO_SHAPES.length;
        const widths = photo?.widths ?? [];
        const mid = widths[Math.min(1, widths.length - 1)];
        const last = widths[widths.length - 1];
        return (
          <article
            key={index}
            data-reveal={index % 3 === 1 ? "1" : index % 3 === 2 ? "2" : undefined}
            className="team-card flex flex-col"
          >
            <div
              className={`cut-corner relative overflow-hidden bg-black ${
                photo ? "aspect-[4/5]" : "aspect-[16/9] sm:aspect-[4/5]"
              }`}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${photo.base}-${mid}.webp`}
                  srcSet={widths.map((w) => `${photo.base}-${w}.webp ${w}w`).join(", ")}
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
                  width={last}
                  height={Math.round(last * 1.25)}
                  alt={t.alt(member.name, role)}
                  loading="lazy"
                  decoding="async"
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
                <span>{role}</span>
              </div>
              <div className="pointer-events-none absolute inset-x-5 bottom-5">
                <h3 className="font-display text-3xl text-bone">{member.name}</h3>
                <div aria-hidden="true" className="barber-pole mt-3 h-1 w-16 opacity-90" />
              </div>
            </div>

            {bio && (
              <div className={`bio ${BIO_SHAPES[shape]} mt-3 flex-1`}>
                <div className={`h-full bg-surface p-5 ${shape === 2 ? "pt-8" : ""}`}>
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">{t.profile}</p>
                  <p className="whitespace-pre-line text-[15px] leading-relaxed text-bone/75">{bio}</p>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
