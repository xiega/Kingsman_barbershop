import { DICT, type Lang } from "./i18n";

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/** [otwarcie, zamknięcie] w formacie "HH:MM" albo null, gdy zamknięte. */
export type Hours = Record<DayKey, [string, string] | null>;

export type HoursRow = { days: string; time: string | null };

/** Łączy kolejne dni o tych samych godzinach: "Poniedziałek – Czwartek | 07:00 – 16:00". */
export function groupHours(hours: Hours, lang: Lang): HoursRow[] {
  const names = DICT[lang].days;
  const rows: HoursRow[] = [];
  let i = 0;
  while (i < 7) {
    const cur = hours[DAY_KEYS[i]];
    const sig = cur ? cur.join("-") : "";
    let j = i;
    while (j + 1 < 7) {
      const next = hours[DAY_KEYS[j + 1]];
      if ((next ? next.join("-") : "") !== sig) break;
      j++;
    }
    rows.push({
      days: j === i ? names[i] : `${names[i]} – ${names[j]}`,
      time: cur ? `${cur[0]} – ${cur[1]}` : null,
    });
    i = j + 1;
  }
  return rows;
}

/** Najwcześniejsza godzina otwarcia w tygodniu, np. "07:00" (do podpisów typu "od 7:00"). */
export function earliestOpen(hours: Hours): string | null {
  const opens = DAY_KEYS.map((k) => hours[k]?.[0]).filter((t): t is string => !!t);
  return opens.length ? opens.sort()[0] : null;
}

const WEEKDAY_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

/** Dzień tygodnia (0 = poniedziałek) i minuty od północy w Poznaniu, niezależnie od strefy odwiedzającego. */
export function warsawNow(now: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: WEEKDAY_INDEX[get("weekday")] ?? 0, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

export type OpenStatus =
  | { open: true; until: string }
  | { open: false; next: { offset: number; day: number; time: string } | null };

export function openStatus(hours: Hours, now: Date = new Date()): OpenStatus {
  const { day, minutes } = warsawNow(now);
  const today = hours[DAY_KEYS[day]];
  if (today && minutes >= toMin(today[0]) && minutes < toMin(today[1])) return { open: true, until: today[1] };
  if (today && minutes < toMin(today[0])) return { open: false, next: { offset: 0, day, time: today[0] } };
  for (let offset = 1; offset <= 7; offset++) {
    const d = (day + offset) % 7;
    const h = hours[DAY_KEYS[d]];
    if (h) return { open: false, next: { offset, day: d, time: h[0] } };
  }
  return { open: false, next: null };
}

export function statusText(status: OpenStatus, lang: Lang): string {
  const s = DICT[lang].status;
  if (status.open) return s.openNow(status.until);
  const n = status.next;
  if (!n) return s.closed;
  if (n.offset === 0) return s.closedToday(n.time);
  if (n.offset === 1) return s.closedTomorrow(n.time);
  return s.closedOn(DICT[lang].daysOn[n.day], n.time);
}

/** Czy komunikat jeszcze obowiązuje? `until` to data YYYY-MM-DD (włącznie) albo pusty tekst. */
export function announcementActive(until: string, now: Date = new Date()): boolean {
  if (!until) return true;
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw" }).format(now); // YYYY-MM-DD
  return today <= until;
}
