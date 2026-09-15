<?php
session_start();

/*
|--------------------------------------------------------------------------
| Upright Bank Dashboard
|--------------------------------------------------------------------------
| This page calls the Node/Express backend.
| Change this URL only if your Railway domain is different.
|--------------------------------------------------------------------------
*/

$API_URL = "https://banking-management-production.up.railway.app";

/*
|--------------------------------------------------------------------------
| Get dashboard information from Node API
|--------------------------------------------------------------------------
*/

$ch = curl_init($API_URL . "/api/dashboard");

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_HTTPHEADER => [
        "Accept: application/json"
    ],
    CURLOPT_COOKIE => session_name() . "=" . session_id()
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$curlError = curl_error($ch);

curl_close($ch);

$data = null;
$error = null;

/*
|--------------------------------------------------------------------------
| Check API response
|--------------------------------------------------------------------------
*/

if ($response === false || $curlError) {

    $error = "Unable to connect to the banking server.";

} else {

    $data = json_decode($response, true);

    if (json_last_error() !== JSON_ERROR_NONE) {

        $error = "The banking server returned an invalid response.";

    } elseif ($httpCode >= 400) {

        $error = $data["message"] ?? "Unable to load account information.";

    } elseif (isset($data["success"]) && $data["success"] === false) {

        $error = $data["message"] ?? "Please log in again.";

    }
}

/*
|--------------------------------------------------------------------------
| Helper
|--------------------------------------------------------------------------
*/

function e($value)
{
    return htmlspecialchars((string)$value, ENT_QUOTES, "UTF-8");
}

/*
|--------------------------------------------------------------------------
| Account data
|--------------------------------------------------------------------------
*/

$firstName = "";
$accounts = [];

