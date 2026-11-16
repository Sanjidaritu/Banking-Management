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

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    json_response([
        'success' => false,
        'message' => 'Method not allowed.'
    ], 405);
}

if (empty($_SESSION['customer_id'])) {
    json_response([
        'success' => false,
        'message' => 'Please log in to update your profile.'
    ], 401);
}

$data = json_decode(file_get_contents('php://input') ?: '', true);

if (!is_array($data)) {
    json_response([
        'success' => false,
        'message' => 'Invalid request data.'
    ], 400);
}

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

foreach ($fields as $field => $maxLength) {
    if (!isset($data[$field]) || !is_string($data[$field])) {
        json_response([
            'success' => false,
            'message' => ucfirst($field) . ' is required.'
        ], 400);
    }

    $value = trim($data[$field]);

    if ($value === '' || strlen($value) > $maxLength) {
        json_response([
            'success' => false,
            'message' => 'Invalid ' . $field . '.'
        ], 400);
    }

    $values[$field] = $value;
}

$values['email'] = strtolower($values['email']);

if (!filter_var($values['email'], FILTER_VALIDATE_EMAIL)) {
    json_response([
        'success' => false,
        'message' => 'Invalid email address.'
    ], 400);
}

if (!preg_match('/^\+?[0-9\s().-]{7,30}$/', $values['phone'])) {
    json_response([
        'success' => false,
        'message' => 'Invalid phone number.'
    ], 400);
}

if (!preg_match('/^\d{5}(-\d{4})?$/', $values['zipCode'])) {
    json_response([
        'success' => false,
        'message' => 'Invalid ZIP code.'
    ], 400);
}

$customerId = (int) $_SESSION['customer_id'];

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        SELECT email, phone
        FROM customers
        WHERE id = :customer_id
        FOR UPDATE
    ");

    $stmt->execute([
        ':customer_id' => $customerId
    ]);

    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        $pdo->rollBack();

        json_response([
            'success' => false,
            'message' => 'Customer profile not found.'
        ], 404);
    }

    $emailChanged = strtolower((string) $existing['email']) !== $values['email'];
    $phoneChanged = (string) $existing['phone'] !== $values['phone'];

    $stmt = $pdo->prepare("
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

    $stmt->execute([
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

    error_log('Update profile error: ' . $e->getMessage());

    json_response([
        'success' => false,
        'message' => 'Unable to update profile.'
    ], 500);
}
