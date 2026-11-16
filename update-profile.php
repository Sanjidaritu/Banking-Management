
<?php

declare(strict_types=1);

session_start();

require_once __DIR__ . '/config.php';

// Only PUT requests are allowed
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    json_response([
        'success' => false,
        'message' => 'Method not allowed.'
    ], 405);
}

// Authenticate customer
if (
    empty($_SESSION['user_id']) ||
    empty($_SESSION['customer_id'])
) {
    json_response([
        'success' => false,
        'message' => 'Please log in to update your profile.'
    ], 401);
}

// Customer ID comes ONLY from authenticated session
$customerId = (int) $_SESSION['customer_id'];

// Read JSON request
$raw = file_get_contents('php://input');

$data = json_decode($raw ?: '', true);

if (!is_array($data)) {
    json_response([
        'success' => false,
        'message' => 'Invalid JSON request.'
    ], 400);
}

// Reject attempts to update protected fields
$protectedFields = [
    'customer_id',
    'id',
    'date_of_birth',
    'dateOfBirth',
    'ssn',
    'ssn_last4'
];

foreach ($protectedFields as $field) {
    if (array_key_exists($field, $data)) {
        json_response([
            'success' => false,
            'message' => 'Protected customer information cannot be updated.'
        ], 400);
    }
}

// Required editable fields
$fields = [
    'firstName' => 100,
    'lastName' => 100,
    'email' => 255,
    'phone' => 30,
    'streetAddress' => 255,
    'city' => 100,
    'state' => 100,
    'zipCode' => 20
];

$profile = [];

// Validate required fields and lengths
foreach ($fields as $field => $maxLength) {

    if (
        !isset($data[$field]) ||
        !is_string($data[$field])
    ) {
        json_response([
            'success' => false,
            'message' => $field . ' is required.'
        ], 400);
    }

    $value = trim($data[$field]);

    if ($value === '') {
        json_response([
            'success' => false,
            'message' => $field . ' is required.'
        ], 400);
    }

    if (strlen($value) > $maxLength) {
        json_response([
            'success' => false,
            'message' => $field . ' exceeds the maximum allowed length.'
        ], 400);
    }

    $profile[$field] = $value;
}

// Normalize email
$profile['email'] = strtolower($profile['email']);

// Validate email
if (!filter_var($profile['email'], FILTER_VALIDATE_EMAIL)) {
    json_response([
        'success' => false,
        'message' => 'Please enter a valid email address.'
    ], 400);
}

// Validate phone
if (!preg_match('/^\+?[0-9\s().-]{7,30}$/', $profile['phone'])) {
    json_response([
        'success' => false,
        'message' => 'Please enter a valid phone number.'
    ], 400);
}

// Validate ZIP code (US format)
if (!preg_match('/^\d{5}(-\d{4})?$/', $profile['zipCode'])) {
    json_response([
        'success' => false,
        'message' => 'Please enter a valid ZIP code.'
    ], 400);
}

try {

    // Begin database transaction
    $pdo->beginTransaction();

    // Lock existing customer record
    $stmt = $pdo->prepare("
        SELECT
            email,
            phone
        FROM customers
        WHERE id = :customer_id
        FOR UPDATE
    ");

    $stmt->execute([
        ':customer_id' => $customerId
    ]);

    $existing = $stmt->fetch();

    if (!$existing) {

        $pdo->rollBack();

        json_response([
            'success' => false,
            'message' => 'Customer not found.'
        ], 404);
    }

    // Detect contact changes
    $emailChanged =
        strtolower((string)($existing['email'] ?? ''))
        !== $profile['email'];

    $phoneChanged =
        (string)($existing['phone'] ?? '')
        !== $profile['phone'];

    // Update existing customer record
    // DOB and SSN are intentionally excluded
    $stmt = $pdo->prepare("
        UPDATE customers
        SET
            first_name = :first_name,
            last_name = :last_name,
            email = :email,
            phone = :phone,
            address = :address,
            city = :city,
            state = :state,
            postal_code = :postal_code,

            email_verified = CASE
                WHEN :email_changed = 1 THEN 0
                ELSE email_verified
            END,

            phone_verified = CASE
                WHEN :phone_changed = 1 THEN 0
                ELSE phone_verified
            END

        WHERE id = :customer_id
    ");

    $stmt->execute([
        ':first_name' => $profile['firstName'],
        ':last_name' => $profile['lastName'],
        ':email' => $profile['email'],
        ':phone' => $profile['phone'],
        ':address' => $profile['streetAddress'],
        ':city' => $profile['city'],
        ':state' => $profile['state'],
        ':postal_code' => $profile['zipCode'],
        ':email_changed' => $emailChanged ? 1 : 0,
        ':phone_changed' => $phoneChanged ? 1 : 0,
        ':customer_id' => $customerId
    ]);

    // Commit all changes together
    $pdo->commit();

    json_response([
        'success' => true,
        'message' => 'Profile updated successfully.',
        'emailVerificationRequired' => $emailChanged,
        'phoneVerificationRequired' => $phoneChanged
    ], 200);

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('UPDATE PROFILE ERROR: ' . $e->getMessage());

    json_response([
        'success' => false,
        'message' => 'Unable to update customer profile.'
    ], 500);
}
