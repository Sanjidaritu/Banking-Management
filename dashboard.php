<?php
declare(strict_types=1);

session_start();

require_once __DIR__ . '/config.php';

/*
|--------------------------------------------------------------------------
| Check Login Session
|--------------------------------------------------------------------------
*/

if (!isset($_SESSION['customer_id'])) {
    header('Location: login.html');
    exit;
}

$customerId = (int) $_SESSION['customer_id'];

$username = isset($_SESSION['username'])
    ? (string) $_SESSION['username']
    : '';

/*
|--------------------------------------------------------------------------
| Get Customer Information
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
            available_balance,
            email,
            phone
        FROM customers
        WHERE id = :customer_id
        LIMIT 1
    ");

    $stmt->execute([
        ':customer_id' => $customerId
    ]);

    $customer = $stmt->fetch(PDO::FETCH_ASSOC);

} catch (Throwable $e) {

    error_log('Dashboard customer query failed: ' . $e->getMessage());

    http_response_code(500);

    echo 'Unable to load account information.';
    exit;
}

/*
|--------------------------------------------------------------------------
| Customer Not Found
|--------------------------------------------------------------------------
*/

if (!$customer) {

    session_unset();
    session_destroy();

    header('Location: login.html');
    exit;
}

/*
|--------------------------------------------------------------------------
| Customer Information
|--------------------------------------------------------------------------
*/

$firstName = (string) ($customer['first_name'] ?? '');
$lastName = (string) ($customer['last_name'] ?? '');

$fullName = trim($firstName . ' ' . $lastName);

if ($fullName === '') {
    $fullName = 'Customer';
}

$accountNumber = (string) ($customer['account_number'] ?? '');

$accountType = ucfirst(
    strtolower((string) ($customer['account_type'] ?? 'checking'))
);

$accountStatus = ucfirst(
    strtolower((string) ($customer['account_status'] ?? 'active'))
);

/*
|--------------------------------------------------------------------------
| Balance
|--------------------------------------------------------------------------
*/

$currentBalance = (float) ($customer['current_balance'] ?? 0);
$availableBalance = (float) ($customer['available_balance'] ?? 0);

/*
|--------------------------------------------------------------------------
| Format Account Number
|--------------------------------------------------------------------------
*/

$lastFour = substr($accountNumber, -4);

$maskedAccountNumber = '••••' . $lastFour;

/*
|--------------------------------------------------------------------------
| Format Balances
|--------------------------------------------------------------------------
*/

$currentBalanceFormatted = number_format(
    $currentBalance,
    2,
    '.',
    ','
);

$availableBalanceFormatted = number_format(
    $availableBalance,
    2,
    '.',
    ','
);

/*
|--------------------------------------------------------------------------
| Escape Output
|--------------------------------------------------------------------------
*/

$safeFullName = htmlspecialchars(
    $fullName,
    ENT_QUOTES,
    'UTF-8'
);

$safeUsername = htmlspecialchars(
    $username,
    ENT_QUOTES,
    'UTF-8'
);

$safeAccountNumber = htmlspecialchars(
    $maskedAccountNumber,
    ENT_QUOTES,
    'UTF-8'
);

$safeAccountType = htmlspecialchars(
    $accountType,
    ENT_QUOTES,
    'UTF-8'
);

