"use client";

import { useEffect, useState } from "react";
import { asset } from "@/lib/assets";
import type { PriceGroup } from "../data";

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
  speed?: number;
};

type LiveData = { prices: PriceGroup[] | null; gallery: GalleryEntry[] | null };

const SPEEDS = [-0.06, 0.08, -0.04, 0.07];

const str = (v: unknown, max: number): string | null =>
  typeof v === "string" && v.length <= max ? v : null;

function cleanPrices(raw: unknown): PriceGroup[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 12) return null;
  const groups: PriceGroup[] = [];
  for (const g of raw) {
    const title = str(g?.title, 60);
    if (!title || !Array.isArray(g.items) || g.items.length > 40) return null;
    const items = [];
    for (const it of g.items) {
      const name = str(it?.name, 100);
      const price = str(it?.price, 12);
      const duration = str(it?.duration, 40);
      if (!name || !price || duration === null) return null;
      const note = str(it?.note, 80);
      items.push({ name, price, duration, ...(note ? { note } : {}) });
    }
    groups.push({ title, items });
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
    out.push({ base: base.startsWith("/img/") ? asset(base) : base, widths, alt, speed: typeof g.speed === "number" ? g.speed : undefined });
  }
  return out;
}

let pending: Promise<LiveData> | null = null;

function loadLive(): Promise<LiveData> {
  if (!pending) {
    pending = fetch(`/content.json?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => ({ prices: cleanPrices(j?.prices), gallery: cleanGallery(j?.gallery) }))
      .catch(() => ({ prices: null, gallery: null }));
  }
  return pending;
}

/* ---------------- Cennik ---------------- */

export function PriceGrid({ groups: initial }: { groups: PriceGroup[] }) {
  const [groups, setGroups] = useState(initial);

  useEffect(() => {
    let alive = true;
    loadLive().then((d) => alive && d.prices && setGroups(d.prices));
    return () => {
      alive = false;
    };
  }, []);

  // klucze = indeksy: te same elementy DOM zostają, więc animacja pojawiania się dalej działa
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {groups.map((group, index) => (
        <div
          key={index}
          data-reveal={index === 1 ? "1" : index === 2 ? "2" : undefined}
          className="border border-white/10 bg-surface p-6 md:p-8"
        >
          <h3 className="font-display text-2xl text-gold">{group.title}</h3>
          <ul className="mt-4 divide-y divide-white/5">
            {group.items.map((item, i) => (
              <li key={i} className="py-4">
                <div className="flex items-baseline gap-3">
                  <span className="min-w-0 text-[15px] text-bone">{item.name}</span>
                  <span aria-hidden="true" className="min-w-4 flex-1 -translate-y-1 border-b border-dotted border-white/20" />
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
  );
}

/* ---------------- Galeria sześciokątów ---------------- */

export function GalleryGrid({ items: initial }: { items: GalleryEntry[] }) {
  const [items, setItems] = useState(initial);

  useEffect(() => {
    let alive = true;
    loadLive().then((d) => alive && d.gallery && setItems(d.gallery));
    return () => {
      alive = false;
    };
  }, []);

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
                  alt={cut.alt}
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
