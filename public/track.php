<?php
/**
 * Licznik dla panelu stats.php (wersja poprawiona, zgodna z istniejącym stats.json).
 * Wgraj jako track.php obok stats.php. Różnice względem poprzedniej wersji:
 *  - wykres "7 dni" naprawdę przesuwa się o dobę (wcześniej dzisiejszy słupek rósł w nieskończoność),
 *  - blokada pliku, żeby dwa jednoczesne wejścia nie nadpisały sobie licznika,
 *  - tylko metody GET/POST i typy visit/click.
 */
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-store');

$type = ($_GET['type'] ?? 'visit') === 'click' ? 'click' : 'visit';
$file = __DIR__ . '/stats.json';
$today = date('Y-m-d');

$fp = fopen($file, 'c+');
if (!$fp) { http_response_code(500); exit; }
flock($fp, LOCK_EX);

$raw = stream_get_contents($fp);
$data = json_decode($raw ?: '', true);
if (!is_array($data)) $data = ['visits' => 0, 'clicks' => 0];
$data += ['visits' => 0, 'clicks' => 0];
if (!isset($data['history']) || !is_array($data['history']) || count($data['history']) !== 7) {
    $data['history'] = [0, 0, 0, 0, 0, 0, 0];
}

// przesuń wykres o tyle dni, ile minęło od ostatniego wpisu
$last = $data['last_date'] ?? $today;
$shift = (int) ((strtotime($today) - strtotime($last)) / 86400);
if ($shift > 0) {
    $data['history'] = array_merge(array_slice($data['history'], min($shift, 7)), array_fill(0, min($shift, 7), 0));
}
$data['last_date'] = $today;

if ($type === 'click') {
    $data['clicks']++;
} else {
    $data['visits']++;
    $data['history'][6]++;
}

ftruncate($fp, 0);
rewind($fp);
fwrite($fp, json_encode($data));
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);
http_response_code(204);
