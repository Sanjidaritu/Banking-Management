<?php

declare(strict_types=1);

session_start();

require_once __DIR__ . '/config.php';


// ======================================================
// CHECK LOGIN SESSION
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

    /*
     * TEMPORARY DEBUG MESSAGE
     *
     * This shows the real MySQL error.
     */

    http_response_code(500);

    echo '<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Dashboard Database Error</title>

        <style>
            body {
                font-family: Arial, sans-serif;
                background: #f5f5f5;
                padding: 40px;
            }

            .error {
                max-width: 900px;
                margin: auto;
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            }

            h1 {
                color: #b00020;
            }

            pre {
                background: #f1f1f1;
                padding: 20px;
                border-radius: 8px;
                white-space: pre-wrap;
                word-break: break-word;
            }

            a {
                display: inline-block;
                margin-top: 20px;
                padding: 10px 18px;
                background: #222;
                color: white;
                text-decoration: none;
                border-radius: 6px;
            }
        </style>

    </head>

    <body>

        <div class="error">

            <h1>Dashboard Database Error</h1>

            <p>
                The dashboard could not read the customer account.
            </p>

            <pre>' .
                htmlspecialchars(
                    $e->getMessage(),
                    ENT_QUOTES,
                    'UTF-8'
                )
            . '</pre>

            <a href="login.html">
                Back to Login
            </a>

        </div>

    </body>
    </html>';

    exit;
}


// ======================================================
// CUSTOMER NOT FOUND
// ======================================================

if (!$customer) {

    http_response_code(404);

    echo '<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Account Not Found</title>

        <style>
            body {
                font-family: Arial, sans-serif;
                background: #f5f5f5;
                padding: 40px;
            }

            .box {
                max-width: 700px;
                margin: auto;
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            }

            a {
                display: inline-block;
                margin-top: 20px;
                padding: 10px 18px;
                background: #222;
                color: white;
                text-decoration: none;
                border-radius: 6px;
            }
        </style>

    </head>

    <body>

        <div class="box">

            <h1>Account Not Found</h1>

            <p>
                No customer was found for customer ID:
            </p>

            <strong>' .
                htmlspecialchars(
                    (string)$customerId,
                    ENT_QUOTES,
                    'UTF-8'
                )
            . '</strong>

            <br>

            <a href="login.html">
                Back to Login
            </a>

        </div>

    </body>
    </html>';

    exit;
}


// ======================================================
// CUSTOMER DATA
// ======================================================

$username = (string)(
    $_SESSION['username'] ?? ''
);

$accountNumber = (string)(
    $customer['account_number'] ?? ''
);

$balance = (float)(
    $customer['balance'] ?? 0
);


// ======================================================
// MASK ACCOUNT NUMBER
// ======================================================

if (strlen($accountNumber) > 4) {

    $maskedAccount =
        '••••' . substr($accountNumber, -4);

} else {

    $maskedAccount = $accountNumber;

}


// ======================================================
// ESCAPE USERNAME
// ======================================================

$safeUsername = htmlspecialchars(
    $username,
    ENT_QUOTES,
    'UTF-8'
);

$safeAccount = htmlspecialchars(
    $maskedAccount,
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

    <title>
        Upright Bank Dashboard
    </title>


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


        /* ==========================================
           HEADER
        ========================================== */

        .header {

            background: #ffffff;

            padding: 20px 40px;

            border-bottom:
                1px solid #e2e2e2;

            display: flex;

            justify-content:
                space-between;

            align-items: center;
        }


        .logo {

            font-size: 25px;

            font-weight: 700;
        }


        .logout {

            display: inline-block;

            background: #222;

            color: #ffffff;

            text-decoration: none;

            padding: 11px 20px;

            border-radius: 7px;

            font-size: 14px;
        }


        .logout:hover {

            opacity: 0.85;
        }


        /* ==========================================
           MAIN
        ========================================== */

        .container {

            max-width: 1000px;

            margin:
                50px auto;

            padding:
                0 20px;
        }


        /* ==========================================
           WELCOME
        ========================================== */

        .welcome {

            margin-bottom: 30px;
        }


        .welcome h1 {

            margin:
                0 0 8px;

            font-size: 32px;
        }


        .welcome p {

            margin: 0;

            color: #666;

            font-size: 16px;
        }


        /* ==========================================
           ACCOUNT CARD
        ========================================== */

        .account-card {

            background: #ffffff;

            border-radius: 15px;

            padding: 35px;

            box-shadow:
                0 5px 25px
                rgba(0, 0, 0, 0.08);
        }


        .section-title {

            color: #777;

            font-size: 14px;

            margin-bottom: 10px;
        }


        .account-number {

            font-size: 22px;

            font-weight: 600;

            margin-bottom: 35px;
        }


        /* ==========================================
           BALANCE
        ========================================== */

        .balance-title {

            color: #777;

            font-size: 15px;

            margin-bottom: 10px;
        }


        .balance {

            font-size: 46px;

            font-weight: 700;

            letter-spacing: -1px;
        }


        .balance-description {

            margin-top: 10px;

            color: #777;

            font-size: 13px;
        }


        /* ==========================================
           MOBILE
        ========================================== */

        @media (max-width: 600px) {

            .header {

                padding:
                    18px 20px;
            }


            .logo {

                font-size: 21px;
            }


            .container {

                margin-top:
                    30px;
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
================================================== -->

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
     MAIN CONTENT
================================================== -->

<main class="container">


    <div class="welcome">

        <h1>

            Online Banking Dashboard

        </h1>


        <p>

            Welcome,
            <?php echo $safeUsername; ?>

        </p>

    </div>


    <!-- ==============================================
         ACCOUNT
    =============================================== -->

    <div class="account-card">


        <div class="section-title">

            My Account

        </div>


        <div class="account-number">

            <?php echo $safeAccount; ?>

        </div>


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


        <div class="balance-description">

            Current account balance

        </div>


    </div>


</main>


</body>

</html>