$safeAccountStatus = htmlspecialchars(
    $accountStatus,
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

    <title>Upright Bank - Dashboard</title>

    <style>

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: #f4f7fb;
            color: #1f2937;
        }

        .topbar {
            width: 100%;
            background: #123c69;
            color: #ffffff;
            padding: 18px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .bank-name {
            font-size: 24px;
            font-weight: 700;
        }

        .logout-button {
            display: inline-block;
            padding: 10px 18px;
            background: #ffffff;
            color: #123c69;
            text-decoration: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
        }

        .logout-button:hover {
            background: #eaf0f7;
        }

        .container {
            width: 100%;
            max-width: 1100px;
            margin: 40px auto;
            padding: 0 20px;
        }

        .welcome {
            margin-bottom: 30px;
        }

        .welcome h1 {
            margin: 0 0 8px 0;
            font-size: 30px;
            color: #123c69;
        }

        .welcome p {
            margin: 0;
            color: #6b7280;
            font-size: 15px;
        }

        .balance-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 25px;
        }

        .balance-card {
            background: #ffffff;
            border-radius: 10px;
            padding: 28px;
            box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
        }

        .balance-label {
            color: #6b7280;
            font-size: 15px;
            margin-bottom: 12px;
        }

        .balance-amount {
            color: #123c69;
            font-size: 34px;
            font-weight: 700;
        }

        .account-card {
            background: #ffffff;
            border-radius: 10px;
            padding: 28px;
            box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
        }

        .account-card h2 {
            margin: 0 0 25px 0;
            color: #123c69;
            font-size: 21px;
        }

        .account-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
            border-bottom: 1px solid #e5e7eb;
        }

        .account-row:last-child {
            border-bottom: none;
        }

        .account-label {
            color: #6b7280;
            font-size: 15px;
        }

        .account-value {
            color: #111827;
            font-size: 15px;
            font-weight: 600;
            text-align: right;
        }

        .status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            background: #e8f5e9;
            color: #2e7d32;
            font-size: 13px;
            font-weight: 600;
        }

        .footer {
            text-align: center;
            color: #9ca3af;
            font-size: 13px;
            margin-top: 35px;
            padding-bottom: 30px;
        }

        @media (max-width: 700px) {

            .topbar {
                padding: 16px 18px;
            }

            .bank-name {
                font-size: 20px;
            }

            .container {
                margin-top: 25px;
                padding: 0 15px;
            }

            .welcome h1 {
                font-size: 25px;
            }

            .balance-grid {
                grid-template-columns: 1fr;
            }

            .balance-card {
                padding: 22px;
            }

            .balance-amount {
                font-size: 29px;
            }

            .account-card {
                padding: 20px;
            }

            .account-row {
                gap: 15px;
            }

            .account-value {
                max-width: 55%;
            }
        }

    </style>

</head>

<body>

    <header class="topbar">

        <div class="bank-name">
            Upright Bank
        </div>

        <a
            href="logout.php"
            class="logout-button"
        >
            Logout
        </a>

    </header>


    <main class="container">

        <section class="welcome">

            <h1>
                Welcome, <?= $safeFullName ?>
            </h1>

            <p>
                Welcome to your Upright Bank online banking dashboard.
            </p>

        </section>


        <section class="balance-grid">

            <div class="balance-card">

                <div class="balance-label">
                    Current Balance
                </div>

                <div class="balance-amount">
                    $<?= $currentBalanceFormatted ?>
                </div>

            </div>


            <div class="balance-card">

                <div class="balance-label">
                    Available Balance
                </div>

                <div class="balance-amount">
                    $<?= $availableBalanceFormatted ?>
                </div>

            </div>

        </section>


        <section class="account-card">

            <h2>
                Account Information
            </h2>


            <div class="account-row">

                <div class="account-label">
                    Customer Name
                </div>

                <div class="account-value">
                    <?= $safeFullName ?>
                </div>

            </div>


            <div class="account-row">

                <div class="account-label">
                    Username
                </div>

                <div class="account-value">
                    <?= $safeUsername ?>
                </div>

            </div>


            <div class="account-row">

                <div class="account-label">
                    Account Number
                </div>

                <div class="account-value">
                    <?= $safeAccountNumber ?>
                </div>

            </div>


            <div class="account-row">

                <div class="account-label">
                    Account Type
                </div>

                <div class="account-value">
                    <?= $safeAccountType ?>
                </div>

            </div>


            <div class="account-row">

                <div class="account-label">
                    Account Status
                </div>

                <div class="account-value">

                    <span class="status">
                        <?= $safeAccountStatus ?>
                    </span>

                </div>

            </div>


        </section>


        <div class="footer">
            © <?= date('Y') ?> Upright Bank. All rights reserved.
        </div>

    </main>

</body>

</html>