if ($data && empty($error)) {

    $firstName = $data["first_name"]
        ?? $data["firstName"]
        ?? "";

    $accounts = $data["accounts"]
        ?? [];
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

    <title>Upright Bank - Dashboard</title>

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
            color: #172033;
        }

        /* =====================================================
           HEADER
        ===================================================== */

        .header {
            background: #ffffff;
            border-bottom: 1px solid #e5e9f0;
            padding: 18px 40px;

            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .logo {
            font-size: 24px;
            font-weight: 700;
            color: #123c69;
        }

        .logo span {
            color: #1c78c0;
        }

        .logout-btn {
            border: none;
            background: #123c69;
            color: white;

            padding: 10px 20px;

            border-radius: 7px;

            font-size: 14px;
            font-weight: 600;

            cursor: pointer;
        }

        .logout-btn:hover {
            background: #0d2e50;
        }

        /* =====================================================
           MAIN
        ===================================================== */

        .container {
            width: 100%;
            max-width: 1100px;

            margin: 0 auto;

            padding: 40px 20px;
        }

        .welcome {
            margin-bottom: 30px;
        }

        .welcome h1 {
            margin: 0 0 8px;

            font-size: 30px;
            color: #172033;
        }

        .welcome p {
            margin: 0;

            color: #687386;
            font-size: 15px;
        }

        /* =====================================================
           ACCOUNT SECTION
        ===================================================== */

        .section-title {
            font-size: 20px;
            font-weight: 700;

            margin-bottom: 18px;
        }

        .accounts {
            display: grid;

            grid-template-columns:
                repeat(auto-fit, minmax(280px, 1fr));

            gap: 20px;
        }

        .account-card {
            background: #ffffff;

            border: 1px solid #e4e8ef;

            border-radius: 12px;

            padding: 25px;

            box-shadow:
                0 4px 15px
                rgba(20, 40, 70, 0.06);
        }

        .account-type {
            font-size: 14px;
            color: #687386;

            margin-bottom: 8px;
        }

        .account-number {
            font-size: 16px;
            font-weight: 600;

            margin-bottom: 25px;
        }

        .balance-label {
            font-size: 13px;
            color: #687386;

            margin-bottom: 5px;
        }

        .balance {
            font-size: 30px;
            font-weight: 700;

            color: #123c69;
        }

        .available {
            margin-top: 8px;

            font-size: 13px;
            color: #687386;
        }

        /* =====================================================
           ERROR
        ===================================================== */

        .error-box {
            background: #fff1f1;

            border: 1px solid #f0b5b5;

            color: #a52222;

            padding: 18px;

            border-radius: 8px;

            margin-bottom: 20px;

            line-height: 1.5;
        }

        /* =====================================================
           EMPTY
        ===================================================== */

        .empty {
            background: #ffffff;

            border: 1px solid #e4e8ef;

            border-radius: 10px;

            padding: 30px;

            color: #687386;

            text-align: center;
        }

        /* =====================================================
           FOOTER
        ===================================================== */

        footer {
            text-align: center;

            color: #8993a4;

            font-size: 13px;

            padding: 30px 20px;
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 600px) {

            .header {
                padding: 16px 20px;
            }

            .logo {
                font-size: 20px;
            }

            .container {
                padding: 30px 15px;
            }

            .welcome h1 {
                font-size: 25px;
            }

            .balance {
                font-size: 26px;
            }

        }

    </style>

</head>

<body>

<!-- =========================================================
     HEADER
========================================================= -->

<header class="header">

    <div class="logo">
        Upright <span>Bank</span>
    </div>

    <form
        action="https://banking-management-production.up.railway.app/api/logout"
        method="POST"
    >

        <button
            type="submit"
            class="logout-btn"
        >
            Logout
        </button>

    </form>

</header>


<!-- =========================================================
     MAIN
========================================================= -->

<main class="container">

    <div class="welcome">

        <h1>
            <?php if ($firstName): ?>
                Welcome, <?= e($firstName) ?>
            <?php else: ?>
                Online Banking Dashboard
            <?php endif; ?>
        </h1>

        <p>
            Manage your Upright Bank accounts securely.
        </p>

    </div>


    <?php if ($error): ?>

        <div class="error-box">

            <strong>
                Unable to load account information
            </strong>

            <br><br>

            <?= e($error) ?>

            <?php if ($httpCode): ?>

                <br>
                Server response: <?= e($httpCode) ?>

            <?php endif; ?>

        </div>

    <?php else: ?>


        <div class="section-title">
            My Account
        </div>


        <?php if (!empty($accounts)): ?>

            <div class="accounts">

                <?php foreach ($accounts as $account): ?>

                    <?php

                    $type =
                        $account["account_type"]
                        ?? $account["type"]
                        ?? "Bank Account";

                    $accountNumber =
                        $account["account_number"]
                        ?? $account["accountNumber"]
                        ?? "";

                    $masked =
                        $account["masked_account"]
                        ?? $account["maskedAccount"]
                        ?? "";

                    $currentBalance =
                        $account["current_balance"]
                        ?? $account["currentBalance"]
                        ?? $account["balance"]
                        ?? 0;

                    $availableBalance =
                        $account["available_balance"]
                        ?? $account["availableBalance"]
                        ?? $currentBalance;

                    ?>

                    <div class="account-card">

                        <div class="account-type">
                            <?= e(ucfirst($type)) ?>
                        </div>

                        <div class="account-number">

                            <?php if ($masked): ?>

                                <?= e($masked) ?>

                            <?php elseif ($accountNumber): ?>

                                ••••<?= e(substr($accountNumber, -4)) ?>

                            <?php else: ?>

                                ••••••••

                            <?php endif; ?>

                        </div>

                        <div class="balance-label">
                            Current Balance
                        </div>

                        <div class="balance">

                            $<?= number_format(
                                (float)$currentBalance,
                                2
                            ) ?>

                        </div>

                        <div class="available">

                            Available Balance:
                            <strong>
                                $<?= number_format(
                                    (float)$availableBalance,
                                    2
                                ) ?>
                            </strong>

                        </div>

                    </div>

                <?php endforeach; ?>

            </div>

        <?php else: ?>

            <div class="empty">

                No active accounts were found.

            </div>

        <?php endif; ?>


    <?php endif; ?>

</main>


<footer>

    © <?= date("Y") ?> Upright Bank.
    All rights reserved.

</footer>

</body>

</html>
