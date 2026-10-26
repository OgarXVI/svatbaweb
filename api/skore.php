<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const TOP_COUNT = 10;
const MAX_NAME_LENGTH = 30;
const MAX_SCORE = 20000;

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function connect(): PDO
{
    $configFile = __DIR__ . '/config.php';
    if (!is_file($configFile)) {
        error_log('skore.php: missing config.php');
        respond(500, ['ok' => false, 'error' => 'Služba není momentálně dostupná.']);
    }
    $config = require $configFile;

    return new PDO(
        sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['host'], $config['dbname']),
        $config['user'],
        $config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $rows = connect()
            ->query('SELECT jmeno, skore FROM skore ORDER BY skore DESC, id ASC LIMIT ' . TOP_COUNT)
            ->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log('skore.php: ' . $e->getMessage());
        respond(500, ['ok' => false, 'error' => 'Žebříček se nepodařilo načíst.']);
    }
    $scores = array_map(
        static fn(array $row): array => ['jmeno' => $row['jmeno'], 'skore' => (int)$row['skore']],
        $rows
    );
    respond(200, ['ok' => true, 'scores' => $scores]);
}

if ($method !== 'POST') {
    header('Allow: GET, POST');
    respond(405, ['ok' => false, 'error' => 'Metoda není povolena.']);
}

// Honeypot: bots fill the hidden field; pretend success.
if (trim((string)($_POST['web'] ?? '')) !== '') {
    respond(200, ['ok' => true]);
}

$jmeno = trim((string)preg_replace('/\s+/u', ' ', (string)($_POST['jmeno'] ?? '')));
$skore = filter_var($_POST['skore'] ?? null, FILTER_VALIDATE_INT);

if ($jmeno === '') {
    respond(422, ['ok' => false, 'error' => 'Zadejte prosím své jméno.']);
}
if (mb_strlen($jmeno) > MAX_NAME_LENGTH) {
    respond(422, ['ok' => false, 'error' => 'Jméno je příliš dlouhé (nejvýše ' . MAX_NAME_LENGTH . ' znaků).']);
}
if ($skore === false || $skore < 1 || $skore > MAX_SCORE) {
    respond(422, ['ok' => false, 'error' => 'Neplatné skóre.']);
}

try {
    $stmt = connect()->prepare('INSERT INTO skore (jmeno, skore) VALUES (:jmeno, :skore)');
    $stmt->execute([':jmeno' => $jmeno, ':skore' => $skore]);
} catch (PDOException $e) {
    error_log('skore.php: ' . $e->getMessage());
    respond(500, ['ok' => false, 'error' => 'Uložení se nezdařilo. Zkuste to prosím později.']);
}

respond(200, ['ok' => true]);
