<?php

declare(strict_types=1);

session_start();

require_once __DIR__ . '/config.php';


/*
|--------------------------------------------------------------------------
| CHECK LOGIN
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
        throw new Exception(
            'Customer account was not found.'
        );
    }


} catch (Throwable $e) {

    http_response_code(500);

    ?>

    <!DOCTYPE html>

    <html lang="en">

    <head>

        <meta charset="UTF-8">

        <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
        >

        <title>Dashboard Error</title>

        <style>

            * {
                box-sizing: border-box;
            }

            body {
                margin: 0;
                padding: 40px;

                font-family: Arial, sans-serif;

                background: #f5f5f5;
            }

            .error-box {
                max-width: 800px;

                margin: 50px auto;

                padding: 30px;

                background: white;

                border-radius: 12px;

                box-shadow:
                    0 5px 20px
                    rgba(0, 0, 0, 0.10);
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

            .back {
                display: inline-block;

                margin-top: 20px;

                padding: 12px 20px;

                background: #0b1f3a;

                color: white;

                text-decoration: none;

                border-radius: 6px;
            }

        </style>

    </head>

    <body>

        <div class="error-box">

            <h1>
                Dashboard Database Error
            </h1>

            <p>
                The dashboard could not read the customer account.
            </p>

            <pre><?= htmlspecialchars(
                $e->getMessage(),
                ENT_QUOTES,
                'UTF-8'
            ) ?></pre>

            <a
                href="login.html"
                class="back"
            >
                Back to Login
            </a>

        </div>

    </body>

    </html>

    <?php

    exit;
}


/*
|--------------------------------------------------------------------------
| PREPARE DISPLAY VALUES
|--------------------------------------------------------------------------
*/

$accountNumber =
    (string) $customer['account_number'];


$maskedAccount =
    '••••' . substr(
        $accountNumber,
        -4
    );


$fullName =
    trim(
        (string) $customer['first_name']
        . ' '
        . (string) $customer['last_name']
    );


$username =
    (string) (
        $_SESSION['username']
        ?? ''
    );


$currentBalance =
    number_format(
        (float) $customer['current_balance'],
        2
    );


$availableBalance =
    number_format(
        (float) $customer['available_balance'],
        2
    );


$accountType =
    ucfirst(
        (string) $customer['account_type']
    );


