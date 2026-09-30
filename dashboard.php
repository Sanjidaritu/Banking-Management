<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

session_start();

require_once __DIR__ . '/config.php';


// ======================================================
// CHECK LOGIN SESSION
// ======================================================

if (
    !isset($_SESSION['user_id']) ||
    !isset($_SESSION['customer_id']) ||
    !isset($_SESSION['username'])
) {

    json_response([
        'success' => false,
        'message' => 'You are not logged in.'
    ], 401);

}


$customerId =
    (int) $_SESSION['customer_id'];


$username =
    (string) $_SESSION['username'];


// ======================================================
// GET CUSTOMER INFORMATION
// ======================================================

try {

    $stmt = $pdo->prepare("
        SELECT
            id,
            account_number,
            first_name,
            last_name,
            account_type,
            account_status,
            current_balance,
            available_balance
        FROM customers
        WHERE id = :customer_id
        LIMIT 1
    ");

    $stmt->execute([
        ':customer_id' => $customerId
    ]);

    $customer =
        $stmt->fetch();

} catch (Throwable $e) {

    error_log(
        'Dashboard query failed: ' .
        $e->getMessage()
    );

    json_response([
        'success' => false,
        'message' =>
            'Unable to load account information.'
    ], 500);

}


// ======================================================
// CUSTOMER NOT FOUND
// ======================================================

if (!$customer) {

    json_response([
        'success' => false,
        'message' =>
            'Customer account not found.'
    ], 404);

}


// ======================================================
// CHECK ACCOUNT STATUS
// ======================================================

if (
    $customer['account_status'] !== 'active'
) {

    json_response([
        'success' => false,
        'message' =>
            'Bank account is not active.'
    ], 403);

}


// ======================================================
// TRANSACTION REQUEST
// ======================================================

if (
    isset($_GET['transactions']) &&
    $_GET['transactions'] === '1'
) {

    $fromDate =
        isset($_GET['from_date'])
            ? trim((string) $_GET['from_date'])
            : '';

    $toDate =
        isset($_GET['to_date'])
            ? trim((string) $_GET['to_date'])
            : '';


    // ==================================================
    // VALIDATE DATES
    // ==================================================

    if (
        $fromDate !== '' &&
        !preg_match(
            '/^\d{4}-\d{2}-\d{2}$/',
            $fromDate
        )
    ) {

        json_response([
            'success' => false,
            'message' =>
                'Invalid From Date.'
        ], 400);

    }


    if (
        $toDate !== '' &&
        !preg_match(
            '/^\d{4}-\d{2}-\d{2}$/',
            $toDate
        )
    ) {

        json_response([
            'success' => false,
            'message' =>
                'Invalid To Date.'
        ], 400);

    }


    if (
        $fromDate !== '' &&
        $toDate !== '' &&
        $fromDate > $toDate
    ) {

        json_response([
            'success' => false,
            'message' =>
                'From Date cannot be after To Date.'
        ], 400);

    }


    // ==================================================
    // BUILD TRANSACTION QUERY
    // ==================================================

    $sql = "
        SELECT
            id,
            account_number,
            transaction_date,
            description,
            transaction_type,
            amount,
            balance_after
        FROM transactions
        WHERE customer_id = :customer_id
          AND account_number = :account_number
    ";


    $params = [

        ':customer_id' =>
            $customerId,

        ':account_number' =>
            $customer['account_number']

    ];


    // ==================================================
    // FROM DATE
    // ==================================================

    if ($fromDate !== '') {

        $sql .= "
            AND transaction_date >= :from_date
        ";

        $params[':from_date'] =
            $fromDate;

    }


    // ==================================================
    // TO DATE
    // ==================================================

    if ($toDate !== '') {

        $sql .= "
            AND transaction_date <= :to_date
        ";

        $params[':to_date'] =
            $toDate;

    }


    // ==================================================
    // ORDER
    // ==================================================

    $sql .= "
        ORDER BY
            transaction_date DESC,
            id DESC
    ";


    try {

        $transactionStmt =
            $pdo->prepare($sql);


        $transactionStmt->execute(
            $params
        );


        $transactions =
            $transactionStmt->fetchAll();

    } catch (Throwable $e) {

        error_log(
            'Transaction query failed: ' .
            $e->getMessage()
        );


        json_response([
            'success' => false,
            'message' =>
                'Unable to load transactions.'
        ], 500);

    }


    // ==================================================
    // RETURN TRANSACTIONS
    // ==================================================

    json_response([

        'success' => true,

        'transactions' =>
            $transactions

    ]);

}


// ======================================================
// NORMAL DASHBOARD RESPONSE
// ======================================================

json_response([

    'success' => true,

    'username' =>
        $username,

    'customer' => [

        'first_name' =>
            $customer['first_name'],

        'last_name' =>
            $customer['last_name']

    ],

    'account' => [

        'account_number' =>
            $customer['account_number'],

        'account_type' =>
            $customer['account_type'],

        'account_status' =>
            $customer['account_status'],

        'current_balance' =>
            $customer['current_balance'],

        'available_balance' =>
            $customer['available_balance']

    ]

]);
