# Kingsman Barbershop

Strona barbershopu: Next.js (App Router) + Tailwind CSS 4.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

## Gdzie co zmieniać

| Co | Plik |
|---|---|
| Cennik, godziny, telefon, link do Booksy, zespół, opinie | `app/data.ts` |
| Układ i teksty sekcji | `app/page.tsx` |
| Kolory, fonty, animacje | `app/globals.css` |

Ceny są skopiowane z profilu w Booksy (ceny katalogowe). Cena z plusem (`120+`) oznacza „od”.

## Zdjęcia

Oryginały leżą w `source-images/` (nie trafiają na serwer). Strona używa lekkich
wersji WebP z `public/img/`, generowanych skryptem:

```bash
pip install pillow
python3 scripts/optimize-images.py
```

Skrypt tworzy kilka rozmiarów każdego zdjęcia (`<nazwa>-480.webp`, `-800.webp` itd.),
a przeglądarka sama wybiera właściwy do ekranu (`srcset`), dzięki czemu telefon nie
pobiera obrazów w rozmiarze dla desktopu. Zdjęcia poniżej ekranu startowego ładują się
leniwie.

### Zdjęcia zespołu

1. Wrzuć oryginał do `source-images/team/` pod nazwą z `slug` z `app/data.ts`
   (`julita.jpg`, `kacper.jpg`, `wojtek.jpg`). Najlepiej pionowe, proporcje ok. 4:5.
2. Uruchom `python3 scripts/optimize-images.py`.
3. Wpisz opis w polu `bio` w `app/data.ts`.

Dopóki zdjęcia nie ma, karta pokazuje neutralną zaślepkę z logo. Pusty `bio` nie wyświetla się wcale.
Nową osobę dodajesz jednym wpisem w tablicy `TEAM`.

## CDN

Domyślnie zdjęcia ładują się z własnego serwera. Żeby przenieść je na CDN
(np. Cloudflare R2, Bunny, KeyCDN):

1. Wgraj zawartość `public/img/` na CDN tak, żeby pliki były pod `<adres CDN>/img/...`.
2. Przed `npm run build` ustaw zmienną środowiskową:

   ```bash
   NEXT_PUBLIC_CDN_URL=https://cdn.kingsman-barbershop.pl
   ```

Wszystkie zdjęcia (oprócz `og.jpg`, które musi zostać na domenie strony) przejdą wtedy na CDN.
Zmienna jest wkompilowywana podczas builda, więc działa też przy eksporcie statycznym.
Bez zmiennej nic się nie zmienia.

## Opinie z Google

Strona potrafi pobierać prawdziwą ocenę i opinie z Google (Places API). Dzieje się to
automatycznie przed każdym `npm run build` (hook `prebuild`), a wynik trafia do
`app/google-reviews.json`. Dopóki nie ustawisz klucza, strona pokazuje opinie z `app/data.ts`.

1. W Google Cloud Console włącz **Places API (New)** i utwórz klucz API (ogranicz go do tego jednego API).
2. Przed buildem ustaw zmienną środowiskową:

   ```bash
   GOOGLE_PLACES_API_KEY=twój_klucz
   # opcjonalnie, jeśli skrypt miałby nie trafić w wizytówkę:
   GOOGLE_PLACE_ID=ChIJ...
   ```

3. `npm run build` (albo samo `npm run fetch-reviews`, żeby sprawdzić pobieranie).

Dobre do wiedzenia:

- Google oddaje przez API **maksymalnie 5 opinii** (wybranych przez Google) oraz łączną ocenę i liczbę ocen.
  Pełnej listy nie da się pobrać oficjalnie.
- Opinie odświeżają się przy każdym buildzie, więc przy hostingu statycznym warto budować stronę
  cyklicznie (np. raz dziennie).
- Błąd API nigdy nie przerywa builda: zostaje poprzedni plik albo opinie z `app/data.ts`.
- Przy opiniach z Google strona pokazuje logo Google i link do profilu autora, tak jak wymagają zasady Google.

### Lokalny build z kluczem Google

Utwórz plik `.env.local` w katalogu głównym (jest w `.gitignore`, nie trafi do repo):

```
GOOGLE_PLACES_API_KEY=twój_klucz
```

Potem zwykły `npm run build` pobierze świeże opinie przed eksportem. Opinie odświeżają się tylko
przy kolejnym buildzie. Na Vercel klucz dodaj w Settings → Environment Variables.

## Licznik odwiedzin (stats.php)

Panel `https://kingsman-barbershop.pl/stats.php` żyje na serwerze, poza eksportem Next, więc
**przy wgrywaniu nowej wersji strony nie kasuj `stats.php`, skryptu licznika ani `stats.json`**.

Strona zgłasza wejścia i kliknięcia w Booksy komponentem `app/components/Tracker.tsx`
(wejście raz na sesję, bez cookies, tylko na domenie produkcyjnej). Domyślnie woła `/track.php`;
inny adres ustawisz w `NEXT_PUBLIC_TRACK_URL`. Poprawiona wersja skryptu jest w `public/track.php`.

## Wdrożenie na zwykły hosting (np. SEOhost)

1. Opcjonalnie `.env.local` z `GOOGLE_PLACES_API_KEY` (opinie z Google).
2. `npm install`, potem `npm run build`. Powstaje folder `out/` z gotową stroną.
3. Wgraj **zawartość** folderu `out/` do głównego katalogu strony (zwykle `public_html`).
4. Nie kasuj na serwerze `stats.php`, `track.php` i `stats.json` (licznik). `public/track.php` wgrywasz raz.

## Panel dla właściciela: ceny i zdjęcia galerii (admin.php)

`https://kingsman-barbershop.pl/admin.php` pozwala bez programowania:
- zmieniać ceny, dodawać i usuwać usługi oraz grupy,
- wgrywać zdjęcia do galerii sześciokątów (maks. 8), zmieniać ich kolejność i usuwać je,
- wpisywać własne opinie klientów (maks. 12), które mają pierwszeństwo przed opiniami z Google API
  (przydatne, gdy Google nie zwraca opinii dla wizytówki; ocena i liczba nadal idą z API).

Zmiany zapisują się w `content.json` na serwerze, a strona czyta ten plik przy każdym wejściu,
więc są widoczne od razu, bez budowania. Zdjęcia są automatycznie przycinane do 3:4 i
zmniejszane (WebP 480 i 800 px). Wartości domyślne (gdy `content.json` nie istnieje) są w
`app/content-defaults.json`.

**Pierwsze uruchomienie:** na serwerze, obok `admin.php`, utwórz plik `admin-config.php`
(wzór: `server/admin-config.example.php`) z hasłem. Po pierwszym logowaniu hasło zamieni się
w hash. Wymagany PHP 8.0+ z rozszerzeniem GD (WebP).

Wdrożenia nie nadpisują `content.json`, `uploads/` ani `admin-config.php`.

## Automatyczne wdrożenie przez FTP (GitHub Actions)

Plik `.github/workflows/deploy.yml` buduje stronę po każdej zmianie w `main`, codziennie rano
(świeże opinie z Google) i na żądanie, po czym wysyła `out/` na serwer przez FTP.
Sekrety i zmienne do ustawienia są opisane na początku tego pliku.
