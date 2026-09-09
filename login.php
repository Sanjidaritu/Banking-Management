<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

session_start();

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response([
        'success' => false,
        'message' => 'Method not allowed.'
    ], 405);
}

$raw = file_get_contents('php://input');

$data = json_decode($raw ?: '', true);

if (!is_array($data)) {
    json_response([
        'success' => false,
        'message' => 'Invalid JSON request.'
    ], 400);
}

$username = trim((string)($data['username'] ?? ''));
$password = (string)($data['password'] ?? '');

if ($username === '' || $password === '') {
    json_response([
        'success' => false,
        'message' => 'Username and password are required.'
    ], 400);
}

try {

    $stmt = $pdo->prepare("
        SELECT
            id,
            customer_id,
            username,
            password_hash,
            active
        FROM online_users
        WHERE username = :username
        LIMIT 1
    ");

    $stmt->execute([
        ':username' => $username
    ]);

    $user = $stmt->fetch();

} catch (Throwable $e) {

    error_log(
        'Login query failed: ' . $e->getMessage()
    );

    json_response([
        'success' => false,
        'message' => 'Unable to process login.'
    ], 500);
}

if (!$user) {
    json_response([
        'success' => false,
        'message' => 'Invalid username or password.'
    ], 401);
}

if ((int)$user['active'] !== 1) {
    json_response([
        'success' => false,
        'message' => 'This online banking account is inactive.'
    ], 403);
}

if (!password_verify(
    $password,
    (string)$user['password_hash']
)) {
    json_response([
        'success' => false,
        'message' => 'Invalid username or password.'
    ], 401);
}

/*
 * Login successful
 */

session_regenerate_id(true);

$_SESSION['user_id'] = (int)$user['id'];
$_SESSION['customer_id'] = (int)$user['customer_id'];
$_SESSION['username'] = $user['username'];

try {

    $stmt = $pdo->prepare("
        UPDATE online_users
        SET last_login_at = NOW()
        WHERE id = :id
    ");

    $stmt->execute([
        ':id' => (int)$user['id']
    ]);

} catch (Throwable $e) {

    error_log(
        'Last login update failed: ' . $e->getMessage()
    );
}

json_response([
    'success' => true,
    'message' => 'Login successful.',
    'username' => $user['username']
]);
