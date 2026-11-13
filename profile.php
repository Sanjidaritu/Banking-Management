
<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

session_start();

require_once __DIR__ . '/config.php';

/**
 * Return JSON response and stop execution.
 */
function profile_response(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

/**
 * Check login session.
 */
if (!isset($_SESSION['customer_id'])) {
    profile_response([
        'success' => false,
        'message' => 'Please log in to access your profile.'
    ], 401);
}

$customerId = (int) $_SESSION['customer_id'];

if ($customerId <= 0) {
    profile_response([
        'success' => false,
        'message' => 'Invalid customer session.'
    ], 401);
}

$method = $_SERVER['REQUEST_METHOD'];

/**
 * GET: Retrieve customer profile.
 */
if ($method === 'GET') {

    try {
        $stmt = $pdo->prepare("
            SELECT
                first_name,
                last_name,
                date_of_birth,
                ssn_last4,
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
            profile_response([
                'success' => false,
                'message' => 'Customer profile not found.'
            ], 404);
        }

        profile_response([
            'success' => true,
            'firstName' => $customer['first_name'],
            'lastName' => $customer['last_name'],
            'dateOfBirth' => $customer['date_of_birth'],
            'ssnLast4' => $customer['ssn_last4'],
            'email' => $customer['email'],
            'phone' => $customer['phone'],
            'streetAddress' => $customer['address'],
            'city' => $customer['city'],
            'state' => $customer['state'],
            'zipCode' => $customer['postal_code'],
            'emailVerified' => (bool) $customer['email_verified'],
            'phoneVerified' => (bool) $customer['phone_verified']
        ]);

    } catch (Throwable $e) {

        error_log('Profile GET error: ' . $e->getMessage());

        profile_response([
            'success' => false,
            'message' => 'Unable to load customer profile.'
        ], 500);
    }
}

/**
 * PUT: Update customer profile.
 */
if ($method === 'PUT') {

    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput ?: '', true);

    if (!is_array($data)) {
        profile_response([
            'success' => false,
            'message' => 'Invalid JSON request.'
        ], 400);
    }

    // Collect editable fields.
    $firstName = trim((string) ($data['firstName'] ?? ''));
    $lastName = trim((string) ($data['lastName'] ?? ''));
    $email = strtolower(trim((string) ($data['email'] ?? '')));
    $phone = trim((string) ($data['phone'] ?? ''));
    $address = trim((string) ($data['streetAddress'] ?? ''));
    $city = trim((string) ($data['city'] ?? ''));
    $state = trim((string) ($data['state'] ?? ''));
    $zipCode = trim((string) ($data['zipCode'] ?? ''));

    // Required field validation.
    if (
        $firstName === '' ||
        $lastName === '' ||
        $email === '' ||
        $phone === '' ||
        $address === '' ||
        $city === '' ||
        $state === '' ||
        $zipCode === ''
    ) {
        profile_response([
            'success' => false,
            'message' => 'Please complete all required fields.'
        ], 400);
    }

    // Length validation.
    if (
        strlen($firstName) > 100 ||
        strlen($lastName) > 100 ||
        strlen($email) > 255 ||
        strlen($phone) > 30 ||
        strlen($address) > 255 ||
        strlen($city) > 100 ||
        strlen($state) > 100 ||
        strlen($zipCode) > 20
    ) {
        profile_response([
            'success' => false,
            'message' => 'One or more fields exceed the allowed length.'
        ], 400);
    }

    // Email validation.
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        profile_response([
            'success' => false,
            'message' => 'Please enter a valid email address.'
        ], 400);
    }

    // Phone validation.
    if (!preg_match('/^\+?[0-9\s().-]{7,30}$/', $phone)) {
        profile_response([
            'success' => false,
            'message' => 'Please enter a valid phone number.'
        ], 400);
    }

    // US ZIP code validation.
    if (!preg_match('/^\d{5}(-\d{4})?$/', $zipCode)) {
        profile_response([
            'success' => false,
            'message' => 'Please enter a valid ZIP code.'
        ], 400);
    }

    try {

        $pdo->beginTransaction();

        // Lock the existing customer record.
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

        $existingCustomer = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$existingCustomer) {
            $pdo->rollBack();

            profile_response([
                'success' => false,
                'message' => 'Customer profile not found.'
            ], 404);
        }

        // Check whether email or phone has changed.
        $emailChanged = strtolower(trim((string) $existingCustomer['email'])) !== $email;
        $phoneChanged = trim((string) $existingCustomer['phone']) !== $phone;

        // Reset verification status when contact details change.
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
            ':first_name' => $firstName,
            ':last_name' => $lastName,
            ':email' => $email,
            ':phone' => $phone,
            ':address' => $address,
            ':city' => $city,
            ':state' => $state,
            ':postal_code' => $zipCode,
            ':email_changed' => $emailChanged ? 1 : 0,
            ':phone_changed' => $phoneChanged ? 1 : 0,
            ':customer_id' => $customerId
        ]);

        $pdo->commit();

        profile_response([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'emailVerified' => !$emailChanged,
            'phoneVerified' => !$phoneChanged,
            'emailVerificationRequired' => $emailChanged,
            'phoneVerificationRequired' => $phoneChanged
        ], 200);

    } catch (Throwable $e) {

        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        error_log('Profile PUT error: ' . $e->getMessage());

        profile_response([
            'success' => false,
            'message' => 'Unable to update customer profile.'
        ], 500);
    }
}

/**
 * Unsupported HTTP methods.
 */
header('Allow: GET, PUT');

profile_response([
    'success' => false,
    'message' => 'Method not allowed.'
], 405);
