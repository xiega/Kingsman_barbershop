<?php
/**
 * Panel zarządzania treścią strony Kingsman Barbershop.
 *  - ceny: dodawanie, edycja i usuwanie usług oraz grup,
 *  - galeria sześciokątów: wgrywanie zdjęć (przycinane i zmniejszane automatycznie), kolejność, usuwanie,
 *  - zespół (imię, rola, opis PL/EN, zdjęcie), godziny otwarcia, pasek komunikatu, teksty angielskie.
 *
 * Zapisuje content.json (czytany przez stronę przy każdym wejściu, więc zmiany są widoczne od razu,
 * bez budowania strony) oraz zdjęcia w uploads/gallery/.
 *
 * Hasło: plik admin-config.php na serwerze (nie ma go w repozytorium), wzór: server/admin-config.example.php.
 * Przy pierwszym logowaniu hasło wpisane jawnie jest automatycznie zamieniane w pliku na hash.
 */
declare(strict_types=1);

ini_set('display_errors', '0');
@ini_set('memory_limit', '384M');
@set_time_limit(120);

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'");

date_default_timezone_set('Europe/Warsaw');

const MAX_GALLERY = 8;
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_PIXELS = 50000000;
const DEFAULT_ALT = 'Strzyżenie wykonane w Kingsman Barbershop';
const MAX_TEAM = 8;
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

$ROOT = __DIR__;
$CONTENT = $ROOT . '/content.json';
$BACKUP = $ROOT . '/content.backup.json';
$DEFAULTS = $ROOT . '/content-defaults.json';
$UPLOADS = $ROOT . '/uploads/gallery';
$UPLOADS_TEAM = $ROOT . '/uploads/team';
$CFG_FILE = $ROOT . '/admin-config.php';

/* ------------------------------------------------------------ sesja */

$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
session_name('km_admin');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
session_start();

function h($s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function csrf(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf'];
}

function flash(string $type, string $msg): void
{
    $_SESSION['flash'][] = [$type, $msg];
}

function redirect(string $hash = '')
{
    header('Location: ' . strtok($_SERVER['REQUEST_URI'] ?? 'admin.php', '?') . $hash, true, 303);
    exit;
}

/* ------------------------------------------------------------ konfiguracja i hasło */

$cfg = is_file($CFG_FILE) ? (include $CFG_FILE) : null;
$cfg = is_array($cfg) ? $cfg : null;

function password_ok(array $cfg, string $pw): bool
{
    if (!empty($cfg['hash'])) {
        return password_verify($pw, (string) $cfg['hash']);
    }
    $plain = (string) ($cfg['password'] ?? '');
    return $plain !== '' && $plain !== 'ZMIEN_MNIE' && hash_equals($plain, $pw);
}

function upgrade_password_to_hash(string $file, string $pw): void
{
    $code = "<?php\n// Hasło do panelu (hash). Aby je zmienić, wpisz tu nowe jawne hasło w kluczu 'password'\n// zamiast 'hash'. Zostanie zamienione na hash przy najbliższym logowaniu.\nreturn " .
        var_export(['hash' => password_hash($pw, PASSWORD_DEFAULT)], true) . ";\n";
    @file_put_contents($file, $code, LOCK_EX);
}

/* ograniczenie prób logowania: 5 błędnych w 15 minut z jednego adresu */
function attempts_file(): string
{
    return sys_get_temp_dir() . '/km_admin_' . md5($_SERVER['REMOTE_ADDR'] ?? 'x');
}

function locked_out(): bool
{
    $f = attempts_file();
    $d = is_file($f) ? json_decode((string) @file_get_contents($f), true) : null;
    if (!is_array($d) || time() - ($d['first'] ?? 0) > 900) {
        return false;
    }
    return ($d['count'] ?? 0) >= 5;
}

function note_failed_login(): void
{
    $f = attempts_file();
    $d = is_file($f) ? json_decode((string) @file_get_contents($f), true) : null;
    if (!is_array($d) || time() - ($d['first'] ?? 0) > 900) {
        $d = ['first' => time(), 'count' => 0];
    }
    $d['count']++;
    @file_put_contents($f, json_encode($d), LOCK_EX);
}

/* ------------------------------------------------------------ dane */

function read_json(string $file): ?array
{
    if (!is_file($file)) {
        return null;
    }
    $d = json_decode((string) @file_get_contents($file), true);
    return is_array($d) ? $d : null;
}

function write_content(array $data): bool
{
    global $CONTENT, $BACKUP, $ROOT;
    $data['updated'] = date('c');
    $lock = fopen($ROOT . '/.content.lock', 'c');
    if (!$lock) {
        return false;
    }
    flock($lock, LOCK_EX);
    if (is_file($CONTENT)) {
        @copy($CONTENT, $BACKUP);
    }
    $tmp = $CONTENT . '.tmp' . bin2hex(random_bytes(3));
    $ok = file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT)) !== false
        && rename($tmp, $CONTENT);
    if (!$ok) {
        @unlink($tmp);
    }
    flock($lock, LOCK_UN);
    fclose($lock);
    return $ok;
}

$defaults = read_json($DEFAULTS) ?? ['prices' => [], 'gallery' => []];
$content = read_json($CONTENT) ?? [];
$prices = is_array($content['prices'] ?? null) ? $content['prices'] : ($defaults['prices'] ?? []);
$gallery = is_array($content['gallery'] ?? null) ? $content['gallery'] : ($defaults['gallery'] ?? []);
$team = is_array($content['team'] ?? null) ? $content['team'] : ($defaults['team'] ?? []);
$hours = is_array($content['hours'] ?? null) ? $content['hours'] : ($defaults['hours'] ?? []);
$announcement = is_array($content['announcement'] ?? null) ? $content['announcement'] : ($defaults['announcement'] ?? []);

function clip(string $s, int $max): string
{
    $s = trim(preg_replace('/\s+/u', ' ', $s) ?? '');
    return mb_substr($s, 0, $max);
}

/** Czyści dane z formularza cen. Zwraca [grupy, błędy]. */
function sanitize_prices($raw): array
{
    $groups = [];
    $errors = [];
    foreach (is_array($raw) ? $raw : [] as $g) {
        if (!is_array($g)) {
            continue;
        }
        $title = clip((string) ($g['title'] ?? ''), 40);
        $titleEn = clip((string) ($g['title_en'] ?? ''), 40);
        $items = [];
        foreach (is_array($g['items'] ?? null) ? $g['items'] : [] as $it) {
            if (!is_array($it)) {
                continue;
            }
            $name = clip((string) ($it['name'] ?? ''), 80);
            $price = str_replace([' ', 'zł', 'PLN'], '', clip((string) ($it['price'] ?? ''), 12));
            $duration = clip((string) ($it['duration'] ?? ''), 30);
            $note = clip((string) ($it['note'] ?? ''), 60);
            $nameEn = clip((string) ($it['name_en'] ?? ''), 80);
            $noteEn = clip((string) ($it['note_en'] ?? ''), 60);
            if ($name === '' && $price === '' && $duration === '' && $note === '') {
                continue; // pusty wiersz
            }
            if ($name === '') {
                $errors[] = 'Usługa bez nazwy w grupie „' . $title . '”.';
                continue;
            }
            if (!preg_match('/^\d{1,5}\+?$/', $price)) {
                $errors[] = 'Cena „' . $price . '” przy usłudze „' . $name . '” jest nieprawidłowa (wpisz liczbę, np. 100 albo 120+).';
                continue;
            }
            $items[] = array_filter(
                ['name' => $name, 'price' => $price, 'duration' => $duration, 'note' => $note, 'name_en' => $nameEn, 'note_en' => $noteEn],
                static fn ($v, $k) => !in_array($k, ['note', 'name_en', 'note_en'], true) || $v !== '',
                ARRAY_FILTER_USE_BOTH
            );
        }
        if ($title === '' && !$items) {
            continue;
        }
        if ($title === '') {
            $errors[] = 'Grupa usług bez nazwy.';
            continue;
        }
        if (!$items) {
            continue; // pusta grupa jest pomijana
        }
        $groups[] = array_filter(['title' => $title, 'title_en' => $titleEn, 'items' => $items], static fn ($v, $k) => $k !== 'title_en' || $v !== '', ARRAY_FILTER_USE_BOTH);
    }
    if (!$groups) {
        $errors[] = 'Cennik musi zawierać co najmniej jedną usługę.';
    }
    return [$groups, $errors];
}

