
<?php

declare(strict_types=1);

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

session_start();

try {

    // IMPORTANT:
    // If config.php is in your PROJECT ROOT, use ../../config.php
    require_once __DIR__ . '/../../config.php';

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);

        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed.'
        ]);
        exit;
    }

    $raw = file_get_contents('php://input');

    $data = json_decode($raw, true);

    if (!is_array($data)) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Invalid JSON request.'
        ]);
        exit;
    }

    $account = trim((string)($data['account_number'] ?? ''));
    $ssn4 = trim((string)($data['ssn_last4'] ?? ''));
    $dob = trim((string)($data['date_of_birth'] ?? ''));
    $reference = trim((string)($data['enrollment_reference'] ?? ''));

    if (
        $account === '' ||
        !preg_match('/^\d{4}$/', $ssn4) ||
        !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dob) ||
        $reference === ''
    ) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'The information could not be verified.'
        ]);
        exit;
    }

    $stmt = $pdo->prepare(
        'SELECT id, enrollment_reference_hash
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

    if (
        !$customer ||
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

    $token = bin2hex(random_bytes(32));

    $_SESSION['enrollment_token_hash'] =
        hash('sha256', $token);

    $_SESSION['enrollment_customer_id'] =
        (int) $customer['id'];

    $_SESSION['enrollment_expires'] =
        time() + 600;

    echo json_encode([
        'success' => true,
        'enrollment_token' => $token
    ]);

} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'PHP ERROR: ' . $e->getMessage()
    ]);

    exit;
}
