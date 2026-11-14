"use client";

import { useEffect, useState } from "react";
import { asset } from "@/lib/assets";
import type { Announcement, PriceGroup, Review, TeamMember } from "../data";
import { DAY_KEYS, type Hours } from "../hours";
import { DICT, localDuration, type Lang } from "../i18n";

/**
 * Ceny i zdjęcia galerii, które właściciel zmienia w panelu /admin.php bez przebudowy strony.
 *
 * Strona jest statyczna i od razu zawiera wartości domyślne (z app/content-defaults.json),
 * więc działa bez JavaScriptu i jest widoczna dla wyszukiwarek. Po załadowaniu przeglądarka
 * pobiera /content.json (zapisywany przez panel) i, jeśli plik istnieje, podmienia ceny
 * i zdjęcia. Brak pliku albo błąd sieci nic nie psuje: zostają wartości domyślne.
 */

export type GalleryEntry = {
  /** ścieżka bez rozmiaru i rozszerzenia, np. /img/cut-1 albo /uploads/gallery/ab12cd */
  base: string;
  widths: number[];
  alt: string;
  alt_en?: string;
  speed?: number;
};

export type LiveData = {
  prices: PriceGroup[] | null;
  gallery: GalleryEntry[] | null;
  reviews: Review[] | null;
  hours: Hours | null;
  team: TeamMember[] | null;
  announcement: Announcement | null;
};

const EMPTY: LiveData = { prices: null, gallery: null, reviews: null, hours: null, team: null, announcement: null };

const SPEEDS = [-0.06, 0.08, -0.04, 0.07];

const str = (v: unknown, max: number): string | null =>
  typeof v === "string" && v.length <= max ? v : null;

function cleanPrices(raw: unknown): PriceGroup[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 12) return null;
  const groups: PriceGroup[] = [];
  for (const g of raw) {
    const title = str(g?.title, 60);
    if (!title || !Array.isArray(g.items) || g.items.length > 40) return null;
    const title_en = str(g?.title_en, 60);
    const items = [];
    for (const it of g.items) {
      const name = str(it?.name, 100);
      const price = str(it?.price, 12);
      const duration = str(it?.duration, 40);
      if (!name || !price || duration === null) return null;
      const note = str(it?.note, 80);
      const name_en = str(it?.name_en, 100);
      const note_en = str(it?.note_en, 80);
      items.push({
        name,
        price,
        duration,
        ...(note ? { note } : {}),
        ...(name_en ? { name_en } : {}),
        ...(note_en ? { note_en } : {}),
      });
    }
    groups.push({ title, ...(title_en ? { title_en } : {}), items });
  }
  return groups;
}

function cleanGallery(raw: unknown): GalleryEntry[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 12) return null;
  const out: GalleryEntry[] = [];
  for (const g of raw) {
    const base = str(g?.base, 120);
    const alt = str(g?.alt, 160);
    // dozwolone tylko nasze własne ścieżki, nic zewnętrznego
    if (!base || alt === null || !/^\/(img|uploads\/gallery)\/[A-Za-z0-9._-]+$/.test(base)) return null;
    const widths = Array.isArray(g.widths) ? g.widths.filter((w: unknown) => Number.isInteger(w) && (w as number) > 0) : [];
    if (widths.length === 0) return null;
    const alt_en = str(g?.alt_en, 160) || undefined;
    out.push({ base: base.startsWith("/img/") ? asset(base) : base, widths, alt, alt_en, speed: typeof g.speed === "number" ? g.speed : undefined });
  }
  return out;
}

function cleanReviews(raw: unknown): Review[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 20) return null;
  const out: Review[] = [];
  for (const r of raw) {
    const name = str(r?.name, 80);
    const text = str(r?.text, 800);
    const date = str(r?.date, 60);
    if (!name || !text || date === null) return null;
    const rating = Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5 ? (r.rating as number) : 5;
    const url = typeof r.url === "string" && /^https:\/\/[^\s"<>]{3,300}$/.test(r.url) ? r.url : null;
    out.push({ name, date, text, rating, url });
  }
  return out;
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function cleanHours(raw: unknown): Hours | null {
  if (!raw || typeof raw !== "object") return null;
  const out = {} as Hours;
  for (const k of DAY_KEYS) {
    const v = (raw as Record<string, unknown>)[k];
    if (v === null) {
      out[k] = null;
    } else if (Array.isArray(v) && v.length === 2 && TIME.test(String(v[0])) && TIME.test(String(v[1])) && v[0] < v[1]) {
      out[k] = [v[0], v[1]];
    } else {
      return null;
    }
  }
  return out;
}

function cleanTeam(raw: unknown): TeamMember[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 12) return null;
  const out: TeamMember[] = [];
  for (const m of raw) {
    const id = str(m?.id, 40);
    const name = str(m?.name, 60);
    const role = str(m?.role, 60);
    if (!id || !name || role === null) return null;
    let photo: TeamMember["photo"] = null;
    const base = str(m?.photo?.base, 120);
    if (base && /^\/(img\/team|uploads\/team)\/[A-Za-z0-9._-]+$/.test(base)) {
      const widths = Array.isArray(m.photo.widths)
        ? m.photo.widths.filter((w: unknown) => Number.isInteger(w) && (w as number) > 0)
        : [];
      if (widths.length > 0) photo = { base: base.startsWith("/img/") ? asset(base) : base, widths };
    }
    out.push({
      id,
      name,
      role,
      role_en: str(m?.role_en, 60) || undefined,
      bio: str(m?.bio, 1200) || undefined,
      bio_en: str(m?.bio_en, 1200) || undefined,
      photo,
    });
  }
  return out;
}

