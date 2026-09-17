<?php

declare(strict_types=1);

session_start();

require_once __DIR__ . '/config.php';


// ======================================================
// CHECK LOGIN
// ======================================================

if (!isset($_SESSION['customer_id'])) {
    header('Location: login.html');
    exit;
}

$customerId = (int) $_SESSION['customer_id'];


// ======================================================
// GET CUSTOMER INFORMATION
// ======================================================

try {

    $stmt = $pdo->prepare("
        SELECT
            id,
            account_number,
            balance
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
        'Dashboard query failed: ' . $e->getMessage()
    );

    die('Unable to load account information.');
}


// ======================================================
// CUSTOMER NOT FOUND
// ======================================================

if (!$customer) {
    die('Customer account was not found.');
}


// ======================================================
// VALUES
// ======================================================

$username = (string)($_SESSION['username'] ?? '');

$accountNumber = (string)$customer['account_number'];

$balance = (float)$customer['balance'];


// ======================================================
// MASK ACCOUNT NUMBER
// ======================================================

if (strlen($accountNumber) > 4) {

    $maskedAccount =
        '••••' . substr($accountNumber, -4);

} else {

    $maskedAccount = $accountNumber;

}

?>

<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Upright Bank Dashboard</title>

    <style>

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: #f4f7fb;
            color: #222;
        }

        .header {
            background: white;
            padding: 20px 40px;
            border-bottom: 1px solid #ddd;

            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-size: 24px;
            font-weight: bold;
        }

        .logout {
            background: #222;
            color: white;
            text-decoration: none;
            padding: 10px 18px;
            border-radius: 6px;
        }

        .container {
            max-width: 1000px;
            margin: 50px auto;
            padding: 20px;
        }

        h1 {
            margin-bottom: 5px;
        }

        .welcome {
            color: #666;
            margin-bottom: 30px;
        }

        .card {
            background: white;
            padding: 35px;
            border-radius: 15px;

            box-shadow:
                0 5px 25px rgba(0, 0, 0, 0.08);
        }

        .label {
            color: #777;
            font-size: 14px;
            margin-bottom: 8px;
        }

        .account {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 35px;
        }

        .balance {
            font-size: 45px;
            font-weight: bold;
        }

    </style>

</head>

<body>


<header class="header">

    <div class="logo">
        Upright Bank
    </div>

    <a
        href="logout.php"
        class="logout"
    >
        Logout
    </a>

</header>


<main class="container">

    <h1>
        Online Banking Dashboard
    </h1>

    <div class="welcome">

        Welcome,
        <?php
        echo htmlspecialchars(
            $username,
            ENT_QUOTES,
            'UTF-8'
        );
        ?>

    </div>


    <div class="card">

        <div class="label">
            My Account
        </div>

        <div class="account">

            <?php
            echo htmlspecialchars(
                $maskedAccount,
                ENT_QUOTES,
                'UTF-8'
            );
            ?>

        </div>


        <div class="label">
            Available Balance
        </div>

        <div class="balance">

            $
            <?php
            echo number_format($balance, 2);
            ?>

        </div>

    </div>

</main>

</body>

</html>
