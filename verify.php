verify.php


<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

session_start();

require_once __DIR__ . '/config.php';


/*
|--------------------------------------------------------------------------
| ONLY POST REQUESTS
|--------------------------------------------------------------------------
*/

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {

    json_response([
        'success' => false,
        'message' => 'Method not allowed.'
    ], 405);
}


/*
|--------------------------------------------------------------------------
| READ JSON
|--------------------------------------------------------------------------
*/

$raw = file_get_contents('php://input');

if ($raw === false || trim($raw) === '') {

    json_response([
        'success' => false,
        'message' => 'Request body is empty.'
    ], 400);
}

$data = json_decode($raw, true);

if (!is_array($data)) {

    json_response([
        'success' => false,
        'message' => 'Invalid JSON request.'
    ], 400);
}


/*
|--------------------------------------------------------------------------
| GET FORM VALUES
|--------------------------------------------------------------------------
*/

$account = trim(
    (string)($data['account_number'] ?? '')
);

$ssn4 = trim(
    (string)($data['ssn_last4'] ?? '')
);

$dob = trim(
    (string)($data['date_of_birth'] ?? '')
);

$reference = trim(
    (string)($data['enrollment_reference'] ?? '')
);


/*
|--------------------------------------------------------------------------
| VALIDATION
|--------------------------------------------------------------------------
*/

if ($account === '') {

    json_response([
        'success' => false,
        'message' => 'Account number is required.'
    ], 400);
}

if (!preg_match('/^\d{4}$/', $ssn4)) {

    json_response([
        'success' => false,
        'message' => 'SSN must contain exactly 4 digits.'
    ], 400);
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dob)) {

    json_response([
        'success' => false,
        'message' => 'Invalid date of birth.'
    ], 400);
}

if ($reference === '') {

    json_response([
        'success' => false,
        'message' => 'Enrollment reference is required.'
    ], 400);
}


/*
|--------------------------------------------------------------------------
| FIND CUSTOMER
|--------------------------------------------------------------------------
*/

try {

    $sql = "
        SELECT
            id,
            account_number,
            first_name,
            last_name,
            date_of_birth,
            ssn_last4,
            enrollment_reference_hash,
            active,
            online_enrolled,
            account_status
        FROM customers
        WHERE account_number = :account_number
          AND ssn_last4 = :ssn_last4
          AND date_of_birth = :date_of_birth
          AND active = 1
          AND online_enrolled = 0
          AND account_status = 'active'
        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':account_number' => $account,
        ':ssn_last4' => $ssn4,
        ':date_of_birth' => $dob
    ]);

    $customer = $stmt->fetch();

} catch (Throwable $e) {

    error_log(
        'Customer verification query failed: ' .
        $e->getMessage()
    );

    json_response([
        'success' => false,
        'message' => 'Unable to verify customer.'
    ], 500);
}


/*
|--------------------------------------------------------------------------
| CUSTOMER NOT FOUND
|--------------------------------------------------------------------------
*/

if (!$customer) {

    usleep(250000);

    json_response([
        'success' => false,
        'message' => 'The account information could not be verified.'
    ], 401);
}


/*
|--------------------------------------------------------------------------
| VERIFY ENROLLMENT REFERENCE
|--------------------------------------------------------------------------
*/

$hash = (string)(
    $customer['enrollment_reference_hash'] ?? ''
);

if ($hash === '') {

    json_response([
        'success' => false,
        'message' => 'Enrollment reference is not configured for this customer.'
    ], 401);
}


if (!password_verify($reference, $hash)) {

    usleep(250000);

    json_response([
        'success' => false,
        'message' => 'The enrollment reference could not be verified.'
    ], 401);
}


/*
|--------------------------------------------------------------------------
| CREATE SECURE ENROLLMENT TOKEN
|--------------------------------------------------------------------------
*/

try {

    $token = bin2hex(
        random_bytes(32)
    );

} catch (Throwable $e) {

    error_log(
        'Enrollment token generation failed: ' .
        $e->getMessage()
    );

    json_response([
        'success' => false,
        'message' => 'Unable to create enrollment session.'
    ], 500);
}


/*
|--------------------------------------------------------------------------
| STORE TOKEN IN SESSION
|--------------------------------------------------------------------------
*/

$_SESSION['enrollment_token_hash'] = hash(
    'sha256',
    $token
);

$_SESSION['enrollment_customer_id'] = (int)$customer['id'];

$_SESSION['enrollment_expires'] = time() + 600;


/*
|--------------------------------------------------------------------------
| SUCCESS
|--------------------------------------------------------------------------
*/

json_response([
    'success' => true,
    'message' => 'Identity verified successfully.',
    'enrollment_token' => $token
]);