/** Czyści opinie z formularza. Zwraca [opinie, błędy]. */
function sanitize_reviews($raw): array
{
    $out = [];
    $errors = [];
    foreach (is_array($raw) ? $raw : [] as $r) {
        if (!is_array($r)) {
            continue;
        }
        $name = clip((string) ($r['name'] ?? ''), 60);
        $text = trim(preg_replace("/[ \t]+/u", ' ', str_replace("\r", '', (string) ($r['text'] ?? ''))) ?? '');
        $text = mb_substr($text, 0, 700);
        $date = clip((string) ($r['date'] ?? ''), 40);
        $rating = (int) ($r['rating'] ?? 5);
        $url = trim((string) ($r['url'] ?? ''));
        if ($name === '' && $text === '') {
            continue; // pusty wiersz
        }
        if ($name === '' || $text === '') {
            $errors[] = 'Każda opinia musi mieć autora i treść (' . ($name ?: 'bez autora') . ').';
            continue;
        }
        if ($url !== '' && !preg_match('#^https://[^\s"<>]{3,300}$#', $url)) {
            $errors[] = 'Link przy opinii „' . $name . '” musi zaczynać się od https://.';
            continue;
        }
        $item = ['name' => $name, 'date' => $date, 'text' => $text, 'rating' => max(1, min(5, $rating))];
        if ($url !== '') {
            $item['url'] = $url;
        }
        $out[] = $item;
    }
    if (count($out) > 12) {
        $errors[] = 'Maksymalnie 12 opinii.';
    }
    return [$out, $errors];
}

/** Godziny otwarcia z formularza. Zwraca [godziny, błędy]. */
function sanitize_hours($raw): array
{
    $out = [];
    $errors = [];
    $time = '/^([01]\d|2[0-3]):[0-5]\d$/';
    foreach (DAY_KEYS as $i => $k) {
        $d = is_array($raw[$k] ?? null) ? $raw[$k] : [];
        if (!empty($d['closed'])) {
            $out[$k] = null;
            continue;
        }
        $o = trim((string) ($d['open'] ?? ''));
        $c = trim((string) ($d['close'] ?? ''));
        if (!preg_match($time, $o) || !preg_match($time, $c)) {
            $errors[] = DAY_LABELS[$i] . ': wpisz godzinę otwarcia i zamknięcia albo zaznacz „zamknięte”.';
            continue;
        }
        if ($o >= $c) {
            $errors[] = DAY_LABELS[$i] . ': zamknięcie musi być później niż otwarcie.';
            continue;
        }
        $out[$k] = [$o, $c];
    }
    return [$out, $errors];
}

/** Pasek komunikatu z formularza. Zwraca [komunikat, błędy]. */
function sanitize_announcement($raw): array
{
    $a = is_array($raw) ? $raw : [];
    $errors = [];
    $enabled = !empty($a['enabled']);
    $text = clip((string) ($a['text'] ?? ''), 200);
    $textEn = clip((string) ($a['text_en'] ?? ''), 200);
    $until = trim((string) ($a['until'] ?? ''));
    $url = trim((string) ($a['url'] ?? ''));
    if ($until !== '') {
        $ok = preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $until, $m) && checkdate((int) $m[2], (int) $m[3], (int) $m[1]);
        if (!$ok) {
            $errors[] = 'Data „Pokazuj do” jest nieprawidłowa.';
        }
    }
    if ($url !== '' && !preg_match('#^https://[^\s"<>]{3,300}$#', $url)) {
        $errors[] = 'Link na pasku musi zaczynać się od https://.';
    }
    if ($enabled && $text === '' && $textEn === '') {
        $errors[] = 'Wpisz treść komunikatu albo wyłącz pasek.';
    }
    return [['enabled' => $enabled, 'text' => $text, 'text_en' => $textEn, 'until' => $until, 'url' => $url], $errors];
}

/* ------------------------------------------------------------ zdjęcia */

function orient($img, string $path, string $mime)
{
    if ($mime !== 'image/jpeg' || !function_exists('exif_read_data')) {
        return $img;
    }
    $ex = @exif_read_data($path);
    $o = (int) ($ex['Orientation'] ?? 1);
    $angle = [3 => 180, 6 => -90, 8 => 90][$o] ?? 0;
    if ($angle) {
        $rot = imagerotate($img, $angle, 0);
        if ($rot) {
            return $rot;
        }
    }
    return $img;
}

/**
 * Zapisuje zdjęcie jako pliki WebP w podanych rozmiarach, przycięte do proporcji $rw:$rh.
 * $sizes: [[szerokość, wysokość], ...] od największego. Zwraca [id, błąd].
 */
function save_photo(string $tmp, string $dir, array $sizes, int $rw, int $rh, bool $sharpen = false): array
{
    $info = @getimagesize($tmp);
    if (!$info) {
        return [null, 'to nie jest zdjęcie'];
    }
    $mime = $info['mime'] ?? '';
    if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
        return [null, 'dozwolone formaty to JPG, PNG i WebP'];
    }
    if ($info[0] * $info[1] > MAX_PIXELS) {
        return [null, 'zdjęcie ma za dużo pikseli (maks. 50 mln)'];
    }
    if (!function_exists('imagewebp')) {
        return [null, 'serwer nie obsługuje formatu WebP (GD)'];
    }
    $src = match ($mime) {
        'image/jpeg' => @imagecreatefromjpeg($tmp),
        'image/png' => @imagecreatefrompng($tmp),
        default => @imagecreatefromwebp($tmp),
    };
    if (!$src) {
        return [null, 'nie udało się odczytać zdjęcia'];
    }
    $src = orient($src, $tmp, $mime);
    $w = imagesx($src);
    $hgt = imagesy($src);
    // kadr rw:rh; przy zdjęciach pionowych przycinamy bardziej od dołu (twarz zwykle jest wyżej)
    if ($w / $hgt > $rw / $rh) {
        $cw = (int) round($hgt * $rw / $rh);
        $ch = $hgt;
        $cx = (int) (($w - $cw) / 2);
        $cy = 0;
    } else {
        $cw = $w;
        $ch = (int) round($w * $rh / $rw);
        $cx = 0;
        $cy = (int) (($hgt - $ch) * 0.3);
    }
    if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
        return [null, 'nie można utworzyć katalogu na zdjęcia'];
    }
    $htaccess = dirname($dir) . '/.htaccess';
    if (!is_file($htaccess)) {
        @file_put_contents($htaccess, "<FilesMatch \"\\.(php|phtml|phar)\$\">\n  Require all denied\n</FilesMatch>\n");
    }
    $id = bin2hex(random_bytes(6));
    $written = [];
    foreach ($sizes as [$tw, $th]) {
        $dst = imagecreatetruecolor($tw, $th);
        imagecopyresampled($dst, $src, 0, 0, $cx, $cy, $tw, $th, $cw, $ch);
        if ($sharpen && function_exists('imageconvolution')) {
            @imageconvolution($dst, [[-1, -1, -1], [-1, 16, -1], [-1, -1, -1]], 8, 0); // delikatne wyostrzenie po zmniejszeniu
        }
        $file = "$dir/$id-$tw.webp";
        $ok = imagewebp($dst, $file, $sharpen ? 86 : 82);
        imagedestroy($dst);
        if (!$ok) {
            foreach ($written as $f) {
                @unlink($f);
            }
            return [null, 'nie udało się zapisać zdjęcia'];
        }
        $written[] = $file;
    }
    imagedestroy($src);
    return [$id, null];
}

