<?php
/**
 * Horizon Bank
 * Online Banking Enrollment
 *
 * Frontend enrollment page.
 *
 * IMPORTANT:
 * - Sensitive verification must happen server-side.
 * - Do not trust JavaScript for account/SSN/DOB verification.
 * - Passwords must be hashed server-side.
 */

// Start session
session_start();

// Page title
$page_title = "Enroll in Online Banking | Horizon Bank";

// Current year
$current_year = date('Y');
?>

<!DOCTYPE html>
<html lang="en">
<head>

    <meta charset="UTF-8">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title><?= htmlspecialchars($page_title, ENT_QUOTES, 'UTF-8'); ?></title>

    <!-- Your CSS -->
    <style>
        /* Put your existing CSS here */
    </style>

</head>

<body>

    <!-- =========================
         HEADER
    ========================== -->
    <header>
        <!-- Your header/logo/navigation -->
    </header>


    <!-- =========================
         MAIN CONTENT
    ========================== -->
    <main>

        <!-- Your registration/enrollment HTML goes here -->

    </main>


    <!-- =========================
         FOOTER
    ========================== -->
    <footer>
        <p>
            &copy; <?= $current_year; ?> Horizon Bank. All rights reserved.
        </p>
    </footer>


    <!-- =========================
         JAVASCRIPT
    ========================== -->

    <script src="register.js"></script>

</body>
</html>
