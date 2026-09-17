<?php

declare(strict_types=1);

session_start();

require_once __DIR__ . '/config.php';

echo "<h2>Dashboard Diagnostic</h2>";

echo "<p><strong>PHP:</strong> Working</p>";

echo "<p><strong>Session customer_id:</strong> ";
var_dump($_SESSION['customer_id'] ?? 'NOT SET');
echo "</p>";

echo "<p><strong>Session username:</strong> ";
var_dump($_SESSION['username'] ?? 'NOT SET');
echo "</p>";

echo "<hr>";

if (!isset($_SESSION['customer_id'])) {

    echo "<h3 style='color:red;'>PROBLEM: customer_id is not in the session.</h3>";

    exit;
}

$customerId = (int) $_SESSION['customer_id'];

echo "<p><strong>Customer ID being searched:</strong> ";
echo htmlspecialchars((string)$customerId);
echo "</p>";

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

    $customer = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$customer) {

        echo "<h3 style='color:red;'>
            PROBLEM: No customer was found with id = {$customerId}
        </h3>";

        echo "<p>This means login.php is putting a customer ID into the session, but that ID does not exist in the customers table.</p>";

        exit;
    }

    echo "<h3 style='color:green;'>DATABASE CONNECTION: WORKING</h3>";

    echo "<h3>Customer found:</h3>";

    echo "<pre>";
    print_r($customer);
    echo "</pre>";

} catch (Throwable $e) {

    echo "<h3 style='color:red;'>DATABASE ERROR</h3>";

    echo "<pre>";
    echo htmlspecialchars(
        $e->getMessage(),
        ENT_QUOTES,
        'UTF-8'
    );
    echo "</pre>";

    exit;
}