/** Zdjęcie galerii: dwa pliki WebP 3:4 (480 i 800 px). */
function save_gallery_photo(string $tmp, string $dir): array
{
    return save_photo($tmp, $dir, [[800, 1067], [480, 640]], 3, 4);
}

/** Zdjęcie członka zespołu: dwa pliki WebP 4:5 (400 i 800 px), lekko wyostrzone. */
function save_team_photo(string $tmp, string $dir): array
{
    return save_photo($tmp, $dir, [[800, 1000], [400, 500]], 4, 5, true);
}

/** Usuwa wgrane (nie domyślne) pliki zdjęcia o podanej ścieżce bazowej, np. /uploads/team/ab12. */
function delete_upload_files(string $base, string $prefix, string $dir): void
{
    if (!str_starts_with($base, $prefix) || !preg_match('#^/uploads/(gallery|team)/[A-Za-z0-9]+$#', $base)) {
        return;
    }
    foreach (glob($dir . '/' . basename($base) . '-*.webp') ?: [] as $f) {
        @unlink($f);
    }
}

/**
 * Zespół z formularza (+ ewentualne nowe zdjęcia). Zwraca [członkowie, błędy, ostrzeżenia].
 * Błąd wgrania zdjęcia jest tylko ostrzeżeniem: reszta zmian się zapisuje, a stare zdjęcie zostaje.
 */
function process_team($raw, array $oldTeam, string $dir): array
{
    $members = [];
    $errors = [];
    $warnings = [];
    $oldByid = [];
    foreach ($oldTeam as $m) {
        $oldByid[(string) ($m['id'] ?? '')] = $m;
    }
    foreach (is_array($raw) ? $raw : [] as $key => $m) {
        if (!is_array($m)) {
            continue;
        }
        $name = clip((string) ($m['name'] ?? ''), 40);
        $role = clip((string) ($m['role'] ?? ''), 40);
        $roleEn = clip((string) ($m['role_en'] ?? ''), 40);
        $bio = trim(str_replace("\r", '', (string) ($m['bio'] ?? '')));
        $bioEn = trim(str_replace("\r", '', (string) ($m['bio_en'] ?? '')));
        $bio = mb_substr(preg_replace("/[ \t]+/u", ' ', $bio) ?? '', 0, 600);
        $bioEn = mb_substr(preg_replace("/[ \t]+/u", ' ', $bioEn) ?? '', 0, 600);
        $upload = $_FILES['photo_' . $key] ?? null;
        $hasUpload = is_array($upload) && ($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;
        if ($name === '' && $role === '' && $bio === '' && !$hasUpload) {
            continue; // pusty wiersz
        }
        if ($name === '') {
            $errors[] = 'Każda osoba w zespole musi mieć imię.';
            continue;
        }
        $id = preg_replace('/[^a-z0-9_-]/', '', strtolower((string) ($m['id'] ?? ''))) ?: '';
        if ($id === '') {
            $id = 'm' . bin2hex(random_bytes(4));
        }
        // zdjęcie: bieżące (z ukrytego pola, tylko dozwolone ścieżki) albo nowe
        $photoBase = (string) ($m['photo'] ?? '');
        $photo = preg_match('#^/(img/team|uploads/team)/[A-Za-z0-9._-]+$#', $photoBase)
            ? ['base' => $photoBase, 'widths' => [400, 800]]
            : null;
        if (!empty($m['remove_photo'])) {
            $photo = null;
        }
        if ($hasUpload) {
            if ($upload['error'] !== UPLOAD_ERR_OK || $upload['size'] > MAX_UPLOAD_BYTES) {
                $warnings[] = "Zdjęcie „{$name}”: plik jest za duży albo wgranie się nie udało (maks. 15 MB). Zostało poprzednie zdjęcie.";
            } else {
                [$pid, $err] = save_team_photo((string) $upload['tmp_name'], $dir);
                if ($err) {
                    $warnings[] = "Zdjęcie „{$name}”: {$err}. Zostało poprzednie zdjęcie.";
                } else {
                    $photo = ['base' => '/uploads/team/' . $pid, 'widths' => [400, 800]];
                }
            }
        }
        $item = ['id' => $id, 'name' => $name, 'role' => $role !== '' ? $role : 'Barber'];
        if ($roleEn !== '') {
            $item['role_en'] = $roleEn;
        }
        if ($bio !== '') {
            $item['bio'] = $bio;
        }
        if ($bioEn !== '') {
            $item['bio_en'] = $bioEn;
        }
        $item['photo'] = $photo;
        $members[] = $item;
    }
    if (count($members) > MAX_TEAM) {
        $errors[] = 'Maksymalnie ' . MAX_TEAM . ' osób w zespole.';
    }
    return [$members, $errors, $warnings];
}

function delete_gallery_files(array $item, string $dir): void
{
    if (!str_starts_with((string) ($item['base'] ?? ''), '/uploads/gallery/')) {
        return; // zdjęć domyślnych ze strony nie kasujemy
    }
    $id = basename((string) $item['id']);
    foreach (glob("$dir/$id-*.webp") ?: [] as $f) {
        @unlink($f);
    }
}

/* ------------------------------------------------------------ akcje (POST) */

$loggedIn = !empty($_SESSION['km_logged']);
$configured = $cfg && (!empty($cfg['hash']) || (!empty($cfg['password']) && $cfg['password'] !== 'ZMIEN_MNIE'));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = (string) ($_POST['action'] ?? '');

    if ($action === 'login') {
        if (!$configured) {
            flash('err', 'Panel nie jest skonfigurowany (brak pliku admin-config.php).');
        } elseif (locked_out()) {
            flash('err', 'Za dużo błędnych prób. Spróbuj ponownie za 15 minut.');
        } elseif (hash_equals(csrf(), (string) ($_POST['csrf'] ?? '')) && password_ok($cfg, (string) ($_POST['password'] ?? ''))) {
            if (empty($cfg['hash'])) {
                upgrade_password_to_hash($CFG_FILE, (string) $_POST['password']);
            }
            session_regenerate_id(true);
            $_SESSION['km_logged'] = true;
            @unlink(attempts_file());
        } else {
            note_failed_login();
            usleep(600000);
            flash('err', 'Nieprawidłowe hasło.');
        }
        redirect();
    }

    if (!$loggedIn || !hash_equals(csrf(), (string) ($_POST['csrf'] ?? ''))) {
        flash('err', 'Sesja wygasła. Zaloguj się ponownie.');
        redirect();
    }

    switch ($action) {
        case 'logout':
            session_destroy();
            header('Location: ' . strtok($_SERVER['REQUEST_URI'] ?? 'admin.php', '?'), true, 303);
            exit;

        case 'save_prices':
            [$groups, $errors] = sanitize_prices($_POST['g'] ?? []);
            if ($errors) {
                foreach (array_slice($errors, 0, 5) as $e) {
                    flash('err', $e);
                }
                flash('err', 'Zmiany w cenniku NIE zostały zapisane.');
            } else {
                $content['prices'] = $groups;
                if (write_content($content)) {
                    flash('ok', 'Cennik zapisany. Zmiany są już widoczne na stronie.');
                } else {
                    flash('err', 'Nie udało się zapisać (brak uprawnień do zapisu w katalogu strony?).');
                }
            }
            redirect('#ceny');

        case 'save_reviews':
            [$revs, $errors] = sanitize_reviews($_POST['r'] ?? []);
            if ($errors) {
                foreach (array_slice($errors, 0, 5) as $e) {
                    flash('err', $e);
                }
                flash('err', 'Opinie NIE zostały zapisane.');
            } else {
                if ($revs) {
                    $content['reviews'] = $revs;
                } else {
                    unset($content['reviews']); // brak własnych opinii = wracają opinie z Google/kodu
                }
                if (write_content($content)) {
                    flash('ok', $revs ? 'Opinie zapisane. Są już widoczne na stronie.' : 'Usunięto własne opinie, strona pokazuje opinie domyślne.');
                } else {
                    flash('err', 'Nie udało się zapisać (brak uprawnień do zapisu w katalogu strony?).');
                }
            }
            redirect('#opinie');

        case 'save_hours':
            [$hrs, $errors] = sanitize_hours($_POST['hours'] ?? []);
            if ($errors) {
                foreach (array_slice($errors, 0, 7) as $e) {
                    flash('err', $e);
                }
                flash('err', 'Godziny NIE zostały zapisane.');
            } else {
                $content['hours'] = $hrs;
                flash(write_content($content) ? 'ok' : 'err', 'Godziny zapisane. Znaczek „Otwarte / Zamknięte” i stopka liczą się od nich.');
            }
            redirect('#godziny');

        case 'save_announcement':
            [$ann, $errors] = sanitize_announcement($_POST['ann'] ?? []);
            if ($errors) {
                foreach ($errors as $e) {
                    flash('err', $e);
                }
                flash('err', 'Komunikat NIE został zapisany.');
            } else {
                $content['announcement'] = $ann;
                flash(
                    write_content($content) ? 'ok' : 'err',
                    $ann['enabled'] ? 'Pasek komunikatu jest WŁĄCZONY i widoczny na stronie.' : 'Pasek komunikatu jest wyłączony (ukryty).'
                );
            }
            redirect('#komunikat');

        case 'save_team':
            [$members, $errors, $warnings] = process_team($_POST['team'] ?? [], $team, $UPLOADS_TEAM);
            if ($errors) {
                foreach ($errors as $e) {
                    flash('err', $e);
                }
                flash('err', 'Zespół NIE został zapisany.');
            } else {
                $oldBases = array_map(static fn ($m) => (string) ($m['photo']['base'] ?? ''), $team);
                $newBases = array_map(static fn ($m) => (string) ($m['photo']['base'] ?? ''), $members);
                if ($members) {
                    $content['team'] = $members;
                } else {
                    unset($content['team']); // brak osób = wracają osoby domyślne
                }
                if (write_content($content)) {
                    foreach (array_diff($oldBases, $newBases) as $gone) {
                        delete_upload_files($gone, '/uploads/team/', $UPLOADS_TEAM); // tylko wgrane, nie domyślne
                    }
                    flash('ok', $members ? 'Zespół zapisany. Zmiany są już widoczne na stronie.' : 'Usunięto wszystkich, strona pokazuje zespół domyślny.');
                } else {
                    flash('err', 'Nie udało się zapisać (brak uprawnień do zapisu w katalogu strony?).');
                }
            }
            foreach ($warnings as $w) {
                flash('err', $w);
            }
            redirect('#zespol');

        case 'upload':
            $alt = clip((string) ($_POST['alt'] ?? ''), 160) ?: DEFAULT_ALT;
            $files = $_FILES['photos'] ?? null;
            $count = is_array($files['name'] ?? null) ? count($files['name']) : 0;
            $added = 0;
            for ($i = 0; $i < $count; $i++) {
                $name = (string) $files['name'][$i];
                if ($files['error'][$i] === UPLOAD_ERR_NO_FILE) {
                    continue;
                }
                if (count($gallery) >= MAX_GALLERY) {
                    flash('err', 'Galeria jest pełna (maks. ' . MAX_GALLERY . ' zdjęć). Usuń któreś, żeby dodać nowe.');
                    break;
                }
                if ($files['error'][$i] !== UPLOAD_ERR_OK || $files['size'][$i] > MAX_UPLOAD_BYTES) {
                    flash('err', "„{$name}”: plik jest za duży albo wgranie się nie udało (maks. 15 MB).");
                    continue;
                }
                [$id, $err] = save_gallery_photo((string) $files['tmp_name'][$i], $UPLOADS);
                if ($err) {
                    flash('err', "„{$name}”: {$err}.");
                    continue;
                }
                $gallery[] = ['id' => $id, 'base' => '/uploads/gallery/' . $id, 'widths' => [480, 800], 'alt' => $alt];
                $added++;
            }
            if ($added) {
                $content['gallery'] = $gallery;
                flash(write_content($content) ? 'ok' : 'err', $added . ' zdjęć dodano do galerii.');
            }
            redirect('#galeria');

        case 'delete_photo':
            $id = (string) ($_POST['id'] ?? '');
            $new = [];
            foreach ($gallery as $it) {
                if (($it['id'] ?? '') === $id) {
                    delete_gallery_files($it, $UPLOADS);
                } else {
                    $new[] = $it;
                }
            }
            if (!$new) {
                unset($content['gallery']); // pusta galeria = wracają zdjęcia domyślne
                flash('ok', 'Usunięto ostatnie zdjęcie, wróciły zdjęcia domyślne.');
            } else {
                $content['gallery'] = $new;
                flash('ok', 'Zdjęcie usunięte.');
            }
            write_content($content);
            redirect('#galeria');

        case 'move_photo':
            $id = (string) ($_POST['id'] ?? '');
            $dir = ($_POST['dir'] ?? '') === 'left' ? -1 : 1;
            $idx = null;
            foreach ($gallery as $k => $it) {
                if (($it['id'] ?? '') === $id) {
                    $idx = $k;
                }
            }
            if ($idx !== null && isset($gallery[$idx + $dir])) {
                [$gallery[$idx], $gallery[$idx + $dir]] = [$gallery[$idx + $dir], $gallery[$idx]];
                $content['gallery'] = array_values($gallery);
                write_content($content);
            }
            redirect('#galeria');

        case 'reset_gallery':
            foreach ($gallery as $it) {
                delete_gallery_files($it, $UPLOADS);
            }
            unset($content['gallery']);
            flash(write_content($content) ? 'ok' : 'err', 'Przywrócono domyślne zdjęcia galerii.');
            redirect('#galeria');

        case 'restore_backup':
            $old = read_json($BACKUP);
            if ($old) {
                flash(write_content($old) ? 'ok' : 'err', 'Przywrócono poprzednią wersję zmian.');
            } else {
                flash('err', 'Brak kopii poprzedniej wersji.');
            }
            redirect();
    }
    redirect();
}

