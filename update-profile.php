<?php
declare(strict_types=1);
session_start();
require_once __DIR__ . '/config.php';

// 1. Allow PUT requests only
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    json_response([
        'success' => false,
        'message' => 'Method not allowed.',
        'received_method' => $_SERVER['REQUEST_METHOD']
    ], 405);
}

// 2. Check authenticated session
if (
    empty($_SESSION['user_id']) ||
    empty($_SESSION['customer_id'])
) {
    json_response([
        'success' => false,
        'message' => 'Please log in to update your profile.'
    ], 401);
}

// 3. Get customer ID from authenticated session
$customerId = (int) $_SESSION['customer_id'];

// 4. Read JSON request body
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput ?: '', true);

if (!is_array($data)) {
    json_response([
        'success' => false,
        'message' => 'Invalid JSON request.'
    ], 400);
}

// 5. Prevent changes to protected fields
$protectedFields = [
    'id',
    'customer_id',
    'date_of_birth',
    'dateOfBirth',
    'ssn',
    'ssn_last4'
];

foreach ($protectedFields as $field) {
    if (array_key_exists($field, $data)) {
        json_response([
            'success' => false,
            'message' => 'You cannot update protected customer information.'
        ], 400);
    }
}

// 6. Define editable fields and maximum lengths
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

$values = [];

// 7. Validate required fields
foreach ($fields as $field => $maxLength) {

    if (
        !isset($data[$field]) ||
        !is_string($data[$field])
    ) {
        json_response([
            'success' => false,
            'message' => ucfirst($field) . ' is required.'
        ], 400);
    }

    $value = trim($data[$field]);

    if ($value === '') {
        json_response([
            'success' => false,
            'message' => ucfirst($field) . ' is required.'
        ], 400);
    }

    if (strlen($value) > $maxLength) {
        json_response([
            'success' => false,
            'message' => ucfirst($field) . ' is too long.'
        ], 400);
    }

    $values[$field] = $value;
}

// 8. Validate email
$values['email'] = strtolower($values['email']);

if (!filter_var($values['email'], FILTER_VALIDATE_EMAIL)) {
    json_response([
        'success' => false,
        'message' => 'Please enter a valid email address.'
    ], 400);
}

// 9. Validate phone
if (!preg_match('/^\+?[0-9\s().-]{7,30}$/', $values['phone'])) {
    json_response([
        'success' => false,
        'message' => 'Please enter a valid phone number.'
    ], 400);
}

// 10. Validate US ZIP code
if (!preg_match('/^\d{5}(-\d{4})?$/', $values['zipCode'])) {
    json_response([
        'success' => false,
        'message' => 'Please enter a valid ZIP code.'
    ], 400);
}

try {

    // 11. Start database transaction
    $pdo->beginTransaction();

    // 12. Lock the existing customer record
    $checkStmt = $pdo->prepare("
        SELECT id, email, phone
        FROM customers
        WHERE id = :customer_id
        LIMIT 1
        FOR UPDATE
    ");

    $checkStmt->execute([
        ':customer_id' => $customerId
    ]);

    $existingCustomer = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$existingCustomer) {
        $pdo->rollBack();

        json_response([
            'success' => false,
            'message' => 'Customer profile not found.'
        ], 404);
    }

    // 13. Check whether email or phone changed
    $emailChanged = (
        strtolower((string) $existingCustomer['email'])
        !== $values['email']
    );

    $phoneChanged = (
        (string) $existingCustomer['phone']
        !== $values['phone']
    );

    // 14. Update the existing customer only
    $updateStmt = $pdo->prepare("
        UPDATE customers SET

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
        LIMIT 1
    ");

    $updateStmt->execute([
        ':first_name' => $values['firstName'],
        ':last_name' => $values['lastName'],
        ':email' => $values['email'],
        ':phone' => $values['phone'],
        ':address' => $values['streetAddress'],
        ':city' => $values['city'],
        ':state' => $values['state'],
        ':postal_code' => $values['zipCode'],
        ':email_changed' => $emailChanged ? 1 : 0,
        ':phone_changed' => $phoneChanged ? 1 : 0,
        ':customer_id' => $customerId
    ]);

    // 15. Commit changes
    $pdo->commit();

    // 16. Return success response
    json_response([
        'success' => true,
        'message' => 'Profile updated successfully.',
        'emailVerificationRequired' => $emailChanged,
        'phoneVerificationRequired' => $phoneChanged
    ], 200);

} catch (Throwable $e) {

    // 17. Roll back if something goes wrong
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('Profile update error: ' . $e->getMessage());

    json_response([
        'success' => false,
        'message' => 'Unable to update profile. Please try again.'
    ], 500);
}
