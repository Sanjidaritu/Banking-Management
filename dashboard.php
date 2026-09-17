<?php
session_start();

/*
========================================================
UPRIGHT BANK - DASHBOARD
Reads account balance directly from MySQL
========================================================
*/

// ======================================================
// DATABASE CONFIGURATION
// ======================================================

// Railway environment variables
$dbHost = getenv("MYSQLHOST");
$dbPort = getenv("MYSQLPORT");
$dbName = getenv("MYSQLDATABASE");
$dbUser = getenv("MYSQLUSER");
$dbPass = getenv("MYSQLPASSWORD");

// Fallback values if needed
if (!$dbHost) $dbHost = getenv("DB_HOST");
if (!$dbPort) $dbPort = getenv("DB_PORT");
if (!$dbName) $dbName = getenv("DB_NAME");
if (!$dbUser) $dbUser = getenv("DB_USER");
if (!$dbPass) $dbPass = getenv("DB_PASSWORD");


// ======================================================
// CONNECT TO DATABASE
// ======================================================

try {

    $pdo = new PDO(
        "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4",
        $dbUser,
        $dbPass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );

} catch (PDOException $e) {

    die("Database connection failed.");
}


// ======================================================
// GET LOGGED-IN CUSTOMER
// ======================================================

$customer = null;

/*
If your PHP login session contains customer_id,
this will use it.
*/
if (isset($_SESSION["customer_id"])) {

    $customerId = $_SESSION["customer_id"];

    $stmt = $pdo->prepare("
        SELECT
            id,
            account_number,
            balance
        FROM customers
        WHERE id = ?
        LIMIT 1
    ");

    $stmt->execute([$customerId]);

    $customer = $stmt->fetch();
}


/*
If your session contains account_number instead,
this will use that.
*/
if (!$customer && isset($_SESSION["account_number"])) {

    $accountNumber = $_SESSION["account_number"];

    $stmt = $pdo->prepare("
        SELECT
            id,
            account_number,
            balance
        FROM customers
        WHERE account_number = ?
        LIMIT 1
    ");

    $stmt->execute([$accountNumber]);

    $customer = $stmt->fetch();
}


// ======================================================
// NO SESSION
// ======================================================

if (!$customer) {

    /*
    For testing only, you can temporarily use an
    account number here.

    Example:

    $testAccount = "9001002005";

    Then uncomment the block below.
    */

    /*
    $testAccount = "9001002005";

    $stmt = $pdo->prepare("
        SELECT
            id,
            account_number,
            balance
        FROM customers
        WHERE account_number = ?
        LIMIT 1
    ");

    $stmt->execute([$testAccount]);

    $customer = $stmt->fetch();
    */
}


// ======================================================
// DISPLAY VALUES
// ======================================================

if ($customer) {

    $accountNumber = $customer["account_number"];

    $balance = (float)$customer["balance"];

    // Mask account number
    if (strlen($accountNumber) > 4) {
        $maskedAccount =
            "••••" . substr($accountNumber, -4);
    } else {
        $maskedAccount = $accountNumber;
    }

} else {

    $accountNumber = "";
    $maskedAccount = "";
    $balance = 0;
}

?>

<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

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
            background: #ffffff;
            border-bottom: 1px solid #ddd;
            padding: 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-size: 24px;
            font-weight: bold;
        }

        .container {
            max-width: 1000px;
            margin: 50px auto;
            padding: 20px;
        }

        .title {
            margin-bottom: 30px;
        }

        .title h1 {
            margin: 0 0 8px;
            font-size: 30px;
        }

        .title p {
            margin: 0;
            color: #666;
        }

        .account-card {
            background: white;
            border-radius: 14px;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            margin-bottom: 25px;
        }

        .account-label {
            color: #777;
            font-size: 14px;
            margin-bottom: 8px;
        }

        .account-number {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 30px;
        }

        .balance-label {
            color: #777;
            font-size: 15px;
            margin-bottom: 8px;
        }

        .balance {
            font-size: 42px;
            font-weight: bold;
        }

        .logout {
            display: inline-block;
            padding: 11px 20px;
            background: #222;
            color: white;
            text-decoration: none;
            border-radius: 7px;
        }

        .logout:hover {
            opacity: 0.85;
        }

        .error {
            background: #fff0f0;
            color: #b00020;
            padding: 20px;
            border-radius: 10px;
        }

    </style>

</head>

<body>

    <div class="header">

        <div class="logo">
            Upright Bank
        </div>

        <a href="login.html" class="logout">
            Logout
        </a>

    </div>


    <div class="container">

        <div class="title">

            <h1>Online Banking Dashboard</h1>

            <p>
                Welcome to your Upright Bank account.
            </p>

        </div>


        <?php if ($customer): ?>

            <div class="account-card">

                <div class="account-label">
                    Account Number
                </div>

                <div class="account-number">
                    <?php
                    echo htmlspecialchars($maskedAccount);
                    ?>
                </div>


                <div class="balance-label">
                    Available Balance
                </div>

                <div class="balance">

                    $
                    <?php
                    echo number_format($balance, 2);
                    ?>

                </div>

            </div>

        <?php else: ?>

            <div class="error">

                No account information was found.

                <br><br>

                This usually means the PHP page does not have
                the login session/customer ID.

            </div>

        <?php endif; ?>

    </div>

</body>

</html>
