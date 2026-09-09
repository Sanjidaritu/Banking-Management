<?php

require_once __DIR__ . '/config.php';

$customers = [
    '9001002003' => 'ENROLL1234',
    '9001002005' => 'ENROLL9012',
    '9001002006' => 'ENROLL3456',
    '9001002007' => 'ENROLL7890',
    '9001002008' => 'ENROLL2468'
];

$stmt = $pdo->prepare("
    UPDATE customers
    SET enrollment_reference_hash = :hash
    WHERE account_number = :account
");

foreach ($customers as $account => $reference) {
    $hash = password_hash($reference, PASSWORD_DEFAULT);

    $stmt->execute([
        ':hash' => $hash,
        ':account' => $account
    ]);

    echo "Updated {$account}<br>";
}

echo "<br>All 5 customers updated.";
