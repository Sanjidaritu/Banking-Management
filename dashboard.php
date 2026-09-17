
<?php

declare(strict_types=1);

session_start();

require_once __DIR__ . '/config.php';

/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
*/

if (!isset($_SESSION['customer_id'])) {
    header('Location: login.html');
    exit;
}

$customerId = (int) $_SESSION['customer_id'];


/*
|--------------------------------------------------------------------------
| GET CUSTOMER DATA
|--------------------------------------------------------------------------
*/

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
        header('Location: login.html');
        exit;
    }

} catch (Throwable $e) {

    error_log(
        'Dashboard database error: ' . $e->getMessage()
    );

    header('Location: login.html');
    exit;
}


/*
|--------------------------------------------------------------------------
| PREPARE DATA FOR DISPLAY
|--------------------------------------------------------------------------
*/

$fullName = trim(
    $customer['first_name'] . ' ' .
    $customer['last_name']
);

$accountNumber = $customer['account_number'];

$maskedAccount =
    '••••' . substr($accountNumber, -4);

$currentBalance = number_format(
    (float) $customer['current_balance'],
    2
);

$availableBalance = number_format(
    (float) $customer['available_balance'],
    2
);

$accountType = ucfirst(
    $customer['account_type']
);

$accountStatus = ucfirst(
    $customer['account_status']
);

$username = $_SESSION['username'] ?? '';

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

        /* =========================================
           RESET
        ========================================= */

        * {
            box-sizing: border-box;
        }


        /* =========================================
           BODY
        ========================================= */

        body {
            margin: 0;

            font-family:
                Arial,
                Helvetica,
                sans-serif;

            background: #f4f7fb;

            color: #1f2937;
        }


        /* =========================================
           HEADER
        ========================================= */

        .header {
            background: #0b1f3a;

            color: #ffffff;

            padding: 18px 30px;

            display: flex;

            justify-content: space-between;

            align-items: center;
        }


        .logo {
            font-size: 24px;

            font-weight: 700;
        }


        .logout-button {
            background: transparent;

            border: 1px solid
                rgba(255, 255, 255, 0.5);

            color: #ffffff;

            padding: 9px 18px;

            border-radius: 6px;

            cursor: pointer;

            font-size: 14px;
        }


        .logout-button:hover {
            background:
                rgba(255, 255, 255, 0.1);
        }


        /* =========================================
           MAIN CONTAINER
        ========================================= */

        .container {
            max-width: 1100px;

            width: 100%;

            margin: 40px auto;

            padding: 0 20px;
        }


        /* =========================================
           WELCOME
        ========================================= */

        .welcome {
            margin-bottom: 25px;
        }


        .welcome h1 {
            margin: 0 0 8px;

            color: #0b1f3a;

            font-size: 30px;
        }


        .welcome p {
            margin: 0;

            color: #667085;

            font-size: 15px;
        }


        /* =========================================
           DASHBOARD GRID
        ========================================= */

        .dashboard-grid {
            display: grid;

            grid-template-columns:
                repeat(2, 1fr);

            gap: 22px;
        }


        /* =========================================
           CARD
        ========================================= */

        .card {
            background: #ffffff;

            border-radius: 14px;

            padding: 25px;

            box-shadow:
                0 5px 20px
                rgba(0, 0, 0, 0.06);
        }


        .card h2 {
            margin: 0 0 20px;

            color: #0b1f3a;

            font-size: 20px;
        }


        /* =========================================
           BALANCE CARD
        ========================================= */

        .balance-card {
            grid-column: span 2;
        }


        .balance-label {
            margin-bottom: 8px;

            color: #667085;

            font-size: 14px;
        }


        .balance {
            margin-bottom: 18px;

            color: #0b1f3a;

            font-size: 40px;

            font-weight: 700;
        }


        .available {
            color: #667085;

            font-size: 14px;
        }


        .available strong {
            color: #1f2937;
        }


        /* =========================================
           DETAIL ROW
        ========================================= */

        .detail-row {
            display: flex;

            justify-content: space-between;

            align-items: center;

            padding: 14px 0;

            border-bottom:
                1px solid #edf0f4;
        }


        .detail-row:last-child {
            border-bottom: none;
        }


        .detail-label {
            color: #667085;

            font-size: 14px;
        }


        .detail-value {
            color: #1f2937;

            font-size: 14px;

            font-weight: 600;

            text-align: right;
        }


        /* =========================================
           STATUS
        ========================================= */

        .status {
            display: inline-block;

            padding: 5px 11px;

            border-radius: 20px;

            background: #e8f5e9;

            color: #2e7d32;

            font-size: 13px;

            font-weight: 600;
        }


        /* =========================================
           FOOTER
        ========================================= */

        .footer {
            margin-top: 35px;

            padding-bottom: 25px;

            text-align: center;

            color: #98a2b3;

            font-size: 13px;
        }


        /* =========================================
           MOBILE
        ========================================= */

        @media (max-width: 700px) {

            .header {
                padding: 15px 18px;
            }


            .logo {
                font-size: 20px;
            }


            .container {
                margin-top: 25px;

                padding: 0 15px;
            }


            .dashboard-grid {
                grid-template-columns: 1fr;
            }


            .balance-card {
                grid-column: span 1;
            }


            .welcome h1 {
                font-size: 25px;
            }


            .balance {
                font-size: 32px;
            }

        }

    </style>

</head>


<body>


    <!-- =========================================
         HEADER
    ========================================== -->

    <header class="header">

        <div class="logo">
            Upright Bank
        </div>


        <form
            action="logout.php"
            method="POST"
        >

            <button
                type="submit"
                class="logout-button"
            >
                Logout
            </button>

        </form>

    </header>



    <!-- =========================================
         MAIN
    ========================================== -->

    <main class="container">


        <!-- =====================================
             WELCOME
        ====================================== -->

        <section class="welcome">

            <h1>

                Welcome,
                <?= htmlspecialchars(
                    $fullName,
                    ENT_QUOTES,
                    'UTF-8'
                ) ?>

            </h1>


            <p>
                Your online banking account overview
            </p>

        </section>



        <!-- =====================================
             DASHBOARD
        ====================================== -->

        <section class="dashboard-grid">


            <!-- =================================
                 BALANCE
            ================================== -->

            <div class="card balance-card">

                <h2>
                    Account Balance
                </h2>


                <div class="balance-label">
                    Current Balance
                </div>


                <div class="balance">

                    $
                    <?= htmlspecialchars(
                        $currentBalance,
                        ENT_QUOTES,
                        'UTF-8'
                    ) ?>

                </div>


                <div class="available">

                    Available Balance:

                    <strong>

                        $
                        <?= htmlspecialchars(
                            $availableBalance,
                            ENT_QUOTES,
                            'UTF-8'
                        ) ?>

                    </strong>

                </div>

            </div>



            <!-- =================================
                 ACCOUNT INFORMATION
            ================================== -->

            <div class="card">

                <h2>
                    Account Information
                </h2>


                <div class="detail-row">

                    <span class="detail-label">
                        Account Number
                    </span>


                    <span class="detail-value">

                        <?= htmlspecialchars(
                            $maskedAccount,
                            ENT_QUOTES,
                            'UTF-8'
                        ) ?>

                    </span>

                </div>


                <div class="detail-row">

                    <span class="detail-label">
                        Account Type
                    </span>


                    <span class="detail-value">

                        <?= htmlspecialchars(
                            $accountType,
                            ENT_QUOTES,