/* ------------------------------------------------------------ widok */

function price_row_html($g, $i, array $it = []): string
{
    $n = "g[$g][items][$i]";
    return '<div class="row">'
        . '<label class="f-name">Usługa<input name="' . $n . '[name]" value="' . h($it['name'] ?? '') . '" maxlength="80" placeholder="np. Strzyżenie włosów"></label>'
        . '<label class="f-price">Cena (zł)<input name="' . $n . '[price]" value="' . h($it['price'] ?? '') . '" maxlength="12" inputmode="numeric" placeholder="100 lub 120+"></label>'
        . '<label class="f-dur">Czas<input name="' . $n . '[duration]" value="' . h($it['duration'] ?? '') . '" maxlength="30" placeholder="40 min"></label>'
        . '<label class="f-note">Dopisek<input name="' . $n . '[note]" value="' . h($it['note'] ?? '') . '" maxlength="60" placeholder="opcjonalnie"></label>'
        . '<button type="button" class="x" data-remove=".row" title="Usuń usługę" aria-label="Usuń usługę">✕</button>'
        . '<div class="en-line">'
        . '<label>EN: nazwa usługi<input name="' . $n . '[name_en]" value="' . h($it['name_en'] ?? '') . '" maxlength="80" placeholder="English name"></label>'
        . '<label>EN: dopisek<input name="' . $n . '[note_en]" value="' . h($it['note_en'] ?? '') . '" maxlength="60" placeholder="optional"></label>'
        . '</div>'
        . '</div>';
}