function cleanAnnouncement(raw: unknown): Announcement | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  const text = str(a.text, 300) ?? "";
  const text_en = str(a.text_en, 300) ?? "";
  const until = typeof a.until === "string" && /^\d{4}-\d{2}-\d{2}$/.test(a.until) ? a.until : "";
  const url = typeof a.url === "string" && /^https:\/\/[^\s"<>]{3,300}$/.test(a.url) ? a.url : undefined;
  return { enabled: a.enabled === true, text, text_en, until, url };
}

let pending: Promise<LiveData> | null = null;

export function loadLive(): Promise<LiveData> {
  if (!pending) {
    pending = fetch(`/content.json?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => ({
        prices: cleanPrices(j?.prices),
        gallery: cleanGallery(j?.gallery),
        reviews: cleanReviews(j?.reviews),
        hours: cleanHours(j?.hours),
        team: cleanTeam(j?.team),
        announcement: cleanAnnouncement(j?.announcement),
      }))
      .catch(() => EMPTY);
  }
  return pending;
}

/** Wartość z content.json (jeśli jest i jest poprawna), inaczej domyślna ze statycznej strony. */
export function useLive<T>(pick: (d: LiveData) => T | null, initial: T): T {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    let alive = true;
    loadLive().then((d) => {
      const v = pick(d);
      if (alive && v !== null) setValue(v);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

/* ---------------- Cennik ---------------- */

export function PriceGrid({ groups: initial, lang = "pl" }: { groups: PriceGroup[]; lang?: Lang }) {
  const groups = useLive((d) => d.prices, initial);
  const t = DICT[lang];

  // klucze = indeksy: te same elementy DOM zostają, więc animacja pojawiania się dalej działa
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {groups.map((group, index) => (
        <div
          key={index}
          data-reveal={index === 1 ? "1" : index === 2 ? "2" : undefined}
          className="border border-white/10 bg-surface p-6 md:p-8"
        >
          <h3 className="font-display text-2xl text-gold">{lang === "en" ? group.title_en || group.title : group.title}</h3>
          <ul className="mt-4 divide-y divide-white/5">
            {group.items.map((item, i) => {
              const note = lang === "en" ? item.note_en || item.note : item.note;
              return (
                <li key={i} className="py-4">
                  <div className="flex items-baseline gap-3">
                    <span className="min-w-0 text-[15px] text-bone">
                      {lang === "en" ? item.name_en || item.name : item.name}
                    </span>
                    <span aria-hidden="true" className="min-w-4 flex-1 -translate-y-1 border-b border-dotted border-white/20" />
                    <span className="whitespace-nowrap font-display text-xl text-gold">
                      {item.price} <span className="font-sans text-xs text-muted">{t.pricing.currency}</span>
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {localDuration(item.duration, lang)}
                    {note ? ` · ${note}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Galeria sześciokątów ---------------- */

export function GalleryGrid({ items: initial, lang = "pl" }: { items: GalleryEntry[]; lang?: Lang }) {
  const items = useLive((d) => d.gallery, initial);

  return (
    <div data-parallax className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-0">
      {items.map((cut, index) => {
        const widths = cut.widths;
        const last = widths[widths.length - 1];
        const mid = widths[Math.min(1, widths.length - 1)];
        return (
          <div
            key={index}
            data-speed={cut.speed ?? SPEEDS[index % SPEEDS.length]}
            className={`lg:-mx-3 ${index % 2 === 1 ? "lg:mt-16" : ""}`}
          >
            <div className="cut hex-glow">
              <div className="hex relative aspect-[3/4] w-full overflow-hidden bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${cut.base}-${mid}.webp`}
                  srcSet={widths.map((w) => `${cut.base}-${w}.webp ${w}w`).join(", ")}
                  sizes="(min-width: 1024px) 300px, 46vw"
                  width={last}
                  height={Math.round((last * 4) / 3)}
                  alt={lang === "en" ? cut.alt_en || cut.alt : cut.alt}
                  loading="lazy"
                  decoding="async"
                  className="cut-img absolute inset-0 h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
