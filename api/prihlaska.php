<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, ['ok' => false, 'error' => 'Metoda není povolena.']);
}

// Honeypot: bots fill the hidden field; pretend success.
if (trim((string)($_POST['web'] ?? '')) !== '') {
    respond(200, ['ok' => true]);
}

$jmeno = trim((string)($_POST['jmeno'] ?? ''));
$prijmeni = trim((string)($_POST['prijmeni'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));

if ($jmeno === '' || $prijmeni === '' || $email === '') {
    respond(422, ['ok' => false, 'error' => 'Vyplňte prosím jméno, příjmení i e-mail.']);
}
if (mb_strlen($jmeno) > 100 || mb_strlen($prijmeni) > 100 || strlen($email) > 254) {
    respond(422, ['ok' => false, 'error' => 'Některý údaj je příliš dlouhý.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, ['ok' => false, 'error' => 'Zadejte prosím platný e-mail.']);
}

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    error_log('prihlaska.php: missing config.php');
    respond(500, ['ok' => false, 'error' => 'Služba není momentálně dostupná.']);
}
$config = require $configFile;

try {
    $pdo = new PDO(
        sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['host'], $config['dbname']),
        $config['user'],
        $config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
    $stmt = $pdo->prepare('INSERT INTO prihlasky (jmeno, prijmeni, email) VALUES (:jmeno, :prijmeni, :email)');
    $stmt->execute([':jmeno' => $jmeno, ':prijmeni' => $prijmeni, ':email' => $email]);
} catch (PDOException $e) {
    error_log('prihlaska.php: ' . $e->getMessage());
    respond(500, ['ok' => false, 'error' => 'Uložení se nezdařilo. Zkuste to prosím později.']);
}

respond(200, ['ok' => true]);
