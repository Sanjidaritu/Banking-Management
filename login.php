<?php

declare(strict_types=1);

session_start();

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response([
        'success' => false,
        'message' => 'Method not allowed.'
    ], 405);
}

try {

    $data = json_input();

    $username = trim((string)($data['username'] ?? ''));
    $password = (string)($data['password'] ?? '');

    if ($username === '' || $password === '') {
        json_response([
            'success' => false,
            'message' => 'Username and password are required.'
        ], 400);
    }

    $stmt = $pdo->prepare(
        'SELECT id, customer_id, username, password_hash, active
         FROM online_users
         WHERE username = :username
         LIMIT 1'
    );

    $stmt->execute([
        'username' => $username
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (
        !$user ||
        (int)$user['active'] !== 1 ||
        !password_verify($password, $user['password_hash'])
    ) {
        usleep(250000);

        json_response([
            'success' => false,
            'message' => 'Invalid username or password.'
        ], 401);
    }

    session_regenerate_id(true);

    $_SESSION['online_user_id'] = (int)$user['id'];
    $_SESSION['customer_id'] = (int)$user['customer_id'];
    $_SESSION['username'] = $user['username'];

    json_response([
        'success' => true,
        'username' => $user['username']
    ]);

} catch (Throwable $e) {

    json_response([
        'success' => false,
        'message' => 'Login failed.'
    ], 500);
}