function price_group_html($g, array $grp = []): string
{
    $rows = '';
    foreach ($grp['items'] ?? [] as $i => $it) {
        $rows .= price_row_html($g, $i, $it);
    }
    return '<fieldset class="group"><div class="ghead"><label class="gtitle">Nazwa grupy<input name="g[' . $g . '][title]" value="' . h($grp['title'] ?? '') . '" maxlength="40" placeholder="np. Strzyżenie"></label>'
        . '<label class="gtitle">EN: nazwa grupy<input name="g[' . $g . '][title_en]" value="' . h($grp['title_en'] ?? '') . '" maxlength="40" placeholder="English group name"></label>'
        . '<button type="button" class="x" data-remove=".group" title="Usuń całą grupę" aria-label="Usuń grupę">✕ grupa</button></div>'
        . '<div class="rows">' . $rows . '</div>'
        . '<button type="button" class="add" data-add-row="' . h((string) $g) . '">+ Dodaj usługę</button></fieldset>';
}

/** Dane licznika z stats.json (zapisuje je track.php). */
function load_stats(string $file): array
{
    $st = read_json($file) ?? [];
    $hist = is_array($st['history'] ?? null) && count($st['history']) === 7
        ? array_map('intval', array_values($st['history']))
        : array_fill(0, 7, 0);
    $today = strtotime(date('Y-m-d'));
    $last = isset($st['last_date']) ? strtotime((string) $st['last_date']) : $today;
    $shift = (int) max(0, min(7, round(($today - ($last ?: $today)) / 86400)));
    if ($shift > 0) { // dni bez wejść: wykres przesuwa się o tyle dni
        $hist = array_merge(array_slice($hist, $shift), array_fill(0, $shift, 0));
    }
    $labels = [];
    for ($i = 0; $i < 7; $i++) {
        $labels[] = date('j.m', strtotime('-' . (6 - $i) . ' days'));
    }
    return ['visits' => (int) ($st['visits'] ?? 0), 'clicks' => (int) ($st['clicks'] ?? 0), 'hist' => $hist, 'labels' => $labels];
}

function stats_chart_svg(array $vals, array $labels): string
{
    $w = 600; $hgt = 190; $top = 22; $bottom = 28; $max = max(1, ...$vals);
    $plot = $hgt - $top - $bottom; $slot = $w / 7; $bar = $slot * 0.56;
    $out = '<svg viewBox="0 0 ' . $w . ' ' . $hgt . '" role="img" aria-label="Wejścia z ostatnich 7 dni" style="width:100%;height:auto;display:block">';
    $out .= '<line x1="0" y1="' . ($hgt - $bottom) . '" x2="' . $w . '" y2="' . ($hgt - $bottom) . '" stroke="rgba(255,255,255,.12)"/>';
    foreach ($vals as $i => $v) {
        $bh = $plot * $v / $max;
        $x = $slot * $i + ($slot - $bar) / 2;
        $y = $hgt - $bottom - $bh;
        $out .= '<rect x="' . round($x, 1) . '" y="' . round($y, 1) . '" width="' . round($bar, 1) . '" height="' . round(max($bh, $v > 0 ? 2 : 0), 1) . '" fill="#d4af37" opacity=".85"/>';
        $out .= '<text x="' . round($x + $bar / 2, 1) . '" y="' . round($y - 6, 1) . '" fill="#d1d5db" font-size="13" text-anchor="middle">' . $v . '</text>';
        $out .= '<text x="' . round($x + $bar / 2, 1) . '" y="' . ($hgt - 8) . '" fill="#8b8f98" font-size="12" text-anchor="middle">' . h($labels[$i]) . '</text>';
    }
    return $out . '</svg>';
}

function review_row_html($i, array $r = []): string
{
    $n = "r[$i]";
    $rating = (int) ($r['rating'] ?? 5);
    $opts = '';
    for ($k = 5; $k >= 1; $k--) {
        $opts .= '<option value="' . $k . '"' . ($k === $rating ? ' selected' : '') . '>' . str_repeat('★', $k) . '</option>';
    }
    return '<div class="rev">'
        . '<div class="rev-top">'
        . '<label class="f-name">Autor<input name="' . $n . '[name]" value="' . h($r['name'] ?? '') . '" maxlength="60" placeholder="np. Jan K."></label>'
        . '<label class="f-star">Gwiazdki<select name="' . $n . '[rating]">' . $opts . '</select></label>'
        . '<label class="f-dur">Kiedy<input name="' . $n . '[date]" value="' . h($r['date'] ?? '') . '" maxlength="40" placeholder="np. 2 tygodnie temu"></label>'
        . '</div>'
        . '<label>Treść opinii<textarea name="' . $n . '[text]" rows="4" maxlength="700" placeholder="Wklej treść opinii">' . h($r['text'] ?? '') . '</textarea></label>'
        . '<label>Link do opinii lub profilu autora (opcjonalnie)<input name="' . $n . '[url]" value="' . h($r['url'] ?? '') . '" maxlength="300" placeholder="https://..."></label>'
        . '<button type="button" class="x" data-remove=".rev" title="Usuń opinię" aria-label="Usuń opinię">✕ usuń opinię</button>'
        . '</div>';
}

function hours_row_html(string $k, int $i, $h): string
{
    $closed = !is_array($h);
    $o = $closed ? '' : (string) ($h[0] ?? '');
    $c = $closed ? '' : (string) ($h[1] ?? '');
    return '<div class="hrow"><span class="hday">' . h(DAY_LABELS[$i]) . '</span>'
        . '<label>Od<input type="time" name="hours[' . $k . '][open]" value="' . h($o) . '"></label>'
        . '<label>Do<input type="time" name="hours[' . $k . '][close]" value="' . h($c) . '"></label>'
        . '<label class="chk"><input type="checkbox" name="hours[' . $k . '][closed]" value="1"' . ($closed ? ' checked' : '') . '> zamknięte</label></div>';
}

function team_row_html($i, array $m = []): string
{
    $n = "team[$i]";
    $base = (string) ($m['photo']['base'] ?? '');
    $thumb = $base !== '' ? '<img src="' . h($base . '-400.webp') . '" alt="">' : '<span class="nophoto">brak zdjęcia<br>(na stronie pojawi się logo)</span>';
    return '<div class="member">'
        . '<div class="m-photo">' . $thumb . '</div>'
        . '<div class="m-body">'
        . '<input type="hidden" name="' . $n . '[id]" value="' . h($m['id'] ?? '') . '">'
        . '<input type="hidden" name="' . $n . '[photo]" value="' . h($base) . '">'
        . '<div class="m-top">'
        . '<label>Imię<input name="' . $n . '[name]" value="' . h($m['name'] ?? '') . '" maxlength="40" placeholder="np. Kacper"></label>'
        . '<label>Rola (PL)<input name="' . $n . '[role]" value="' . h($m['role'] ?? 'Barber') . '" maxlength="40" placeholder="Barber"></label>'
        . '<label>Rola (EN)<input name="' . $n . '[role_en]" value="' . h($m['role_en'] ?? '') . '" maxlength="40" placeholder="Barber"></label>'
        . '</div>'
        . '<label>Opis (PL), pokazywany pod zdjęciem<textarea name="' . $n . '[bio]" rows="4" maxlength="600">' . h($m['bio'] ?? '') . '</textarea></label>'
        . '<label>Opis (EN), wersja angielska strony<textarea name="' . $n . '[bio_en]" rows="4" maxlength="600">' . h($m['bio_en'] ?? '') . '</textarea></label>'
        . '<label>Zdjęcie (JPG, PNG, WebP) – wgraj, żeby podmienić<input type="file" name="photo_' . $i . '" accept="image/jpeg,image/png,image/webp"></label>'
        . ($base !== '' ? '<label class="chk"><input type="checkbox" name="' . $n . '[remove_photo]" value="1"> usuń zdjęcie (zostanie logo)</label>' : '')
        . '<div class="m-actions">'
        . '<button type="button" class="sec" data-move="-1" title="Przesuń wyżej" aria-label="Przesuń wyżej">↑</button>'
        . '<button type="button" class="sec" data-move="1" title="Przesuń niżej" aria-label="Przesuń niżej">↓</button>'
        . '<button type="button" class="x" data-remove=".member" title="Usuń osobę" aria-label="Usuń osobę">✕ usuń osobę</button>'
        . '</div>'
        . '</div></div>';
}

