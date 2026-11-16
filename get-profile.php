
<?php

declare(strict_types=1);

session_start();

require_once __DIR__ . '/config.php';

// Only GET requests are allowed
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response([
        'success' => false,
        'message' => 'Method not allowed.'
    ], 405);
}

// Check authentication
if (
    empty($_SESSION['user_id']) ||
    empty($_SESSION['customer_id'])
) {
    json_response([
        'success' => false,
        'message' => 'Please log in to access your profile.'
    ], 401);
}

// Get authenticated Customer ID
$customerId = (int) $_SESSION['customer_id'];

try {

    $stmt = $pdo->prepare("
        SELECT
            id,
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

    $customer = $stmt->fetch();

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

    error_log('GET PROFILE ERROR: ' . $e->getMessage());

    json_response([
        'success' => false,
        'message' => 'Unable to retrieve customer profile.'
    ], 500);
}
