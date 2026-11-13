/**
 * Adresy zasobów statycznych.
 *
 * Domyślnie zdjęcia ładują się z katalogu public/ na własnym serwerze.
 * Żeby przenieść je na CDN, wystarczy ustawić zmienną środowiskową
 * NEXT_PUBLIC_CDN_URL (np. https://cdn.kingsman-barbershop.pl) i wgrać
 * zawartość public/img na CDN pod tę samą ścieżką /img/...
 *
 * Zmienna jest wkompilowywana w czasie `next build`, więc działa również
 * przy eksporcie statycznym.
 */
const CDN_URL = (process.env.NEXT_PUBLIC_CDN_URL ?? "").replace(/\/+$/, "");

export function asset(path: string): string {
  return `${CDN_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** srcset dla plików wygenerowanych przez scripts/optimize-images.py */
export function imgSrcSet(name: string, widths: readonly number[]): string {
  return widths.map((w) => `${asset(`/img/${name}-${w}.webp`)} ${w}w`).join(", ");
}

/** srcset dla zdjęć z Unsplash (sam Unsplash jest CDN-em i skaluje obraz). */
export function unsplashSrcSet(photoId: string, widths: readonly number[], quality = 65): string {
  return widths
    .map((w) => `https://images.unsplash.com/${photoId}?q=${quality}&w=${w}&auto=format&fit=crop ${w}w`)
    .join(", ");
}

export const CDN_ORIGIN = CDN_URL;
