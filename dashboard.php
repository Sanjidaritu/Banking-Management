<?php

declare(strict_types=1);

session_start();

require_once __DIR__ . '/config.php';

/*
========================================================
UPRIGHT BANK - ONLINE BANKING DASHBOARD
========================================================
*/


// ======================================================
// CHECK LOGIN SESSION
// ======================================================

if (!isset($_SESSION['customer_id'])) {
    header('Location: login.html');
    exit;
}

$customerId = (int) $_SESSION['customer_id'];


// ======================================================
// GET CUSTOMER ACCOUNT INFORMATION
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

    $customer = false;
}


// ======================================================
// CUSTOMER NOT FOUND
// ======================================================

if (!$customer) {

    $accountNumber = 'N/A';
    $balance = 0;

} else {

    $accountNumber =
        (string)($customer['account_number'] ?? 'N/A');

    $balance =
        (float)($customer['balance'] ?? 0);

}


// ======================================================
// MASK ACCOUNT NUMBER
// ======================================================

if (
    $accountNumber !== 'N/A' &&
    strlen($accountNumber) > 4
) {

    $maskedAccount =
        '••••' . substr($accountNumber, -4);

} else {

    $maskedAccount = $accountNumber;
}


// ======================================================
// USERNAME
// ======================================================

$username =
    htmlspecialchars(
        (string)($_SESSION['username'] ?? ''),
        ENT_QUOTES,
        'UTF-8'
    );

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
            font-family:
                Arial,
                Helvetica,
                sans-serif;

            background: #f4f7fb;
            color: #222;
        }

        /* =============================================
           HEADER
        ============================================= */

        .header {
            width: 100%;
            background: #ffffff;

            padding: 20px 40px;

            display: flex;
            align-items: center;
            justify-content: space-between;

            border-bottom: 1px solid #e5e5e5;
        }

        .logo {
            font-size: 25px;
            font-weight: 700;
        }

        .logout {
            display: inline-block;

            padding: 11px 20px;

            background: #222;
            color: #ffffff;

            text-decoration: none;

            border-radius: 7px;

            font-size: 14px;
        }

        .logout:hover {
            opacity: 0.85;
        }


        /* =============================================
           MAIN CONTAINER
        ============================================= */

        .container {
            width: 100%;
            max-width: 1000px;

            margin: 45px auto;

            padding: 0 20px;
        }


        /* =============================================
           WELCOME
        ============================================= */

        .welcome {
            margin-bottom: 30px;
        }

        .welcome h1 {
            margin: 0 0 8px;

            font-size: 32px;
        }

        .welcome p {
            margin: 0;

            color: #666;

            font-size: 16px;
        }


        /* =============================================
           ACCOUNT CARD
        ============================================= */

        .account-card {

            background: #ffffff;

            border-radius: 15px;

            padding: 32px;

            box-shadow:
                0 5px 25px
                rgba(0, 0, 0, 0.08);
        }


        /* =============================================
           ACCOUNT NUMBER
        ============================================= */

        .account-title {

            color: #777;

            font-size: 14px;

            margin-bottom: 8px;
        }

        .account-number {

            font-size: 22px;

            font-weight: 600;

            margin-bottom: 35px;
        }


        /* =============================================
           BALANCE
        ============================================= */

        .balance-title {

            color: #777;

            font-size: 15px;

            margin-bottom: 8px;
        }

        .balance {

            font-size: 44px;

            font-weight: 700;

            margin-bottom: 10px;
        }

        .balance-note {

            color: #777;

            font-size: 13px;
        }


        /* =============================================
           ERROR
        ============================================= */

        .error {

            background: #fff1f1;

            border: 1px solid #ffd0d0;

            color: #b00020;

            padding: 20px;

            border-radius: 10px;
        }


        /* =============================================
           MOBILE
        ============================================= */

        @media (max-width: 600px) {

            .header {
                padding: 18px 20px;
            }

            .logo {
                font-size: 21px;
            }

            .container {
                margin-top: 30px;
            }

            .welcome h1 {
                font-size: 26px;
            }

            .account-card {
                padding: 25px;
            }

            .balance {
                font-size: 36px;
            }

        }

    </style>

</head>


<body>


<!-- ==================================================
     HEADER
=================================================== -->

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


<!-- ==================================================
     MAIN
=================================================== -->

<main class="container">


    <!-- WELCOME -->

    <div class="welcome">

        <h1>
            Online Banking Dashboard
        </h1>

        <p>
            Welcome,
            <?php echo $username; ?>
        </p>

    </div>


    <?php if ($customer): ?>


        <!-- ==========================================
             ACCOUNT CARD
        =========================================== -->

        <div class="account-card">


            <!-- ACCOUNT NUMBER -->

            <div class="account-title">
                My Account
            </div>

            <div class="account-number">

                <?php
                echo htmlspecialchars(
                    $maskedAccount,
                    ENT_QUOTES,
                    'UTF-8'
                );
                ?>

            </div>


            <!-- BALANCE -->

            <div class="balance-title">
                Available Balance
            </div>

            <div class="balance">

                $
                <?php
                echo number_format(
                    $balance,
                    2
                );
                ?>

            </div>

            <div class="balance-note">
                Current account balance
            </div>


        </div>


    <?php else: ?>


        <!-- ==========================================
             CUSTOMER NOT FOUND
        =========================================== -->

        <div class="error">

            Account information could not be found.

        </div>


    <?php endif; ?>


</main>


</body>

</html>
