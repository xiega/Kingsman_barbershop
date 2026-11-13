"use client";

import { useEffect } from "react";
import { BOOKING_URL } from "../data";

/**
 * Licznik odwiedzin i kliknięć w Booksy dla panelu /stats.php.
 * Wysyła proste żądania do skryptu PHP na tym samym serwerze:
 *   <TRACK_URL>?type=visit   raz na sesję przeglądarki (odświeżenie strony nie liczy się drugi raz),
 *   <TRACK_URL>?type=click   po kliknięciu w link do rezerwacji w Booksy.
 *
 * Nie używa cookies i nie zapisuje danych osobowych. Liczy tylko na domenie produkcyjnej,
 * więc podgląd na Vercel i localhost nie zaniżają ani nie zawyżają statystyk.
 * Adres skryptu można zmienić zmienną NEXT_PUBLIC_TRACK_URL (domyślnie /track.php).
 */
const TRACK_URL = process.env.NEXT_PUBLIC_TRACK_URL || "/track.php";
const PROD_HOST = /(^|\.)kingsman-barbershop\.pl$/i;

function send(type: "visit" | "click") {
  const url = `${TRACK_URL}?type=${type}`;
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(url)) return;
  } catch {
    /* przechodzimy do fetch */
  }
  fetch(url, { method: "POST", keepalive: true, mode: "no-cors" }).catch(() => {});
}

export default function Tracker() {
  useEffect(() => {
    if (!PROD_HOST.test(window.location.hostname)) return;

    try {
      if (!sessionStorage.getItem("km-visit")) {
        sessionStorage.setItem("km-visit", "1");
        send("visit");
      }
    } catch {
      send("visit"); // sessionStorage zablokowane: liczymy zwykłe wejście
    }

    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a");
      if (link && link.href.startsWith(BOOKING_URL)) send("click");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