$accountStatus =
    ucfirst(
        (string) $customer['account_status']
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


        /*
        |--------------------------------------------------------------------------
        | HEADER
        |--------------------------------------------------------------------------
        */

        .header {
            background: #0b1f3a;

            color: white;

            padding: 20px 40px;

            display: flex;

            justify-content: space-between;

            align-items: center;
        }


        .logo {
            font-size: 25px;

            font-weight: bold;
        }


        .logout-button {
            border: none;

            background: #c62828;

            color: white;

            padding: 11px 20px;

            border-radius: 6px;

            cursor: pointer;

            font-size: 14px;
        }


        .logout-button:hover {
            background: #a91f1f;
        }


        /*
        |--------------------------------------------------------------------------
        | CONTAINER
        |--------------------------------------------------------------------------
        */

        .container {
            max-width: 1100px;

            margin: 40px auto;

            padding: 0 20px;
        }


        /*
        |--------------------------------------------------------------------------
        | WELCOME
        |--------------------------------------------------------------------------
        */

        .welcome {
            margin-bottom: 30px;
        }


        .welcome h1 {
            margin: 0 0 8px 0;

            font-size: 30px;
        }


        .welcome p {
            margin: 0;

            color: #666;

            font-size: 16px;
        }


        /*
        |--------------------------------------------------------------------------
        | DASHBOARD GRID
        |--------------------------------------------------------------------------
        */

        .dashboard-grid {
            display: grid;

            grid-template-columns:
                repeat(2, 1fr);

            gap: 20px;
        }


        /*
        |--------------------------------------------------------------------------
        | CARDS
        |--------------------------------------------------------------------------
        */

        .card {
            background: white;

            border-radius: 12px;

            padding: 28px;

            box-shadow:
                0 4px 15px
                rgba(0, 0, 0, 0.08);
        }


        .card h3 {
            margin: 0;

            color: #555;

            font-size: 16px;

            font-weight: normal;
        }


        /*
        |--------------------------------------------------------------------------
        | BALANCE
        |--------------------------------------------------------------------------
        */

        .balance {
            margin-top: 15px;

            font-size: 34px;

            font-weight: bold;

            color: #111;
        }


        /*
        |--------------------------------------------------------------------------
        | ACCOUNT NUMBER
        |--------------------------------------------------------------------------
        */

        .account-number {
            margin-top: 15px;

            font-size: 23px;

            font-weight: bold;

            letter-spacing: 3px;
        }


        /*
        |--------------------------------------------------------------------------
        | DETAILS
        |--------------------------------------------------------------------------
        */

        .details {
            margin-top: 15px;

            color: #555;

            line-height: 1.8;
        }


        .details p {
            margin: 5px 0;
        }


        /*
        |--------------------------------------------------------------------------
        | STATUS
        |--------------------------------------------------------------------------
        */

        .status {
            display: inline-block;

            padding: 5px 12px;

            border-radius: 20px;

            background: #e8f5e9;

            color: #2e7d32;

            font-size: 13px;

            font-weight: bold;
        }


        /*
        |--------------------------------------------------------------------------
        | MOBILE
        |--------------------------------------------------------------------------
        */

        @media (max-width: 700px) {

            .header {
                padding: 18px 20px;
            }


            .logo {
                font-size: 21px;
            }


            .container {
                margin-top: 25px;
            }


            .dashboard-grid {
                grid-template-columns: 1fr;
            }


            .welcome h1 {
                font-size: 25px;
            }


            .balance {
                font-size: 28px;
            }

        }

    </style>

</head>


<body>


    <!-- =========================================================
         HEADER
    ========================================================== -->

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


    <!-- =========================================================
         MAIN
    ========================================================== -->

    <main class="container">


        <!-- Welcome -->

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
                Online Banking Dashboard
            </p>

        </section>


        <!-- =====================================================
             DASHBOARD CARDS
        ====================================================== -->

        <section class="dashboard-grid">


            <!-- CURRENT BALANCE -->

            <div class="card">

                <h3>
                    Current Balance
                </h3>

                <div class="balance">

                    $
                    <?= htmlspecialchars(
                        $currentBalance,
                        ENT_QUOTES,
                        'UTF-8'
                    ) ?>

                </div>

            </div>


            <!-- AVAILABLE BALANCE -->

            <div class="card">

                <h3>
                    Available Balance
                </h3>

                <div class="balance">

                    $
                    <?= htmlspecialchars(
                        $availableBalance,
                        ENT_QUOTES,
                        'UTF-8'
                    ) ?>

                </div>

            </div>


            <!-- ACCOUNT INFORMATION -->

            <div class="card">

                <h3>
                    My Account
                </h3>


                <div class="account-number">

                    <?= htmlspecialchars(
                        $maskedAccount,
                        ENT_QUOTES,
                        'UTF-8'
                    ) ?>

                </div>


                <div class="details">

                    <p>

                        <strong>
                            Account Type:
                        </strong>

                        <?= htmlspecialchars(
                            $accountType,
                            ENT_QUOTES,
                            'UTF-8'
                        ) ?>

                    </p>


                    <p>

                        <strong>
                            Account Status:
                        </strong>

                        <span class="status">

                            <?= htmlspecialchars(
                                $accountStatus,
                                ENT_QUOTES,
                                'UTF-8'
                            ) ?>

                        </span>

                    </p>

                </div>

            </div>


            <!-- ONLINE BANKING -->

            <div class="card">

                <h3>
                    Online Banking
                </h3>


                <div class="account-number">

                    <?= htmlspecialchars(
                        $username,
                        ENT_QUOTES,
                        'UTF-8'
                    ) ?>

                </div>


                <div class="details">

                    <p>

                        <strong>
                            Customer:
                        </strong>

                        <?= htmlspecialchars(
                            $fullName,
                            ENT_QUOTES,
                            'UTF-8'
                        ) ?>

                    </p>


                    <p>

                        <strong>
                            Account:
                        </strong>

                        <?= htmlspecialchars(
                            $maskedAccount,
                            ENT_QUOTES,
                            'UTF-8'
                        ) ?>

                    </p>

                </div>

            </div>


        </section>

    </main>


</body>

</html>
