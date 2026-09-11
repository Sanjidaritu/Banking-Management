<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';

try {

    // Only accept POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);

        echo json_encode([
            'success' => false,
            'message' => 'POST request required.'
        ]);
        exit;
    }

    // Read JSON request
    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Invalid JSON request.'
        ]);
        exit;
    }

    $account_number = trim($input['account_number'] ?? '');
    $ssn_last4 = trim($input['ssn_last4'] ?? '');
    $date_of_birth = trim($input['date_of_birth'] ?? '');
    $enrollment_reference = trim($input['enrollment_reference'] ?? '');

    // Validate required fields
    if (
        $account_number === '' ||
        $ssn_last4 === '' ||
        $date_of_birth === '' ||
        $enrollment_reference === ''
    ) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'All verification fields are required.'
        ]);
        exit;
    }

    // Find customer
    $stmt = $pdo->prepare("
        SELECT
            id,
            first_name,
            last_name,
            account_number,
            date_of_birth,
            ssn_last4,
            enrollment_reference_hash,
            active,
            online_enrolled,
            account_type,
            account_status
        FROM customers
        WHERE account_number = ?
        LIMIT 1
    ");

    $stmt->execute([$account_number]);

    $customer = $stmt->fetch(PDO::FETCH_ASSOC);

    // Customer not found
    if (!$customer) {
        http_response_code(401);

        echo json_encode([
            'success' => false,
            'message' => 'Account information could not be verified.'
        ]);
        exit;
    }

    // Account must be active
    if (
        (int)$customer['active'] !== 1 ||
        $customer['account_status'] !== 'active'
    ) {
        http_response_code(403);

        echo json_encode([
            'success' => false,
            'message' => 'This bank account is not active.'
        ]);
        exit;
    }

    // Only checking or savings accounts
    if (
        $customer['account_type'] !== 'checking' &&
        $customer['account_type'] !== 'savings'
    ) {
        http_response_code(403);

        echo json_encode([
            'success' => false,
            'message' => 'This account is not eligible for online banking enrollment.'
        ]);
        exit;
    }

    // Check SSN last 4
    if (!hash_equals(
        (string)$customer['ssn_last4'],
        (string)$ssn_last4
    )) {
        http_response_code(401);

        echo json_encode([
            'success' => false,
            'message' => 'Account information could not be verified.'
        ]);
        exit;
    }

    // Check DOB
    if ($customer['date_of_birth'] !== $date_of_birth) {
        http_response_code(401);

        echo json_encode([
            'success' => false,
            'message' => 'Account information could not be verified.'
        ]);
        exit;
    }

    // Check enrollment reference
    if (
        empty($customer['enrollment_reference_hash']) ||
        !password_verify(
            $enrollment_reference,
            $customer['enrollment_reference_hash']
        )
    ) {
        http_response_code(401);

        echo json_encode([
            'success' => false,
            'message' => 'Account information could not be verified.'
        ]);
        exit;
    }

    // Already enrolled
    if ((int)$customer['online_enrolled'] === 1) {
        http_response_code(409);

        echo json_encode([
            'success' => false,
            'message' => 'This account is already enrolled in online banking.'
        ]);
        exit;
    }

    // Verification successful
    echo json_encode([
        'success' => true,
        'message' => 'Identity verified successfully.',
        'customer' => [
            'id' => (int)$customer['id'],
            'first_name' => $customer['first_name'],
            'last_name' => $customer['last_name'],
            'account_number' => $customer['account_number'],
            'account_type' => $customer['account_type']
        ]
    ]);

} catch (Throwable $e) {

    error_log('verify.php error: ' . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Server error while verifying account.'
    ]);
}
