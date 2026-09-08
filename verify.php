<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

session_start();

require_once __DIR__ . '/config.php';


/*
|--------------------------------------------------------------------------
| Only POST requests
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
| Read JSON
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
| Get form values
|--------------------------------------------------------------------------
*/

$account = trim((string)($data['account_number'] ?? ''));
$ssn4 = trim((string)($data['ssn_last4'] ?? ''));
$dob = trim((string)($data['date_of_birth'] ?? ''));
$reference = trim((string)($data['enrollment_reference'] ?? ''));


/*
|--------------------------------------------------------------------------
| Validate account number
|--------------------------------------------------------------------------
*/

if ($account === '') {
    json_response([
        'success' => false,
        'message' => 'Account number is required.'
    ], 400);
}


/*
|--------------------------------------------------------------------------
| Validate SSN last 4
|--------------------------------------------------------------------------
*/

if (!preg_match('/^\d{4}$/', $ssn4)) {
    json_response([
        'success' => false,
        'message' => 'SSN must contain exactly 4 digits.'
    ], 400);
}


/*
|--------------------------------------------------------------------------
| Validate date of birth
|--------------------------------------------------------------------------
*/

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dob)) {
    json_response([
        'success' => false,
        'message' => 'Invalid date of birth.'
    ], 400);
}


/*
|--------------------------------------------------------------------------
| Validate enrollment reference
|--------------------------------------------------------------------------
*/

if ($reference === '') {
    json_response([
        'success' => false,
        'message' => 'Enrollment reference is required.'
    ], 400);
}


/*
|--------------------------------------------------------------------------
| Find existing bank customer
|--------------------------------------------------------------------------
|
| The customer must:
|
| - Have the supplied account number
| - Have the supplied last 4 SSN digits
| - Have the supplied DOB
| - Be active
| - Not already be enrolled
|
*/

try {

    $sql = "
        SELECT
            id,
            account_number,
            enrollment_reference_hash
        FROM customers
        WHERE account_number = :account_number
          AND ssn_last4 = :ssn_last4
          AND date_of_birth = :date_of_birth
          AND active = 1
          AND online_enrolled = 0
        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':account_number' => $account,
        ':ssn_last4' => $ssn4,
        ':date_of_birth' => $dob
    ]);

    $customer = $stmt->fetch(PDO::FETCH_ASSOC);

} catch (Throwable $e) {

    error_log('Customer verification query failed: ' . $e->getMessage());

    json_response([
        'success' => false,
        'message' => 'Unable to verify customer.'
    ], 500);
}


/*
|--------------------------------------------------------------------------
| Customer not found
|--------------------------------------------------------------------------
*/

if (!$customer) {

    usleep(250000);

    json_response([
        'success' => false,
        'message' => 'The information could not be verified.'
    ], 401);
}


/*
|--------------------------------------------------------------------------
| Verify enrollment reference
|--------------------------------------------------------------------------
*/

$referenceHash = $customer['enrollment_reference_hash'] ?? '';

if (
    $referenceHash === '' ||
    !password_verify($reference, $referenceHash)
) {

    usleep(250000);

    json_response([
        'success' => false,
        'message' => 'The information could not be verified.'
    ], 401);
}


/*
|--------------------------------------------------------------------------
| Create temporary enrollment token
|--------------------------------------------------------------------------
*/

try {

    $token = bin2hex(random_bytes(32));

} catch (Throwable $e) {

    error_log('Token generation failed: ' . $e->getMessage());

    json_response([
        'success' => false,
        'message' => 'Unable to create enrollment session.'
    ], 500);
}


/*
|--------------------------------------------------------------------------
| Store enrollment session
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
| Successful verification
|--------------------------------------------------------------------------
*/

json_response([
    'success' => true,
    'message' => 'Identity verified successfully.',
    'enrollment_token' => $token
]);
