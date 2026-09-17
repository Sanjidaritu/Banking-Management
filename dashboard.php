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


$customerId = (int)$_SESSION['customer_id'];

$username = (string)$_SESSION['username'];


// ======================================================
// GET CUSTOMER INFORMATION AND BALANCE
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

    $customer = $stmt->fetch();

} catch (Throwable $e) {

    error_log(
        'Dashboard query failed: ' .
        $e->getMessage()
    );

    json_response([
        'success' => false,
        'message' => 'Unable to load account information.'
    ], 500);
}


// ======================================================
// CUSTOMER NOT FOUND
// ======================================================

if (!$customer) {

    json_response([
        'success' => false,
        'message' => 'Customer account not found.'
    ], 404);
}


// ======================================================
// CHECK ACCOUNT STATUS
// ======================================================

if ($customer['account_status'] !== 'active') {

    json_response([
        'success' => false,
        'message' => 'Bank account is not active.'
    ], 403);
}


// ======================================================
// RETURN DASHBOARD DATA
// ======================================================

json_response([

    'success' => true,

    'username' => $username,

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

        'current_balance' =>
            $customer['current_balance'],

        'available_balance' =>
            $customer['available_balance']

    ]

]);
