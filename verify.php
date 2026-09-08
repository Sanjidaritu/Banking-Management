<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| DEBUGGING
|--------------------------------------------------------------------------
*/

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);


/*
|--------------------------------------------------------------------------
| JSON RESPONSE HEADER
|--------------------------------------------------------------------------
*/

header('Content-Type: application/json; charset=utf-8');


/*
|--------------------------------------------------------------------------
| START SESSION
|--------------------------------------------------------------------------
*/

session_start();


/*
|--------------------------------------------------------------------------
| LOAD DATABASE CONFIG
|--------------------------------------------------------------------------
*/

try {

    require_once __DIR__ . '/config.php';

} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Could not load config.php: ' . $e->getMessage()
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| CHECK REQUEST METHOD
|--------------------------------------------------------------------------
*/

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {

    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed.'
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| READ JSON REQUEST
|--------------------------------------------------------------------------
*/

try {

    $raw = file_get_contents('php://input');

    if ($raw === false || trim($raw) === '') {

        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Empty request body.'
        ]);

        exit;
    }


    $data = json_decode($raw, true);


    if (!is_array($data)) {

        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Invalid JSON request.'
        ]);

        exit;
    }


    /*
    |--------------------------------------------------------------------------
    | GET FORM DATA
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
    | VALIDATE FORM DATA
    |--------------------------------------------------------------------------
    */

    if ($account === '') {

        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Account number is required.'
        ]);

        exit;
    }


    if (!preg_match('/^\d{4}$/', $ssn4)) {

        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'SSN must contain exactly 4 digits.'
        ]);

        exit;
    }


    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dob)) {

        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Invalid date of birth.'
        ]);

        exit;
    }


    if ($reference === '') {

        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Enrollment reference is required.'
        ]);

        exit;
    }


    /*
    |--------------------------------------------------------------------------
    | FIND CUSTOMER
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare(
        'SELECT
            id,
            enrollment_reference_hash
         FROM customers
         WHERE account_number = :account
           AND ssn_last4 = :ssn4
           AND date_of_birth = :dob
           AND active = 1
           AND online_enrolled = 0
         LIMIT 1'
    );


    $stmt->execute([
        'account' => $account,
        'ssn4' => $ssn4,
        'dob' => $dob
    ]);


    $customer = $stmt->fetch(PDO::FETCH_ASSOC);


    /*
    |--------------------------------------------------------------------------
    | VERIFY CUSTOMER
    |--------------------------------------------------------------------------
    */

    if (
        !$customer ||
        empty($customer['enrollment_reference_hash']) ||
        !password_verify(
            $reference,
            $customer['enrollment_reference_hash']
        )
    ) {

        usleep(250000);

        http_response_code(401);

        echo json_encode([
            'success' => false,
            'message' => 'The information could not be verified.'
        ]);

        exit;
    }


    /*
    |--------------------------------------------------------------------------
    | CREATE ENROLLMENT TOKEN
    |--------------------------------------------------------------------------
    */

    $token = bin2hex(
        random_bytes(32)
    );


    /*
    |--------------------------------------------------------------------------
    | SAVE TOKEN IN SESSION
    |--------------------------------------------------------------------------
    */

    $_SESSION['enrollment_token_hash'] =
        hash('sha256', $token);

    $_SESSION['enrollment_customer_id'] =
        (int)$customer['id'];

    $_SESSION['enrollment_expires'] =
        time() + 600;


    /*
    |--------------------------------------------------------------------------
    | SUCCESS
    |--------------------------------------------------------------------------
    */

    echo json_encode([
        'success' => true,
        'enrollment_token' => $token
    ]);

    exit;


} catch (Throwable $e) {

    /*
    |--------------------------------------------------------------------------
    | DATABASE / PHP ERROR
    |--------------------------------------------------------------------------
    */

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'PHP ERROR: ' . $e->getMessage()
    ]);

    exit;
}
