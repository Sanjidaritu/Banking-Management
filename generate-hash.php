<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

$customers = [
    '9001002003' => 'ENROLL1234',
    '9001002005' => 'ENROLL9012',
    '9001002006' => 'ENROLL3456',
    '9001002007' => 'ENROLL7890',
    '9001002008' => 'ENROLL2468'
];

$sql = "
    UPDATE customers
    SET enrollment_reference_hash = :hash
    WHERE account_number = :account
";

$stmt = $pdo->prepare($sql);

foreach ($customers as $account => $reference) {

    $hash = password_hash(
        $reference,
        PASSWORD_DEFAULT
    );

    $stmt->execute([
        ':hash' => $hash,
        ':account' => $account
    ]);

    echo "Updated {$account}<br>";
}

echo "<br>All enrollment references have been hashed successfully.";
