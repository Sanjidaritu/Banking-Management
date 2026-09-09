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

$token = trim((string)($data['enrollment_token'] ?? ''));
$username = trim((string)($data['username'] ?? ''));
$password = (string)($data['password'] ?? '');

if ($token === '') {
    json_response([
        'success' => false,
        'message' => 'Enrollment session is missing.'
    ], 401);
}

if (
    !isset($_SESSION['enrollment_token_hash']) ||
    !isset($_SESSION['enrollment_customer_id']) ||
    !isset($_SESSION['enrollment_expires'])
) {
    json_response([
        'success' => false,
        'message' => 'Enrollment session has expired. Please start again.'
    ], 401);
}

if (time() > (int)$_SESSION['enrollment_expires']) {
    json_response([
        'success' => false,
        'message' => 'Enrollment session has expired. Please start again.'
    ], 401);
}

if (!hash_equals(
    (string)$_SESSION['enrollment_token_hash'],
    hash('sha256', $token)
)) {
    json_response([
        'success' => false,
        'message' => 'Invalid enrollment session.'
    ], 401);
}

if (!preg_match('/^[A-Za-z0-9_]{6,20}$/', $username)) {
    json_response([
        'success' => false,
        'message' => 'Username must be 6 to 20 characters.'
    ], 400);
}

if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,72}$/', $password)) {
    json_response([
        'success' => false,
        'message' => 'Password must be 12 to 72 characters and contain uppercase, lowercase, and a number.'
    ], 400);
}

$customerId = (int)$_SESSION['enrollment_customer_id'];

try {

    // Check customer
    $stmt = $pdo->prepare("
        SELECT id, active, online_enrolled, account_status
        FROM customers
        WHERE id = :id
        LIMIT 1
    ");

    $stmt->execute([
        ':id' => $customerId
    ]);

    $customer = $stmt->fetch();

    if (!$customer) {
        json_response([
            'success' => false,
            'message' => 'Customer account was not found.'
        ], 404);
    }

    if ((int)$customer['active'] !== 1) {
        json_response([
            'success' => false,
            'message' => 'Customer account is inactive.'
        ], 403);
    }

    if ($customer['account_status'] !== 'active') {
        json_response([
            'success' => false,
            'message' => 'Bank account is not active.'
        ], 403);
    }

    if ((int)$customer['online_enrolled'] === 1) {
        json_response([
            'success' => false,
            'message' => 'This customer is already enrolled.'
        ], 409);
    }

    // Check username
    $stmt = $pdo->prepare("
        SELECT id
        FROM online_users
        WHERE username = :username
        LIMIT 1
    ");

    $stmt->execute([
        ':username' => $username
    ]);

    if ($stmt->fetch()) {
        json_response([
            'success' => false,
            'message' => 'Username is already taken.'
        ], 409);
    }

    // Hash password
    $passwordHash = password_hash(
        $password,
        PASSWORD_DEFAULT
    );

    if ($passwordHash === false) {
        json_response([
            'success' => false,
            'message' => 'Unable to secure password.'
        ], 500);
    }

    $pdo->beginTransaction();

    // Create online user
    $stmt = $pdo->prepare("
        INSERT INTO online_users
        (
            customer_id,
            username,
            password_hash,
            active
        )
        VALUES
        (
            :customer_id,
            :username,
            :password_hash,
            1
        )
    ");

    $stmt->execute([
        ':customer_id' => $customerId,
        ':username' => $username,
        ':password_hash' => $passwordHash
    ]);

    // Mark customer as enrolled
    $stmt = $pdo->prepare("
        UPDATE customers
        SET online_enrolled = 1
        WHERE id = :id
    ");

    $stmt->execute([
        ':id' => $customerId
    ]);

    $pdo->commit();

    // Destroy enrollment session
    unset(
        $_SESSION['enrollment_token_hash'],
        $_SESSION['enrollment_customer_id'],
        $_SESSION['enrollment_expires']
    );

    json_response([
        'success' => true,
        'message' => 'Online banking account created successfully.',
        'username' => $username
    ]);

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        'Create online user failed: ' . $e->getMessage()
    );

    json_response([
        'success' => false,
        'message' => 'Unable to create online banking account.'
    ], 500);
}
