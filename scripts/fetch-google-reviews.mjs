#!/usr/bin/env node
/**
 * Pobiera ocenę i opinie z Google (Places API "New") i zapisuje je do
 * app/google-reviews.json. Uruchamia się automatycznie przed `npm run build`
 * (hook "prebuild" w package.json).
 *
 * Zmienne środowiskowe:
 *   GOOGLE_PLACES_API_KEY  klucz API (wymagany; bez niego skrypt nic nie robi)
 *   GOOGLE_PLACE_ID        opcjonalnie; bez tego skrypt sam znajdzie wizytówkę
 *                          po nazwie i adresie
 *
 * Skrypt nigdy nie psuje builda: przy braku klucza albo błędzie API zostaje
 * poprzedni plik, a strona pokazuje opinie z app/data.ts.
 *
 * Uwaga: Places API zwraca maksymalnie 5 opinii (wybranych przez Google).
 * Pełnej listy opinii z Google nie da się pobrać oficjalnym API.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// Wczytaj klucz z .env.local (tak jak Next), jeśli plik istnieje; zmienne z systemu mają pierwszeństwo.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(path.join(ROOT, file));
  } catch {
    /* brak pliku albo starszy Node: pomijamy */
  }
}
const OUT = process.env.REVIEWS_OUT || path.join(ROOT, "app", "google-reviews.json");
const BASE = process.env.PLACES_API_BASE || "https://places.googleapis.com/v1";
const KEY = process.env.GOOGLE_PLACES_API_KEY;
const SEARCH_QUERY = "Kingsman Barbershop Różana 6 Poznań";

async function api(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { "X-Goog-Api-Key": KEY, ...(init.headers || {}) },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${body.slice(0, 300)}`);
  }
  return res.json();
}

async function findPlaceId() {
  const data = await api(`${BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
    },
    body: JSON.stringify({ textQuery: SEARCH_QUERY, languageCode: "pl" }),
  });
  const match = (data.places ?? []).find((p) => /kingsman/i.test(p.displayName?.text ?? ""));
  if (!match) throw new Error("nie znaleziono wizytówki Kingsman; ustaw GOOGLE_PLACE_ID");
  console.log(`[reviews] znaleziono: ${match.displayName.text}, ${match.formattedAddress}`);
  return match.id;
}

function mapReview(r) {
  const text = (r.text?.text ?? r.originalText?.text ?? "").trim();
  if (!text) return null; // ocena bez treści nie ma czego pokazać
  return {
    name: r.authorAttribution?.displayName ?? "Klient Google",
    date: r.relativePublishTimeDescription ?? "",
    text,
    rating: typeof r.rating === "number" ? r.rating : 5,
    url: r.authorAttribution?.uri ?? null,
  };
}

async function main() {
  if (!KEY) {
    console.log("[reviews] brak GOOGLE_PLACES_API_KEY, zostają opinie z app/data.ts");
    return;
  }
  try {
    const placeId = process.env.GOOGLE_PLACE_ID || (await findPlaceId());
    const place = await api(`${BASE}/places/${encodeURIComponent(placeId)}?languageCode=pl`, {
      headers: { "X-Goog-FieldMask": "id,displayName,rating,userRatingCount,googleMapsUri,reviews" },
    });
    const reviews = (place.reviews ?? []).map(mapReview).filter(Boolean);
    const result = {
      fetchedAt: new Date().toISOString(),
      placeId,
      rating: place.rating ?? null,
      count: place.userRatingCount ?? null,
      mapsUri: place.googleMapsUri ?? null,
      reviews,
    };
    // null -> pomijamy, żeby strona użyła wartości domyślnych
    for (const k of ["rating", "count", "mapsUri"]) if (result[k] == null) delete result[k];
    await writeFile(OUT, JSON.stringify(result, null, 2) + "\n", "utf8");
    console.log(`[reviews] zapisano ${reviews.length} opinii, ocena ${result.rating ?? "?"} (${result.count ?? "?"} ocen)`);
  } catch (err) {
    console.warn(`[reviews] nie udało się pobrać opinii: ${err.message}`);
    const existing = await readFile(OUT, "utf8").catch(() => null);
    console.warn(existing ? "[reviews] zostaje poprzedni plik" : "[reviews] zostają opinie z app/data.ts");
  }
}

main();
