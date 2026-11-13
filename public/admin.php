<?php
/**
 * Panel zarządzania treścią strony Kingsman Barbershop.
 *  - ceny: dodawanie, edycja i usuwanie usług oraz grup,
 *  - galeria sześciokątów: wgrywanie zdjęć (przycinane i zmniejszane automatycznie), kolejność, usuwanie.
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

const MAX_GALLERY = 8;
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_PIXELS = 50000000;
const DEFAULT_ALT = 'Strzyżenie wykonane w Kingsman Barbershop';

$ROOT = __DIR__;
$CONTENT = $ROOT . '/content.json';
$BACKUP = $ROOT . '/content.backup.json';
$DEFAULTS = $ROOT . '/content-defaults.json';
$UPLOADS = $ROOT . '/uploads/gallery';
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
        $items = [];
        foreach (is_array($g['items'] ?? null) ? $g['items'] : [] as $it) {
            if (!is_array($it)) {
                continue;
            }
            $name = clip((string) ($it['name'] ?? ''), 80);
            $price = str_replace([' ', 'zł', 'PLN'], '', clip((string) ($it['price'] ?? ''), 12));
            $duration = clip((string) ($it['duration'] ?? ''), 30);
            $note = clip((string) ($it['note'] ?? ''), 60);
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
                ['name' => $name, 'price' => $price, 'duration' => $duration, 'note' => $note],
                static fn ($v, $k) => $k !== 'note' || $v !== '',
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
        $groups[] = ['title' => $title, 'items' => $items];
    }
    if (!$groups) {
        $errors[] = 'Cennik musi zawierać co najmniej jedną usługę.';
    }
    return [$groups, $errors];
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

/** Zapisuje zdjęcie jako dwa pliki WebP 3:4 (480 i 800 px). Zwraca id albo tekst błędu. */
function save_gallery_photo(string $tmp, string $dir): array
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
    // kadr 3:4; przy zdjęciach pionowych przycinamy bardziej od dołu (twarz zwykle jest wyżej)
    if ($w / $hgt > 3 / 4) {
        $cw = (int) round($hgt * 3 / 4);
        $ch = $hgt;
        $cx = (int) (($w - $cw) / 2);
        $cy = 0;
    } else {
        $cw = $w;
        $ch = (int) round($w * 4 / 3);
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
    foreach ([800 => 1067, 480 => 640] as $tw => $th) {
        $dst = imagecreatetruecolor($tw, $th);
        imagecopyresampled($dst, $src, 0, 0, $cx, $cy, $tw, $th, $cw, $ch);
        $file = "$dir/$id-$tw.webp";
        $ok = imagewebp($dst, $file, 82);
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
        . '</div>';
}

function price_group_html($g, array $grp = []): string
{
    $rows = '';
    foreach ($grp['items'] ?? [] as $i => $it) {
        $rows .= price_row_html($g, $i, $it);
    }
    return '<fieldset class="group"><div class="ghead"><label class="gtitle">Nazwa grupy<input name="g[' . $g . '][title]" value="' . h($grp['title'] ?? '') . '" maxlength="40" placeholder="np. Strzyżenie"></label>'
        . '<button type="button" class="x" data-remove=".group" title="Usuń całą grupę" aria-label="Usuń grupę">✕ grupa</button></div>'
        . '<div class="rows">' . $rows . '</div>'
        . '<button type="button" class="add" data-add-row="' . h((string) $g) . '">+ Dodaj usługę</button></fieldset>';
}

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
  input[type=text], input[type=password], input:not([type]), input[type=file] { width:100%; padding:11px; background:#171717; color:#fff; border:1px solid rgba(212,175,55,.35); font:inherit; }
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
  .actions { display:flex; gap:10px; flex-wrap:wrap; margin-top:16px; }
  .photos { display:grid; grid-template-columns: repeat(auto-fill, minmax(150px,1fr)); gap:12px; margin: 14px 0 18px; }
  .photo { border:1px solid var(--line); padding:8px; background:#111; }
  .photo img { display:block; width:100%; aspect-ratio:3/4; object-fit:cover; background:#000; }
  .photo .pb { display:flex; gap:6px; margin-top:8px; }
  .photo .pb form { flex:1; margin:0; } .photo .pb button { width:100%; padding:8px 4px; }
  .photo .n { font-size:.7rem; color:var(--mut); margin-top:6px; }
  .login { max-width:380px; margin:12vh auto 0; }
  code { background:#171717; padding:2px 6px; }
  pre { background:#171717; padding:12px; overflow:auto; }
  @media (max-width: 720px) {
    .row { grid-template-columns: 1fr 1fr; }
    .row .f-name, .row .f-note { grid-column: 1 / -1; }
    .row button.x { grid-column: 1 / -1; }
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

  <!-- ============ CENY ============ -->
  <section class="card" id="ceny">
    <h2>Cennik</h2>
    <p class="hint">Zmień ceny, dodaj usługę albo całą grupę i kliknij „Zapisz cennik”. Zmiany są od razu widoczne na stronie. Cena to sama liczba (np. <code>100</code>), a „od” zapisujesz z plusem (<code>120+</code>).</p>
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

  <?php if (is_file($BACKUP)): ?>
  <section class="card">
    <h2>Pomyłka?</h2>
    <p class="hint">Panel zapamiętuje jedną poprzednią wersję zmian (ceny i kolejność zdjęć).</p>
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
})();
</script>
<?php endif; ?>
</div>
</body>
</html>
