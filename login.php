<?php
/**
 * Horizon Bank
 * Online Banking Login
 */

$page_title = "Sign In | Horizon Bank";
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
        <?= htmlspecialchars($page_title, ENT_QUOTES, 'UTF-8'); ?>
    </title>

    <link rel="preconnect" href="https://fonts.googleapis.com">

    <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossorigin
    >

    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
    >

    <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
    >

    <style>

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --navy: #062b49;
            --dark-navy: #041f35;
            --blue: #0877bd;
            --light-blue: #eaf5fb;
            --border: #d8e1e8;
            --text: #17324d;
            --muted: #647789;
            --white: #ffffff;
            --green: #198754;
            --light-green: #eaf7f0;
            --red: #c62828;
            --light-red: #fff1f1;
            --background: #f5f8fa;
        }

        body {
            font-family: "Inter", Arial, sans-serif;
            background: var(--background);
            color: var(--text);
            min-height: 100vh;
            line-height: 1.5;
        }

        /* ================================
           TOP BAR
        ================================= */

        .top-bar {
            background: var(--dark-navy);
            color: white;
            font-size: 13px;
        }

        .top-container {
            max-width: 1200px;
            margin: auto;
            padding: 0 24px;
            height: 40px;

            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .top-left,
        .top-right {
            display: flex;
            align-items: center;
            gap: 22px;
        }

        .top-bar a {
            color: #d9e5ee;
            text-decoration: none;
        }

        .top-bar a:hover {
            color: white;
        }

        .top-right i {
            margin-right: 5px;
        }

        /* ================================
           HEADER
        ================================= */

        .main-header {
            background: white;
            border-bottom: 1px solid var(--border);
        }

        .nav-container {
            max-width: 1200px;
            margin: auto;
            padding: 18px 24px;

            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;

            color: var(--navy);
            text-decoration: none;
        }

        .logo-icon {
            width: 46px;
            height: 46px;

            border-radius: 8px;

            background: var(--navy);
            color: white;

            display: flex;
            justify-content: center;
            align-items: center;

            font-size: 21px;
        }

        .logo span {
            display: block;

            font-size: 20px;
            font-weight: 800;
            letter-spacing: 2px;
        }

        .logo small {
            display: block;

            font-size: 10px;
            font-weight: 600;
            letter-spacing: 4px;

            color: var(--muted);
        }

        .header-security {
            display: flex;
            align-items: center;
            gap: 8px;

            color: var(--green);

            font-size: 14px;
            font-weight: 600;
        }

        /* ================================
           LOGIN PAGE
        ================================= */

        .login-page {
            max-width: 1100px;
            margin: auto;

            min-height: calc(100vh - 180px);

            padding: 60px 24px;

            display: flex;
            justify-content: center;
            align-items: flex-start;
        }

        .login-card {
            width: 100%;
            max-width: 480px;

            background: white;

            border: 1px solid var(--border);

            border-radius: 12px;

            box-shadow: 0 10px 35px rgba(0, 35, 60, 0.08);

            overflow: hidden;
        }

        /* ================================
           LOGIN HEADER
        ================================= */

        .login-header {
            text-align: center;

            padding: 38px 40px 28px;
        }

        .login-icon {
            width: 64px;
            height: 64px;

            margin: 0 auto 18px;

            border-radius: 50%;

            background: var(--light-blue);
            color: var(--blue);

            display: flex;
            justify-content: center;
            align-items: center;

            font-size: 25px;
        }

        .login-header .label {
            display: block;

            margin-bottom: 7px;

            color: var(--blue);

            font-size: 11px;
            font-weight: 800;

            letter-spacing: 2px;
        }

        .login-header h1 {
            color: var(--navy);

            font-size: 28px;
            font-weight: 800;

            margin-bottom: 8px;
        }

        .login-header p {
            color: var(--muted);

            font-size: 13px;
        }

        /* ================================
           LOGIN BODY
        ================================= */

        .login-body {
            padding: 0 40px 38px;
        }

        .form-group {
            margin-bottom: 21px;
        }

        .form-group label {
            display: block;

            margin-bottom: 8px;

            color: var(--text);

            font-size: 13px;
            font-weight: 700;
        }

        .input-wrapper {
            position: relative;
        }

        .input-wrapper > i:first-child {
            position: absolute;

            left: 15px;
            top: 50%;

            transform: translateY(-50%);

            color: #7d8d99;

            font-size: 15px;

            pointer-events: none;
        }

        .input-wrapper input {
            width: 100%;
            height: 50px;

            padding: 0 48px 0 45px;

            border: 1px solid var(--border);

            border-radius: 7px;

            background: white;

            color: var(--text);

            font-family: inherit;
            font-size: 14px;

            outline: none;

            transition: 0.2s;
        }

        .input-wrapper input:focus {
            border-color: var(--blue);

            box-shadow: 0 0 0 3px rgba(8, 119, 189, 0.10);
        }

        .input-wrapper input::placeholder {
            color: #9aa8b3;
        }

        .input-action {
            position: absolute;

            right: 14px;
            top: 50%;

            transform: translateY(-50%);

            border: none;
            background: none;

            color: #71808d;

            cursor: pointer;

            font-size: 15px;
        }

        .input-action:hover {
            color: var(--blue);
        }

        /* ================================
           LOGIN OPTIONS
        ================================= */

        .login-options {
            display: flex;

            justify-content: space-between;
            align-items: center;

            margin: 5px 0 24px;
        }

        .remember-me {
            display: flex;
            align-items: center;
            gap: 7px;

            color: var(--muted);

            font-size: 12px;
        }

        .remember-me input {
            width: 15px;
            height: 15px;

            accent-color: var(--blue);
        }

        .forgot-password {
            color: var(--blue);

            text-decoration: none;

            font-size: 12px;
            font-weight: 600;
        }

        .forgot-password:hover {
            text-decoration: underline;
        }

        /* ================================
           ERROR
        ================================= */

        .login-error {
            display: none;

            align-items: flex-start;
            gap: 10px;

            padding: 13px;

            margin-bottom: 20px;

            background: var(--light-red);

            border: 1px solid #f0caca;

            border-radius: 7px;

            color: var(--red);

            font-size: 12px;
        }

        .login-error.show {
            display: flex;
        }

        .login-error i {
            margin-top: 2px;
        }

        /* ================================
           LOGIN BUTTON
        ================================= */

        .login-button {
            position: relative;

            width: 100%;
            height: 52px;

            border: none;
            border-radius: 7px;

            background: var(--navy);
            color: white;

            font-family: inherit;

            font-size: 14px;
            font-weight: 700;

            cursor: pointer;

            transition: 0.2s;
        }

        .login-button:hover {
            background: #08436d;

            transform: translateY(-1px);
        }

        .login-button:disabled {
            opacity: 0.65;

            cursor: not-allowed;

            transform: none;
        }

        .button-loader {
            display: none;
        }

        .login-button.loading .button-text {
            display: none;
        }

        .login-button.loading .button-loader {
            display: inline-flex;

            align-items: center;

            gap: 8px;
        }

        /* ================================
           SECURITY
        ================================= */

        .security-footer {
            display: flex;

            justify-content: center;
            align-items: center;

            gap: 7px;

            margin-top: 20px;

            color: #788995;

            font-size: 11px;
        }

        .security-footer i {
            color: var(--green);
        }

        /* ================================
           ENROLLMENT LINK
        ================================= */

        .enrollment-box {
            margin-top: 24px;

            padding: 18px;

            background: #f7f9fa;

            border: 1px solid #e2e8ed;

            border-radius: 7px;

            text-align: center;
        }

        .enrollment-box p {
            color: var(--muted);

            font-size: 12px;

            margin-bottom: 8px;
        }

        .enrollment-box a {
            color: var(--blue);

            text-decoration: none;

            font-size: 13px;

            font-weight: 700;
        }

        .enrollment-box a:hover {
            text-decoration: underline;
        }

        /* ================================
           FOOTER
        ================================= */

        .simple-footer {
            background: var(--dark-navy);

            color: #aebdca;

            padding: 25px 24px;
        }

        .footer-inner {
            max-width: 1200px;

            margin: auto;

            display: flex;

            justify-content: space-between;
            align-items: center;

            gap: 20px;
        }

        .footer-inner div {
            display: flex;

            gap: 20px;
        }

        .footer-inner a {
            color: #b7c5d0;

            text-decoration: none;

            font-size: 11px;
        }

        .footer-inner a:hover {
            color: white;
        }

        .footer-inner p {
            font-size: 10px;
        }

        /* ================================
           RESPONSIVE
        ================================= */

        @media (max-width: 768px) {

            .top-container {
                justify-content: center;
            }

            .top-left {
                display: none;
            }

            .top-right {
                gap: 14px;
            }

            .top-right a {
                font-size: 11px;
            }

            .nav-container {
                padding: 15px 20px;
            }

            .header-security {
                font-size: 12px;
            }

            .login-page {
                padding: 40px 15px;
            }

            .login-header {
                padding: 32px 25px 25px;
            }

            .login-body {
                padding: 0 25px 30px;
            }
        }

        @media (max-width: 480px) {

            .top-right a:nth-child(2),
            .top-right a:nth-child(3) {
                display: none;
            }

            .logo span {
                font-size: 17px;
            }

            .logo small {
                font-size: 8px;
            }

            .logo-icon {
                width: 40px;
                height: 40px;
            }

            .header-security span {
                display: none;
            }

            .login-header h1 {
                font-size: 24px;
            }

            .login-options {
                flex-direction: column;

                align-items: flex-start;

                gap: 12px;
            }

            .footer-inner {
                flex-direction: column;

                text-align: center;
            }

            .footer-inner div {
                flex-wrap: wrap;

                justify-content: center;
            }
        }

    </style>

</head>


<body>


<!-- =========================================================
     TOP BAR
========================================================= -->

<div class="top-bar">

    <div class="top-container">

        <div class="top-left">

            <a href="index.php">
                Personal
            </a>

            <a href="#">
                Business
            </a>

            <a href="#">
                Wealth
            </a>

        </div>


        <div class="top-right">

            <a href="#">
                <i class="fa-solid fa-location-dot"></i>
                Locations
            </a>

            <a href="#">
                <i class="fa-solid fa-phone"></i>
                Contact Us
            </a>

            <a href="#">
                Help
            </a>

        </div>

    </div>

</div>


<!-- =========================================================
     HEADER
========================================================= -->

<header class="main-header">

    <div class="nav-container">

        <a
            href="index.php"
            class="logo"
        >

            <div class="logo-icon">

                <i class="fa-solid fa-landmark"></i>

            </div>

            <div>

                <span>
                    HORIZON
                </span>

                <small>
                    BANK
                </small>

            </div>

        </a>


        <div class="header-security">

            <i class="fa-solid fa-lock"></i>

            <span>
                Secure Sign In
            </span>

        </div>

    </div>

</header>


<!-- =========================================================
     LOGIN
========================================================= -->

<main class="login-page">


    <div class="login-card">


        <!-- LOGIN HEADER -->

        <div class="login-header">

            <div class="login-icon">

                <i class="fa-solid fa-right-to-bracket"></i>

            </div>


            <span class="label">
                ONLINE BANKING
            </span>


            <h1>
                Welcome Back
            </h1>


            <p>
                Sign in to securely access your Horizon Bank accounts.
            </p>

        </div>


        <!-- LOGIN BODY -->

        <div class="login-body">


            <form
                id="loginForm"
                method="POST"
                autocomplete="off"
                novalidate
            >


                <!-- USERNAME -->

                <div class="form-group">

                    <label for="username">
                        Username
                    </label>


                    <div class="input-wrapper">

                        <i class="fa-solid fa-user"></i>


                        <input
                            type="text"
                            id="username"
                            name="username"
                            placeholder="Enter your username"
                            maxlength="30"
                            autocomplete="username"
                        >

                    </div>

                </div>


                <!-- PASSWORD -->

                <div class="form-group">

                    <label for="password">
                        Password
                    </label>


                    <div class="input-wrapper">

                        <i class="fa-solid fa-lock"></i>


                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter your password"
                            autocomplete="current-password"
                        >


                        <button
                            type="button"
                            class="input-action"
                            id="togglePassword"
                            aria-label="Show password"
                        >

                            <i class="fa-solid fa-eye"></i>

                        </button>

                    </div>

                </div>


                <!-- ERROR -->

                <div
                    id="loginError"
                    class="login-error"
                    role="alert"
                >

                    <i class="fa-solid fa-circle-exclamation"></i>

                    <span>
                        We couldn't sign you in. Please check your
                        username and password and try again.
                    </span>

                </div>


                <!-- OPTIONS -->

                <div class="login-options">

                    <label class="remember-me">

                        <input
                            type="checkbox"
                            name="remember"
                            value="1"
                        >

                        <span>
                            Remember me
                        </span>

                    </label>


                    <a
                        href="#"
                        class="forgot-password"
                    >
                        Forgot username or password?
                    </a>

                </div>


                <!-- LOGIN BUTTON -->

                <button
                    type="submit"
                    id="loginButton"
                    class="login-button"
                >

                    <span class="button-text">
                        Sign In
                    </span>


                    <span class="button-loader">

                        <i class="fa-solid fa-spinner fa-spin"></i>

                        Signing In...

                    </span>

                </button>


                <!-- SECURITY -->

                <div class="security-footer">

                    <i class="fa-solid fa-shield-halved"></i>

                    <span>
                        Your connection is secure
                    </span>

                </div>

            </form>


            <!-- ENROLLMENT -->

            <div class="enrollment-box">

                <p>
                    Don't have online banking access yet?
                </p>


                <a href="register.php">

                    Enroll in Online Banking

                    <i class="fa-solid fa-arrow-right"></i>

                </a>

            </div>

        </div>

    </div>

</main>


<!-- =========================================================
     FOOTER
========================================================= -->

<footer class="simple-footer">

    <div class="footer-inner">

        <div>

            <a href="#">
                Privacy
            </a>

            <a href="#">
                Security
            </a>

            <a href="#">
                Terms &amp; Conditions
            </a>

            <a href="#">
                Accessibility
            </a>

        </div>


        <p>
            &copy; <?= date('Y'); ?> Horizon Bank.
            All rights reserved.
        </p>

    </div>

</footer>


<!-- =========================================================
     LOGIN JAVASCRIPT
========================================================= -->

<script>

    /* ================================
       SHOW / HIDE PASSWORD
    ================================= */

    const togglePassword =
        document.getElementById("togglePassword");

    const password =
        document.getElementById("password");

    togglePassword.addEventListener("click", function () {

        if (password.type === "password") {

            password.type = "text";

            this.querySelector("i")
                .classList
                .remove("fa-eye");

            this.querySelector("i")
                .classList
                .add("fa-eye-slash");

            this.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            password.type = "password";

            this.querySelector("i")
                .classList
                .remove("fa-eye-slash");

            this.querySelector("i")
                .classList
                .add("fa-eye");

            this.setAttribute(
                "aria-label",
                "Show password"
            );
        }

    });


    /* ================================
       LOGIN FORM
    ================================= */

    const loginForm =
        document.getElementById("loginForm");

    const loginButton =
        document.getElementById("loginButton");

    const loginError =
        document.getElementById("loginError");


    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        loginError.classList.remove("show");


        const username =
            document.getElementById("username").value.trim();

        const passwordValue =
            document.getElementById("password").value;


        if (!username || !passwordValue) {

            loginError.classList.add("show");

            return;
        }


        /*
         * Backend login will be connected here later.
         *
         * Do NOT store passwords in JavaScript.
         */


        loginButton.disabled = true;

        loginButton.classList.add("loading");


        setTimeout(function () {

            loginButton.disabled = false;

            loginButton.classList.remove("loading");

            loginError.classList.add("show");

        }, 1000);

    });

</script>


</body>
</html>