$stats = $loggedIn ? load_stats($ROOT . '/stats.json') : null;
$flashes = $_SESSION['flash'] ?? [];
unset($_SESSION['flash']);
$token = csrf();
?>
<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Panel – Kingsman Barbershop</title>
<style>
  :root { --gold:#d4af37; --bg:#050505; --card:#0c0c0c; --line:rgba(212,175,55,.25); --txt:#d1d5db; --mut:#8b8f98; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--txt); font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 20px 16px 80px; }
  h1,h2 { color:var(--gold); text-transform:uppercase; letter-spacing:.16em; margin:0; }
  h1 { font-size: 1.1rem; } h2 { font-size: 1rem; margin-bottom: 6px; }
  .top { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:8px 0 20px; flex-wrap:wrap; }
  .card { background:var(--card); border:1px solid var(--line); padding:20px; margin-bottom:24px; }
  p.hint { color:var(--mut); font-size:.9rem; margin:4px 0 16px; }
  input[type=text], input[type=password], input[type=time], input[type=date], input:not([type]), input[type=file] { width:100%; padding:11px; background:#171717; color:#fff; border:1px solid rgba(212,175,55,.35); font:inherit; }
  label { display:block; font-size:.75rem; color:var(--mut); text-transform:uppercase; letter-spacing:.08em; }
  label input { margin-top:4px; text-transform:none; letter-spacing:0; }
  button, .btn { padding:11px 16px; background:var(--gold); color:#000; border:0; font:inherit; font-weight:700; cursor:pointer; }
  button:hover { background:#f3e5ab; }
  button.sec { background:#1b1b1b; color:var(--txt); border:1px solid var(--line); font-weight:500; }
  button.sec:hover { background:#262626; }
  button.danger { background:#3a1111; color:#ffb4b4; border:1px solid #6b2222; font-weight:500; }
  .flash { padding:12px 14px; margin-bottom:12px; border:1px solid; }
  .flash.ok { background:#0f2415; border-color:#1f6b36; color:#b6f3c8; }
  .flash.err { background:#2a1010; border-color:#7a2323; color:#ffc2c2; }
  .group { border:1px solid var(--line); padding:14px; margin:0 0 16px; }
  .ghead { display:flex; gap:10px; align-items:flex-end; margin-bottom:12px; }
  .gtitle { flex:1; }
  .row { display:grid; grid-template-columns: 2.4fr 1fr 1fr 1.4fr auto; gap:8px; align-items:end; margin-bottom:10px; padding-bottom:10px; border-bottom:1px dashed rgba(255,255,255,.06); }
  button.x { background:#1b1b1b; color:#ff9a9a; border:1px solid var(--line); padding:11px 12px; font-weight:500; }
  button.add { background:transparent; color:var(--gold); border:1px dashed var(--line); width:100%; }
  .rev { border:1px solid var(--line); padding:14px; margin-bottom:14px; display:grid; gap:10px; }
  .rev-top { display:grid; grid-template-columns: 2fr 1fr 2fr; gap:8px; }
  textarea, select { width:100%; padding:11px; background:#171717; color:#fff; border:1px solid rgba(212,175,55,.35); font:inherit; margin-top:4px; }
  .stat-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; margin-top:12px; }
  .stat { background:#111; border:1px solid rgba(255,255,255,.06); padding:14px; text-align:center; }
  .stat-l { display:block; font-size:.68rem; letter-spacing:.12em; text-transform:uppercase; color:var(--mut); }
  .stat-n { display:block; font-size:2rem; font-weight:700; color:var(--gold); margin-top:6px; }
  .chart { margin-top:18px; background:#111; border:1px solid rgba(255,255,255,.06); padding:14px; }
  .actions { display:flex; gap:10px; flex-wrap:wrap; margin-top:16px; }
  .photos { display:grid; grid-template-columns: repeat(auto-fill, minmax(150px,1fr)); gap:12px; margin: 14px 0 18px; }
  .photo { border:1px solid var(--line); padding:8px; background:#111; }
  .photo img { display:block; width:100%; aspect-ratio:3/4; object-fit:cover; background:#000; }
  .photo .pb { display:flex; gap:6px; margin-top:8px; }
  .photo .pb form { flex:1; margin:0; } .photo .pb button { width:100%; padding:8px 4px; }
  .photo .n { font-size:.7rem; color:var(--mut); margin-top:6px; }
  .en-line { grid-column:1 / -1; display:grid; grid-template-columns: 2.4fr 1.4fr; gap:8px; }
  .en-line label, .gtitle + .gtitle { color:#9fb4d6; }
  label.chk { display:flex; align-items:center; gap:8px; text-transform:none; letter-spacing:0; font-size:.9rem; color:var(--txt); margin-top:8px; }
  label.chk input { width:auto; margin:0; }
  .hrow { display:grid; grid-template-columns: 9rem 1fr 1fr auto; gap:10px; align-items:end; padding:8px 0; border-bottom:1px dashed rgba(255,255,255,.06); }
  .hday { color:var(--txt); font-weight:600; padding-bottom:10px; }
  .toggle { display:flex; align-items:center; gap:12px; padding:14px; border:1px solid var(--line); background:#111; font-size:1.05rem; color:#fff; text-transform:none; letter-spacing:0; }
  .toggle input { width:22px; height:22px; margin:0; accent-color:#ffe94a; }
  .two { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px; }
  .member { display:grid; grid-template-columns: 140px 1fr; gap:14px; border:1px solid var(--line); padding:14px; margin-bottom:14px; }
  .m-photo img { width:100%; aspect-ratio:4/5; object-fit:cover; display:block; background:#000; }
  .nophoto { display:flex; align-items:center; justify-content:center; text-align:center; width:100%; aspect-ratio:4/5; background:#111; color:var(--mut); font-size:.7rem; padding:6px; }
  .m-body { display:grid; gap:10px; min-width:0; }
  .m-top { display:grid; grid-template-columns: 1.4fr 1fr 1fr; gap:8px; }
  .m-actions { display:flex; gap:8px; flex-wrap:wrap; }
  .jump { display:flex; gap:8px; flex-wrap:wrap; margin:0 0 20px; }
  .jump a { color:var(--gold); border:1px solid var(--line); padding:6px 12px; text-decoration:none; font-size:.85rem; }
  .login { max-width:380px; margin:12vh auto 0; }
  code { background:#171717; padding:2px 6px; }
  pre { background:#171717; padding:12px; overflow:auto; }
  @media (max-width: 720px) {
    .stat-grid { grid-template-columns: 1fr 1fr; }
    .row { grid-template-columns: 1fr 1fr; }
    .row .f-name, .row .f-note { grid-column: 1 / -1; }
    .row button.x { grid-column: 1 / -1; }
    .rev-top { grid-template-columns: 1fr 1fr; } .rev-top .f-name { grid-column: 1 / -1; }
    .en-line { grid-template-columns: 1fr; }
    .hrow { grid-template-columns: 1fr 1fr; } .hday { grid-column: 1 / -1; padding-bottom:0; } .hrow .chk { grid-column: 1 / -1; }
    .two { grid-template-columns: 1fr; }
    .member { grid-template-columns: 1fr; } .m-photo { max-width:160px; }
    .m-top { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<div class="wrap">
<?php foreach ($flashes as [$type, $msg]): ?>
  <div class="flash <?= h($type) ?>"><?= h($msg) ?></div>
<?php endforeach; ?>

<?php if (!$configured): ?>
  <div class="card login" style="max-width:640px">
    <h1>Panel wymaga konfiguracji</h1>
    <p>Na serwerze, w tym samym katalogu co <code>admin.php</code>, utwórz plik <code>admin-config.php</code> o treści:</p>
    <pre>&lt;?php
return ['password' =&gt; 'TU_WPISZ_SWOJE_HASLO'];</pre>
    <p class="hint">Po pierwszym zalogowaniu hasło zostanie w tym pliku automatycznie zamienione na bezpieczny hash.</p>
  </div>
<?php elseif (!$loggedIn): ?>
  <div class="card login">
    <h1 style="margin-bottom:16px">Panel – Kingsman</h1>
    <form method="post">
      <input type="hidden" name="action" value="login">
      <input type="hidden" name="csrf" value="<?= h($token) ?>">
      <label>Hasło<input type="password" name="password" required autofocus autocomplete="current-password"></label>
      <div class="actions"><button type="submit" style="width:100%">Zaloguj</button></div>
    </form>
  </div>
<?php else: ?>
  <div class="top">
    <h1>Panel strony</h1>
    <div class="actions" style="margin:0">
      <a class="btn" href="/" target="_blank" rel="noopener" style="text-decoration:none">Zobacz stronę</a>
      <form method="post" style="margin:0"><input type="hidden" name="action" value="logout"><input type="hidden" name="csrf" value="<?= h($token) ?>"><button class="sec" type="submit">Wyloguj</button></form>
    </div>
  </div>

  <!-- ============ STATYSTYKI ============ -->
  <section class="card" id="statystyki">
    <h2>Statystyki</h2>
    <div class="stat-grid">
      <div class="stat"><span class="stat-l">Wejścia na stronę</span><span class="stat-n"><?= number_format($stats['visits'], 0, ',', ' ') ?></span></div>
      <div class="stat"><span class="stat-l">Kliknięcia w Booksy</span><span class="stat-n"><?= number_format($stats['clicks'], 0, ',', ' ') ?></span></div>
      <div class="stat"><span class="stat-l">Ostatnie 7 dni</span><span class="stat-n"><?= array_sum($stats['hist']) ?></span></div>
      <div class="stat"><span class="stat-l">Klik w Booksy / wejścia</span><span class="stat-n"><?= $stats['visits'] > 0 ? round(100 * $stats['clicks'] / $stats['visits']) . '%' : '–' ?></span></div>
    </div>
    <div class="chart"><?= stats_chart_svg($stats['hist'], $stats['labels']) ?></div>
    <p class="hint">Wejście liczy się raz na sesję przeglądarki, boty są pomijane. Wykres jest dokładny od momentu wgrania nowego skryptu licznika.</p>
  </section>

  <nav class="jump" aria-label="Skróty">
    <a href="#komunikat">Pasek komunikatu</a><a href="#godziny">Godziny</a><a href="#zespol">Zespół</a><a href="#ceny">Cennik</a><a href="#galeria">Galeria</a><a href="#opinie">Opinie</a>
  </nav>

  <!-- ============ KOMUNIKAT ============ -->
  <section class="card" id="komunikat">
    <h2>Pasek komunikatu</h2>
    <p class="hint">Żółty pasek na samej górze strony (np. „W piątek 1 maja nieczynne”). <strong>Domyślnie jest ukryty.</strong> Włącz go tylko wtedy, gdy masz coś do ogłoszenia. Pasek chowa się sam po przewinięciu strony i po dacie „Pokazuj do”.</p>
    <form method="post">
      <input type="hidden" name="action" value="save_announcement">
      <input type="hidden" name="csrf" value="<?= h($token) ?>">
      <label class="toggle"><input type="checkbox" name="ann[enabled]" value="1" <?= !empty($announcement['enabled']) ? 'checked' : '' ?>> Pokazuj pasek na stronie</label>
      <div class="two">
        <label>Treść (PL)<input name="ann[text]" value="<?= h($announcement['text'] ?? '') ?>" maxlength="200" placeholder="np. Dziś pracujemy do 14:00"></label>
        <label>Treść (EN)<input name="ann[text_en]" value="<?= h($announcement['text_en'] ?? '') ?>" maxlength="200" placeholder="e.g. Open until 2 pm today"></label>
        <label>Pokazuj do (włącznie, opcjonalnie)<input type="date" name="ann[until]" value="<?= h($announcement['until'] ?? '') ?>"></label>
        <label>Link po kliknięciu (opcjonalnie)<input name="ann[url]" value="<?= h($announcement['url'] ?? '') ?>" maxlength="300" placeholder="https://..."></label>
      </div>
      <p class="hint" style="margin-bottom:0">Gdy pole EN jest puste, na angielskiej wersji pokaże się tekst polski (i odwrotnie).</p>
      <div class="actions"><button type="submit">Zapisz komunikat</button></div>
    </form>
  </section>

  <!-- ============ GODZINY ============ -->
  <section class="card" id="godziny">
    <h2>Godziny otwarcia</h2>
    <p class="hint">Na ich podstawie strona pokazuje neonowy znaczek „Otwarte teraz / Zamknięte” oraz listę w stopce. Dni o tych samych godzinach są łączone (np. „Poniedziałek – Czwartek”). Czas liczony jest w strefie Polski.</p>
    <form method="post">
      <input type="hidden" name="action" value="save_hours">
      <input type="hidden" name="csrf" value="<?= h($token) ?>">
      <?php foreach (DAY_KEYS as $i => $k) { echo hours_row_html($k, $i, $hours[$k] ?? null); } ?>
      <div class="actions"><button type="submit">Zapisz godziny</button></div>
    </form>
  </section>

  <!-- ============ ZESPÓŁ ============ -->
  <section class="card" id="zespol">
    <h2>Zespół</h2>
    <p class="hint">Osoby w sekcji „Ludzie za fotelem”. Dodaj, zmień opis, wgraj zdjęcie (przytnie się do pionowego kadru 4:5, najlepiej portret od pasa w górę) albo usuń osobę. Kolejność zmieniasz strzałkami. Maks. <?= MAX_TEAM ?> osób. Wszystko zapisuje przycisk na dole. <?= empty($content['team']) ? '<strong>Teraz widać zespół domyślny</strong>; po zapisie zmian lista zostaje na stałe.' : 'Usuń wszystkie osoby i zapisz, żeby wrócić do zespołu domyślnego.' ?></p>
    <form method="post" id="teamForm" enctype="multipart/form-data">
      <input type="hidden" name="action" value="save_team">
      <input type="hidden" name="csrf" value="<?= h($token) ?>">
      <div id="members">
        <?php foreach (array_values($team) as $i => $m) { echo team_row_html($i, $m); } ?>
      </div>
      <button type="button" class="add" id="addMember">+ Dodaj osobę</button>
      <div class="actions"><button type="submit">Zapisz zespół</button></div>
    </form>
    <template id="tplMember"><?= team_row_html('__I__') ?></template>
  </section>

  <!-- ============ CENY ============ -->
  <section class="card" id="ceny">
    <h2>Cennik</h2>
    <p class="hint">Zmień ceny, dodaj usługę albo całą grupę i kliknij „Zapisz cennik”. Pola „EN” to tłumaczenia dla angielskiej wersji (puste = pokaże się polski tekst). Zmiany są od razu widoczne na stronie. Cena to sama liczba (np. <code>100</code>), a „od” zapisujesz z plusem (<code>120+</code>).</p>
    <form method="post" id="priceForm">
      <input type="hidden" name="action" value="save_prices">
      <input type="hidden" name="csrf" value="<?= h($token) ?>">
      <div id="groups">
        <?php foreach (array_values($prices) as $g => $grp) { echo price_group_html($g, $grp); } ?>
      </div>
      <button type="button" class="add" id="addGroup">+ Dodaj grupę usług</button>
      <div class="actions"><button type="submit">Zapisz cennik</button></div>
    </form>
    <template id="tplRow"><?= price_row_html('__G__', '__I__') ?></template>
    <template id="tplGroup"><?= price_group_html('__G__') ?></template>
  </section>

  <!-- ============ GALERIA ============ -->
  <section class="card" id="galeria">
    <h2>Galeria „Realizacje”</h2>
    <p class="hint">Zdjęcia w sześciokątach na stronie. Maks. <?= MAX_GALLERY ?>. Zdjęcie jest automatycznie przycinane do pionowego kadru 3:4 i zmniejszane, więc możesz wgrywać prosto z telefonu (JPG, PNG, WebP, do 15 MB). Najlepiej, gdy głowa jest mniej więcej na środku.<?= empty($content['gallery']) ? ' <strong>Teraz widać zdjęcia domyślne</strong>; po dodaniu własnych zostaną one na liście i możesz je usunąć.' : '' ?></p>

    <div class="photos">
      <?php foreach (array_values($gallery) as $k => $it):
          $thumb = h(($it['base'] ?? '') . '-480.webp'); ?>
        <div class="photo">
          <img src="<?= $thumb ?>" alt="" loading="lazy">
          <div class="n">#<?= $k + 1 ?></div>
          <div class="pb">
            <form method="post"><input type="hidden" name="action" value="move_photo"><input type="hidden" name="csrf" value="<?= h($token) ?>"><input type="hidden" name="id" value="<?= h($it['id'] ?? '') ?>"><input type="hidden" name="dir" value="left"><button class="sec" <?= $k === 0 ? 'disabled' : '' ?> title="Przesuń w lewo" aria-label="Przesuń w lewo">←</button></form>
            <form method="post"><input type="hidden" name="action" value="move_photo"><input type="hidden" name="csrf" value="<?= h($token) ?>"><input type="hidden" name="id" value="<?= h($it['id'] ?? '') ?>"><input type="hidden" name="dir" value="right"><button class="sec" <?= $k === count($gallery) - 1 ? 'disabled' : '' ?> title="Przesuń w prawo" aria-label="Przesuń w prawo">→</button></form>
            <form method="post" onsubmit="return confirm('Usunąć to zdjęcie z galerii?')"><input type="hidden" name="action" value="delete_photo"><input type="hidden" name="csrf" value="<?= h($token) ?>"><input type="hidden" name="id" value="<?= h($it['id'] ?? '') ?>"><button class="danger" title="Usuń" aria-label="Usuń zdjęcie">✕</button></form>
          </div>
        </div>
      <?php endforeach; ?>
    </div>

    <form method="post" enctype="multipart/form-data">
      <input type="hidden" name="action" value="upload">
      <input type="hidden" name="csrf" value="<?= h($token) ?>">
      <label>Dodaj zdjęcia (możesz zaznaczyć kilka)<input type="file" name="photos[]" accept="image/jpeg,image/png,image/webp" multiple required></label>
      <div style="height:10px"></div>
      <label>Opis zdjęcia dla wyszukiwarek i niewidomych (opcjonalnie)<input name="alt" maxlength="160" placeholder="np. Fade z wzorem, profil klienta"></label>
      <div class="actions"><button type="submit">Wgraj zdjęcia</button></div>
    </form>

    <?php if (!empty($content['gallery'])): ?>
      <form method="post" onsubmit="return confirm('Usunąć wszystkie wgrane zdjęcia i wrócić do domyślnych?')" style="margin-top:14px">
        <input type="hidden" name="action" value="reset_gallery"><input type="hidden" name="csrf" value="<?= h($token) ?>">
        <button class="sec" type="submit">Przywróć domyślne zdjęcia</button>
      </form>
    <?php endif; ?>
  </section>

  <!-- ============ OPINIE ============ -->
  <section class="card" id="opinie">
    <h2>Opinie klientów</h2>
    <p class="hint">Opinie widoczne w sekcji „Opinie” na stronie. Skopiuj z Google (autor, gwiazdki, treść) najlepsze, maks. 12. Ocena i liczba opinii z Google nadal pobierają się same. <?= empty($content['reviews']) ? '<strong>Teraz strona pokazuje opinie domyślne</strong>; po dodaniu własnych zastąpią je.' : 'Usuń wszystkie wiersze i zapisz, żeby wrócić do opinii domyślnych.' ?></p>
    <form method="post" id="revForm">
      <input type="hidden" name="action" value="save_reviews">
      <input type="hidden" name="csrf" value="<?= h($token) ?>">
      <div id="revs">
        <?php foreach (array_values(is_array($content['reviews'] ?? null) ? $content['reviews'] : []) as $i => $r) { echo review_row_html($i, $r); } ?>
      </div>
      <button type="button" class="add" id="addRev">+ Dodaj opinię</button>
      <div class="actions"><button type="submit">Zapisz opinie</button></div>
    </form>
    <template id="tplRev"><?= review_row_html('__I__') ?></template>
  </section>

  <?php if (is_file($BACKUP)): ?>
  <section class="card">
    <h2>Pomyłka?</h2>
    <p class="hint">Panel zapamiętuje jedną poprzednią wersję zmian (ceny, zespół, godziny, komunikat, opinie i kolejność zdjęć).</p>
    <form method="post" onsubmit="return confirm('Wrócić do poprzedniej wersji?')"><input type="hidden" name="action" value="restore_backup"><input type="hidden" name="csrf" value="<?= h($token) ?>"><button class="sec" type="submit">Przywróć poprzednią wersję</button></form>
  </section>
  <?php endif; ?>

<script>
(function () {
  var groups = document.getElementById('groups');
  var rowTpl = document.getElementById('tplRow').innerHTML;
  var groupTpl = document.getElementById('tplGroup').innerHTML;
  var counter = 1000;
  function html(s) { var t = document.createElement('div'); t.innerHTML = s; return t.firstElementChild; }

  document.getElementById('addGroup').addEventListener('click', function () {
    var g = counter++;
    var el = html(groupTpl.split('__G__').join(g));
    var rows = el.querySelector('.rows');
    rows.appendChild(html(rowTpl.split('__G__').join(g).split('__I__').join(counter++)));
    groups.appendChild(el);
    el.querySelector('input').focus();
  });

  groups.addEventListener('click', function (e) {
    var add = e.target.closest('[data-add-row]');
    if (add) {
      var g = add.getAttribute('data-add-row');
      var row = html(rowTpl.split('__G__').join(g).split('__I__').join(counter++));
      add.parentNode.querySelector('.rows').appendChild(row);
      row.querySelector('input').focus();
      return;
    }
    var rm = e.target.closest('[data-remove]');
    if (rm) {
      var target = rm.closest(rm.getAttribute('data-remove'));
      var what = rm.getAttribute('data-remove') === '.group' ? 'całą grupę usług' : 'tę usługę';
      if (confirm('Usunąć ' + what + '? (zmiana zapisze się dopiero po kliknięciu „Zapisz cennik”)')) target.remove();
    }
  });
  var members = document.getElementById('members');
  var memberTpl = document.getElementById('tplMember').innerHTML;
  document.getElementById('addMember').addEventListener('click', function () {
    var el = html(memberTpl.split('__I__').join(counter++));
    members.appendChild(el);
    el.querySelector('input[name$="[name]"]').focus();
  });
  members.addEventListener('click', function (e) {
    var mv = e.target.closest('[data-move]');
    if (mv) {
      var card = mv.closest('.member');
      if (mv.getAttribute('data-move') === '-1' && card.previousElementSibling) members.insertBefore(card, card.previousElementSibling);
      if (mv.getAttribute('data-move') === '1' && card.nextElementSibling) members.insertBefore(card.nextElementSibling, card);
      return;
    }
    var rm = e.target.closest('[data-remove]');
    if (rm && confirm('Usunąć tę osobę z zespołu? (zmiana zapisze się po kliknięciu „Zapisz zespół”)')) rm.closest('.member').remove();
  });
  var revs = document.getElementById('revs');
  var revTpl = document.getElementById('tplRev').innerHTML;
  document.getElementById('addRev').addEventListener('click', function () {
    var el = html(revTpl.split('__I__').join(counter++));
    revs.appendChild(el);
    el.querySelector('input').focus();
  });
  revs.addEventListener('click', function (e) {
    var rm = e.target.closest('[data-remove]');
    if (rm && confirm('Usunąć tę opinię? (zmiana zapisze się po kliknięciu „Zapisz opinie”)')) rm.closest('.rev').remove();
  });
})();
</script>
<?php endif; ?>
</div>
</body>
</html>
