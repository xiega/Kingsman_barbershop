"use client";

import { useEffect, useState } from "react";
import { FaClock } from "react-icons/fa";
import { DEFAULT_ANNOUNCEMENT, DEFAULT_HOURS, type Announcement } from "../data";
import { announcementActive, earliestOpen, groupHours, openStatus, statusText, type Hours } from "../hours";
import { DICT, shortTime, type Lang } from "../i18n";
import { useLive } from "./LiveContent";

/**
 * Małe elementy zależne od godzin otwarcia i komunikatu z panelu /admin.php.
 * Czas liczymy po stronie przeglądarki (strefa Europe/Warsaw), więc statyczna strona
 * nie "zamraża" stanu Otwarte/Zamknięte z momentu budowania.
 */

/** Aktualny czas, odświeżany co minutę. Przed załadowaniem (SSR) null, żeby nie było rozjazdu hydracji. */
function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/** Neonowy znaczek "Otwarte teraz / Zamknięte". */
export function OpenBadge({ lang = "pl", icon = true }: { lang?: Lang; icon?: boolean }) {
  const hours = useLive<Hours>((d) => d.hours, DEFAULT_HOURS);
  const now = useNow();
  if (!now) return <span className="inline-block h-5" aria-hidden="true" />;

  const status = openStatus(hours, now);
  return (
    <span className="inline-flex items-center gap-2" role="status">
      {icon && <FaClock className="text-gold" aria-hidden="true" />}
      <span aria-hidden="true" className={`status-dot ${status.open ? "status-dot-open" : "status-dot-closed"}`} />
      <span className={status.open ? "neon-text font-medium" : "text-bone/70"}>{statusText(status, lang)}</span>
    </span>
  );
}

/** Lista godzin w stopce. */
export function HoursList({ lang = "pl" }: { lang?: Lang }) {
  const hours = useLive<Hours>((d) => d.hours, DEFAULT_HOURS);
  const closed = DICT[lang].footer.closed;
  return (
    <ul className="space-y-3 text-sm">
      {groupHours(hours, lang).map((row, i) => (
        <li key={i} className="flex justify-between gap-4 border-b border-white/5 pb-3">
          <span className="text-muted">{row.days}</span>
          <span className={`whitespace-nowrap ${row.time ? "text-bone" : "text-muted"}`}>{row.time ?? closed}</span>
        </li>
      ))}
    </ul>
  );
}

/** "od 7:00" w sekcji O nas: najwcześniejsze otwarcie w tygodniu. */
export function OpenFrom({ lang = "pl" }: { lang?: Lang }) {
  const hours = useLive<Hours>((d) => d.hours, DEFAULT_HOURS);
  const first = earliestOpen(hours);
  return <>{first ? DICT[lang].about.from(shortTime(first)) : "–"}</>;
}

/** Pasek komunikatu nad nagłówkiem. Domyślnie ukryty; włączany w panelu /admin.php. */
export function AnnouncementBar({ lang = "pl", collapsed = false }: { lang?: Lang; collapsed?: boolean }) {
  const a = useLive<Announcement>((d) => d.announcement, DEFAULT_ANNOUNCEMENT);
  const now = useNow();
  const text = (lang === "en" ? a.text_en || a.text : a.text || a.text_en).trim();
  if (!a.enabled || !text || !now || !announcementActive(a.until, now)) return null;

  const content = <span className="block text-center">{text}</span>;
  return (
    <div
      role="region"
      aria-label={DICT[lang].announcement}
      aria-hidden={collapsed}
      className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
        collapsed ? "max-h-0 opacity-0" : "max-h-40 opacity-100"
      }`}
    >
      <div className="bg-neon px-5 py-2 text-[12px] font-semibold uppercase leading-snug tracking-[0.12em] text-black md:text-[13px]">
        {a.url ? (
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={collapsed ? -1 : 0}
            className="block underline-offset-4 hover:underline"
          >
            {content}
          </a>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
