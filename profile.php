
<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

session_start();

require_once __DIR__ . '/../config.php';

/*
|--------------------------------------------------------------------------
| JSON response helper
|--------------------------------------------------------------------------
*/

function profile_response(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

if (empty($_SESSION['customer_id'])) {
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

/*
|--------------------------------------------------------------------------
| GET: Retrieve customer profile
|--------------------------------------------------------------------------
*/

if ($_SERVER['REQUEST_METHOD'] === 'GET') {

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

        $customer = $stmt->fetch();

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
            'email' => $customer['email'] ?? '',
            'phone' => $customer['phone'] ?? '',
            'streetAddress' => $customer['address'] ?? '',
            'city' => $customer['city'] ?? '',
            'state' => $customer['state'] ?? '',
            'zipCode' => $customer['postal_code'] ?? '',
            'emailVerified' => (bool) $customer['email_verified'],
            'phoneVerified' => (bool) $customer['phone_verified']
        ]);

    } catch (Throwable $e) {

        error_log('Profile GET error: ' . $e->getMessage());

        profile_response([
            'success' => false,
            'message' => 'Unable to retrieve your profile.'
        ], 500);
    }
}

/*
|--------------------------------------------------------------------------
| PUT: Update customer profile
|--------------------------------------------------------------------------
*/

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {

    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '', true);

    if (!is_array($data)) {
        profile_response([
            'success' => false,
            'message' => 'Invalid JSON request.'
        ], 400);
    }

    /*
    |--------------------------------------------------------------------------
    | Read input
    |--------------------------------------------------------------------------
    */

    $firstName = trim((string) ($data['firstName'] ?? ''));
    $lastName = trim((string) ($data['lastName'] ?? ''));
    $email = strtolower(trim((string) ($data['email'] ?? '')));
    $phone = trim((string) ($data['phone'] ?? ''));
    $address = trim((string) ($data['streetAddress'] ?? ''));
    $city = trim((string) ($data['city'] ?? ''));
    $state = trim((string) ($data['state'] ?? ''));
    $zipCode = trim((string) ($data['zipCode'] ?? ''));

    /*
    |--------------------------------------------------------------------------
    | Required fields
    |--------------------------------------------------------------------------
    */

    $fields = [
        'First name' => $firstName,
        'Last name' => $lastName,
        'Email' => $email,
        'Phone' => $phone,
        'Street address' => $address,
        'City' => $city,
        'State' => $state,
        'ZIP code' => $zipCode
    ];

    foreach ($fields as $label => $value) {
        if ($value === '') {
            profile_response([
                'success' => false,
                'message' => $label . ' is required.'
            ], 400);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Maximum lengths
    |--------------------------------------------------------------------------
    */

    $lengths = [
        strlen($firstName) <= 100,
        strlen($lastName) <= 100,
        strlen($email) <= 255,
        strlen($phone) <= 30,
        strlen($address) <= 255,
        strlen($city) <= 100,
        strlen($state) <= 100,
        strlen($zipCode) <= 20
    ];

    if (in_array(false, $lengths, true)) {
        profile_response([
            'success' => false,
            'message' => 'One or more fields exceed the allowed length.'
        ], 400);
    }

    /*
    |--------------------------------------------------------------------------
    | Email validation
    |--------------------------------------------------------------------------
    */

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        profile_response([
            'success' => false,
            'message' => 'Please enter a valid email address.'
        ], 400);
    }

    /*
    |--------------------------------------------------------------------------
    | Phone validation
    |--------------------------------------------------------------------------
    */

    if (!preg_match('/^\+?[0-9\s().-]{7,30}$/', $phone)) {
        profile_response([
            'success' => false,
            'message' => 'Please enter a valid phone number.'
        ], 400);
    }

    /*
    |--------------------------------------------------------------------------
    | US ZIP validation
    |--------------------------------------------------------------------------
    */

    if (!preg_match('/^\d{5}(-\d{4})?$/', $zipCode)) {
        profile_response([
            'success' => false,
            'message' => 'Please enter a valid ZIP code.'
        ], 400);
    }

    /*
    |--------------------------------------------------------------------------
    | Database update
    |--------------------------------------------------------------------------
    */

    try {

        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            SELECT
                email,
                phone,
                email_verified,
                phone_verified
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

            profile_response([
                'success' => false,
                'message' => 'Customer profile not found.'
            ], 404);
        }

        $emailChanged =
            strtolower((string) ($existing['email'] ?? '')) !== $email;

        $phoneChanged =
            (string) ($existing['phone'] ?? '') !== $phone;

        $emailVerified = $emailChanged
            ? 0
            : (int) $existing['email_verified'];

        $phoneVerified = $phoneChanged
            ? 0
            : (int) $existing['phone_verified'];

        $update = $pdo->prepare("
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
                email_verified = :email_verified,
                phone_verified = :phone_verified
            WHERE id = :customer_id
        ");

        $update->execute([
            ':first_name' => $firstName,
            ':last_name' => $lastName,
            ':email' => $email,
            ':phone' => $phone,
            ':address' => $address,
            ':city' => $city,
            ':state' => $state,
            ':postal_code' => $zipCode,
            ':email_verified' => $emailVerified,
            ':phone_verified' => $phoneVerified,
            ':customer_id' => $customerId
        ]);

        $pdo->commit();

        profile_response([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'emailVerified' => (bool) $emailVerified,
            'phoneVerified' => (bool) $phoneVerified,
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
            'message' => 'Unable to update your profile.'
        ], 500);
    }
}

/*
|--------------------------------------------------------------------------
| Unsupported HTTP methods
|--------------------------------------------------------------------------
*/

header('Allow: GET, PUT');

profile_response([
    'success' => false,
    'message' => 'Method not allowed.'
], 405);
