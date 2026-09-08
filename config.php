<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

/*
|--------------------------------------------------------------------------
| Railway MySQL Configuration
|--------------------------------------------------------------------------
|
| These variables must be available to the PHP service in Railway:
|
| MYSQLHOST
| MYSQLPORT
| MYSQLDATABASE
| MYSQLUSER
| MYSQLPASSWORD
|
*/

$host = getenv('MYSQLHOST');
$port = getenv('MYSQLPORT');
$db   = getenv('MYSQLDATABASE');
$user = getenv('MYSQLUSER');
$pass = getenv('MYSQLPASSWORD');


/*
|--------------------------------------------------------------------------
| Check Environment Variables
|--------------------------------------------------------------------------
*/

$missing = [];

if (!$host) {
    $missing[] = 'MYSQLHOST';
}

if (!$port) {
    $missing[] = 'MYSQLPORT';
}

if (!$db) {
    $missing[] = 'MYSQLDATABASE';
}

if (!$user) {
    $missing[] = 'MYSQLUSER';
}

if (!$pass) {
    $missing[] = 'MYSQLPASSWORD';
}

if (!empty($missing)) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Database environment variables are missing.',
        'missing' => $missing
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Database Connection
|--------------------------------------------------------------------------
*/

try {

    $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";

    $pdo = new PDO(
        $dsn,
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,

            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,

            PDO::ATTR_EMULATE_PREPARES => false,

            PDO::ATTR_TIMEOUT => 10
        ]
    );

} catch (PDOException $e) {

    error_log(
        'Database connection error: ' .
        $e->getMessage()
    );

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed.'
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Read JSON Request
|--------------------------------------------------------------------------
*/

function json_input(): array
{
    $raw = file_get_contents('php://input');

    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $data = json_decode(
        $raw,
        true
    );

    return is_array($data) ? $data : [];
}


/*
|--------------------------------------------------------------------------
| JSON Response
|--------------------------------------------------------------------------
*/

function json_response(
    array $data,
    int $status = 200
): never {

    http_response_code($status);

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE
    );

    exit;
}
