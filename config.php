<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$host = getenv('MYSQLHOST') ?: '127.0.0.1';
$port = getenv('MYSQLPORT') ?: '3306';
$db   = getenv('MYSQLDATABASE') ?: 'banking_management';
$user = getenv('MYSQLUSER') ?: 'root';
$pass = getenv('MYSQLPASSWORD') ?: '';

try {

    $pdo = new PDO(
        "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

} catch (Throwable $e) {

    error_log('Database connection error: ' . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed.'
    ]);

    exit;
}


function json_input(): array
{
    $raw = file_get_contents('php://input');

    $data = json_decode(
        $raw ?: '{}',
        true
    );

    return is_array($data) ? $data : [];
}


function json_response(
    array $data,
    int $status = 200
): never {

    http_response_code($status);

    echo json_encode($data);

    exit;
}
