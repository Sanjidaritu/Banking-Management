<?php
declare(strict_types=1);
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);

    session_start();
}

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response([
        'success' => false,
        'message' => 'Method not allowed.'
    ], 405);
}

if (empty($_SESSION['customer_id'])) {
    json_response([
        'success' => false,
        'message' => 'Please log in to access your profile.'
    ], 401);
}

try {
    $customerId = (int) $_SESSION['customer_id'];

    $stmt = $pdo->prepare("
        SELECT
            first_name,
            last_name,
            date_of_birth,
            email,
            phone,
            address,
            city,
            state,
            postal_code,
            email_verified,
            phone_verified
        FROM customers
        WHERE id = :customer_id
        LIMIT 1
    ");

    $stmt->execute([
        ':customer_id' => $customerId
    ]);

    $customer = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$customer) {
        json_response([
            'success' => false,
            'message' => 'Customer profile not found.'
        ], 404);
    }

    json_response([
        'success' => true,
        'profile' => [
            'firstName' => $customer['first_name'],
            'lastName' => $customer['last_name'],
            'dateOfBirth' => $customer['date_of_birth'],
            'email' => $customer['email'] ?? '',
            'phone' => $customer['phone'] ?? '',
            'streetAddress' => $customer['address'] ?? '',
            'city' => $customer['city'] ?? '',
            'state' => $customer['state'] ?? '',
            'zipCode' => $customer['postal_code'] ?? '',
            'emailVerified' => (bool) $customer['email_verified'],
            'phoneVerified' => (bool) $customer['phone_verified']
        ]
    ], 200);

} catch (Throwable $e) {

    error_log('Get profile error: ' . $e->getMessage());

    json_response([
        'success' => false,
        'message' => 'Unable to retrieve profile.'
    ], 500);
}
