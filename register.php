<?php
/**
 * Horizon Bank
 * Online Banking Enrollment
 *
 * Frontend enrollment page.
 *
 * IMPORTANT:
 * - Do not perform sensitive verification only in JavaScript.
 * - Account/SSN/DOB/Enrollment Reference verification
 *   must happen server-side.
 * - Passwords must be hashed server-side.
 */

$page_title = "Enroll in Online Banking | Horizon Bank";
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

    <link
        rel="stylesheet"
        href="register.css"
    >

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

</head>


<body>

<style>
    /* =========================================================
   HORIZON BANK - ONLINE ENROLLMENT
   register.css
========================================================= */

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


/* =========================================================
   TOP BAR
========================================================= */

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
    transition: 0.2s;
}

.top-bar a:hover {
    color: white;
}

.top-right i {
    margin-right: 5px;
}


/* =========================================================
   HEADER
========================================================= */

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


/* LOGO */

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


/* SECURITY */

.header-security {
    display: flex;
    align-items: center;
    gap: 8px;

    color: var(--green);

    font-size: 14px;
    font-weight: 600;
}

.header-security i {
    font-size: 15px;
}


/* =========================================================
   MAIN
========================================================= */

.enrollment-page {
    max-width: 900px;
    margin: 0 auto;

    padding: 55px 24px 70px;
}


/* =========================================================
   INTRO
========================================================= */

.enrollment-intro {
    text-align: center;
    margin-bottom: 40px;
}

.intro-icon {
    width: 64px;
    height: 64px;

    margin: 0 auto 18px;

    border-radius: 50%;

    background: var(--light-blue);
    color: var(--blue);

    display: flex;
    align-items: center;
    justify-content: center;

    font-size: 25px;
}

.intro-label {
    display: block;

    margin-bottom: 7px;

    color: var(--blue);

    font-size: 12px;
    font-weight: 800;
    letter-spacing: 2px;
}

.enrollment-intro h1 {
    color: var(--navy);

    font-size: 36px;
    font-weight: 800;

    margin-bottom: 12px;
}

.enrollment-intro p {
    max-width: 650px;
    margin: auto;

    color: var(--muted);

    font-size: 16px;
}


/* =========================================================
   PROGRESS
========================================================= */

.progress-wrapper {
    display: flex;
    align-items: center;

    margin-bottom: 30px;
}

.progress-step {
    display: flex;
    align-items: center;
    gap: 10px;

    white-space: nowrap;
}

.step-number {
    width: 36px;
    height: 36px;

    border-radius: 50%;

    background: #e4ebf0;
    color: #71808d;

    display: flex;
    justify-content: center;
    align-items: center;

    font-size: 14px;
    font-weight: 700;

    transition: 0.3s;
}

.progress-step.active .step-number {
    background: var(--blue);
    color: white;
}

.progress-step.completed .step-number {
    background: var(--green);
    color: white;
}

.step-text strong {
    display: block;

    font-size: 13px;
    color: var(--text);
}

.step-text span {
    display: block;

    color: var(--muted);
    font-size: 11px;
}

.progress-line {
    flex: 1;

    height: 1px;

    margin: 0 18px;

    background: var(--border);
}


/* =========================================================
   ENROLLMENT CARD
========================================================= */

.enrollment-card {
    background: white;

    border: 1px solid var(--border);

    border-radius: 12px;

    box-shadow: 0 10px 35px rgba(0, 35, 60, 0.08);

    overflow: hidden;
}


/* =========================================================
   FORM STEP
========================================================= */

.form-step {
    display: none;

    padding: 42px;
}

.form-step.active {
    display: block;
}


/* =========================================================
   FORM HEADING
========================================================= */

.form-heading {
    display: flex;
    align-items: flex-start;
    gap: 16px;

    margin-bottom: 28px;
}

.heading-icon {
    width: 48px;
    height: 48px;

    flex-shrink: 0;

    border-radius: 10px;

    background: var(--light-blue);
    color: var(--blue);

    display: flex;
    justify-content: center;
    align-items: center;

    font-size: 20px;
}

.success-heading {
    background: var(--light-green);
    color: var(--green);
}

.form-heading h2 {
    color: var(--navy);

    font-size: 22px;
    font-weight: 750;

    margin-bottom: 4px;
}

.form-heading p {
    color: var(--muted);

    font-size: 14px;
}


/* =========================================================
   SECURITY MESSAGE
========================================================= */

.security-message {
    display: flex;
    align-items: flex-start;
    gap: 13px;

    padding: 16px;

    margin-bottom: 28px;

    background: #f3f8fb;

    border-left: 4px solid var(--blue);

    border-radius: 6px;
}

.security-message > i {
    color: var(--blue);

    margin-top: 2px;
}

.security-message strong {
    display: block;

    color: var(--navy);

    font-size: 13px;

    margin-bottom: 2px;
}

.security-message p {
    color: var(--muted);

    font-size: 12px;
}


/* =========================================================
   FORM
========================================================= */

.form-group {
    margin-bottom: 22px;
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

    transition:
        border-color 0.2s,
        box-shadow 0.2s;
}

.input-wrapper input:focus {
    border-color: var(--blue);

    box-shadow: 0 0 0 3px rgba(8, 119, 189, 0.10);
}

.input-wrapper input::placeholder {
    color: #9aa8b3;
}


/* =========================================================
   INPUT ACTION
========================================================= */

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


/* =========================================================
   HELP TEXT
========================================================= */

.field-help {
    margin-top: 7px;

    color: var(--muted);

    font-size: 11px;
}

.label-help {
    color: var(--blue);

    margin-left: 3px;

    cursor: help;
}


/* =========================================================
   ERRORS
========================================================= */

.field-error {
    display: block;

    min-height: 16px;

    margin-top: 5px;

    color: var(--red);

    font-size: 11px;
}

.input-error {
    border-color: var(--red) !important;

    background: var(--light-red) !important;
}

.general-error {
    display: none;

    align-items: flex-start;
    gap: 12px;

    padding: 15px;

    margin-bottom: 22px;

    background: var(--light-red);

    border: 1px solid #f0caca;

    border-radius: 7px;

    color: var(--red);
}

.general-error.show {
    display: flex;
}

.general-error > i {
    margin-top: 2px;
}

.general-error strong {
    display: block;

    font-size: 13px;

    margin-bottom: 2px;
}

.general-error p {
    font-size: 12px;
}


/* =========================================================
   SUBMIT BUTTON
========================================================= */

.form-submit {
    position: relative;

    width: 100%;
    height: 52px;

    margin-top: 5px;

    border: none;
    border-radius: 7px;

    background: var(--navy);
    color: white;

    font-family: inherit;

    font-size: 14px;
    font-weight: 700;

    cursor: pointer;

    transition:
        background 0.2s,
        transform 0.2s;
}

.form-submit:hover {
    background: #08436d;

    transform: translateY(-1px);
}

.form-submit:disabled {
    opacity: 0.65;

    cursor: not-allowed;

    transform: none;
}

.button-arrow {
    position: absolute;

    right: 18px;
    top: 50%;

    transform: translateY(-50%);
}

.button-loader {
    display: none;
}

.form-submit.loading .button-text,
.form-submit.loading .button-arrow {
    display: none;
}

.form-submit.loading .button-loader {
    display: inline-flex;

    align-items: center;
    gap: 8px;
}


/* =========================================================
   FORM FOOTER
========================================================= */

.form-footer {
    display: flex;

    justify-content: center;
    align-items: center;

    gap: 7px;

    margin-top: 20px;

    color: #788995;

    font-size: 11px;
}

.form-footer i {
    color: var(--green);
}


/* =========================================================
   VERIFIED MESSAGE
========================================================= */

.verified-message {
    display: flex;
    align-items: center;
    gap: 12px;

    padding: 16px;

    margin-bottom: 28px;

    background: var(--light-green);

    border: 1px solid #ccebd9;

    border-radius: 7px;
}

.verified-icon {
    width: 32px;
    height: 32px;

    border-radius: 50%;

    background: var(--green);
    color: white;

    display: flex;
    justify-content: center;
    align-items: center;

    font-size: 13px;
}

.verified-message strong {
    display: block;

    color: #146c43;

    font-size: 13px;
}

.verified-message p {
    color: #4d7c64;

    font-size: 11px;
}


/* =========================================================
   USERNAME STATUS
========================================================= */

.username-status {
    position: absolute;

    right: 15px;
    top: 50%;

    transform: translateY(-50%);

    font-size: 13px;
}

.username-status.available {
    color: var(--green);
}

.username-status.unavailable {
    color: var(--red);
}


/* =========================================================
   PASSWORD REQUIREMENTS
========================================================= */

.password-requirements {
    padding: 17px;

    margin-top: -7px;
    margin-bottom: 22px;

    background: #f7f9fa;

    border: 1px solid #e2e8ed;

    border-radius: 7px;
}

.password-requirements h4 {
    margin-bottom: 10px;

    color: var(--text);

    font-size: 12px;
}

.requirement {
    display: flex;
    align-items: center;

    gap: 8px;

    margin-bottom: 6px;

    color: #788895;

    font-size: 11px;
}

.requirement:last-child {
    margin-bottom: 0;
}

.requirement i {
    font-size: 12px;
}

.requirement.valid {
    color: var(--green);
}

.requirement.valid i::before {
    content: "\f058";
}

.requirement.invalid {
    color: #788895;
}


/* =========================================================
   SUCCESS
========================================================= */

.success-step {
    text-align: center;

    padding: 60px 42px;
}

.success-circle {
    width: 76px;
    height: 76px;

    margin: 0 auto 20px;

    border-radius: 50%;

    background: var(--light-green);
    color: var(--green);

    display: flex;
    align-items: center;
    justify-content: center;

    font-size: 31px;
}

.success-label {
    display: block;

    margin-bottom: 7px;

    color: var(--green);

    font-size: 11px;
    font-weight: 800;
    letter-spacing: 2px;
}

.success-step h2 {
    color: var(--navy);

    font-size: 30px;

    margin-bottom: 10px;
}

.success-description {
    max-width: 520px;

    margin: 0 auto 25px;

    color: var(--muted);

    font-size: 14px;
}


/* =========================================================
   USERNAME RESULT
========================================================= */

.username-result {
    max-width: 350px;

    margin: 0 auto 28px;

    padding: 16px;

    background: #f4f8fb;

    border: 1px solid var(--border);

    border-radius: 7px;
}

.username-result span {
    display: block;

    margin-bottom: 4px;

    color: var(--muted);

    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
}

.username-result strong {
    color: var(--navy);

    font-size: 18px;
}


/* =========================================================
   SUCCESS DETAILS
========================================================= */

.success-details {
    max-width: 500px;

    margin: 0 auto 30px;

    text-align: left;
}

.success-details div {
    display: flex;

    align-items: flex-start;

    gap: 10px;

    margin-bottom: 11px;

    color: var(--muted);

    font-size: 12px;
}

.success-details i {
    color: var(--green);

    margin-top: 2px;
}


/* =========================================================
   LOGIN BUTTON
========================================================= */

.success-login-button {
    display: inline-flex;

    align-items: center;
    justify-content: center;

    gap: 10px;

    min-width: 270px;

    height: 50px;

    padding: 0 25px;

    background: var(--navy);
    color: white;

    border-radius: 7px;

    text-decoration: none;

    font-size: 13px;
    font-weight: 700;

    transition: 0.2s;
}

.success-login-button:hover {
    background: #08436d;

    transform: translateY(-1px);
}

.back-home {
    display: block;

    margin-top: 17px;

    color: var(--blue);

    text-decoration: none;

    font-size: 12px;
    font-weight: 600;
}

.back-home:hover {
    text-decoration: underline;
}


/* =========================================================
   HELP SECTION
========================================================= */

.enrollment-help {
    display: flex;
    align-items: center;

    gap: 15px;

    margin-top: 25px;

    padding: 18px 20px;

    background: white;

    border: 1px solid var(--border);

    border-radius: 8px;
}

.help-icon {
    width: 38px;
    height: 38px;

    flex-shrink: 0;

    border-radius: 50%;

    background: var(--light-blue);
    color: var(--blue);

    display: flex;
    align-items: center;
    justify-content: center;
}

.enrollment-help strong {
    display: block;

    color: var(--navy);

    font-size: 13px;
}

.enrollment-help p {
    color: var(--muted);

    font-size: 11px;
}

.enrollment-help a {
    margin-left: auto;

    color: var(--blue);

    text-decoration: none;

    font-size: 12px;
    font-weight: 700;

    white-space: nowrap;
}

.enrollment-help a:hover {
    text-decoration: underline;
}


/* =========================================================
   FOOTER
========================================================= */

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


/* =========================================================
   RESPONSIVE
========================================================= */

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

    .enrollment-page {
        padding: 40px 15px 50px;
    }

    .enrollment-intro h1 {
        font-size: 29px;
    }

    .enrollment-intro p {
        font-size: 14px;
    }

    .progress-wrapper {
        display: none;
    }

    .form-step {
        padding: 30px 22px;
    }

    .form-heading h2 {
        font-size: 20px;
    }

    .success-step {
        padding: 45px 22px;
    }

    .enrollment-help {
        align-items: flex-start;
    }

    .enrollment-help a {
        margin-left: 0;
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

    .enrollment-intro h1 {
        font-size: 25px;
    }

    .form-heading {
        gap: 11px;
    }

    .heading-icon {
        width: 42px;
        height: 42px;

        font-size: 17px;
    }

    .form-heading h2 {
        font-size: 18px;
    }

    .form-heading p {
        font-size: 12px;
    }

    .enrollment-help {
        flex-direction: column;
    }

    .success-login-button {
        width: 100%;
        min-width: 0;
    }
}
</style>
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


        <!-- LOGO -->

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


        <!-- SECURITY -->

        <div class="header-security">

            <i class="fa-solid fa-lock"></i>

            <span>
                Secure Enrollment
            </span>

        </div>

    </div>

</header>



<!-- =========================================================
     MAIN
========================================================= -->

<main class="enrollment-page">


    <!-- =====================================================
         INTRO
    ====================================================== -->

    <div class="enrollment-intro">

        <div class="intro-icon">

            <i class="fa-solid fa-user-plus"></i>

        </div>


        <span class="intro-label">
            ONLINE BANKING
        </span>


        <h1>
            Enroll in Online Banking
        </h1>


        <p>
            Already have a Horizon Bank checking or savings account?
            Set up your online banking access in just a few steps.
        </p>

    </div>



    <!-- =====================================================
         PROGRESS
    ====================================================== -->

    <div class="progress-wrapper">


        <!-- STEP 1 -->

        <div
            class="progress-step active"
            data-step="1"
        >

            <div class="step-number">
                1
            </div>

            <div class="step-text">

                <strong>
                    Verify Identity
                </strong>

                <span>
                    Confirm your account
                </span>

            </div>

        </div>


        <div class="progress-line"></div>


        <!-- STEP 2 -->

        <div
            class="progress-step"
            data-step="2"
        >

            <div class="step-number">
                2
            </div>

            <div class="step-text">

                <strong>
                    Create Credentials
                </strong>

                <span>
                    Choose your login
                </span>

            </div>

        </div>


        <div class="progress-line"></div>


        <!-- STEP 3 -->

        <div
            class="progress-step"
            data-step="3"
        >

            <div class="step-number">
                3
            </div>

            <div class="step-text">

                <strong>
                    Complete
                </strong>

                <span>
                    You're ready to go
                </span>

            </div>

        </div>

    </div>



    <!-- =====================================================
         ENROLLMENT CARD
    ====================================================== -->

    <div class="enrollment-card">


        <!-- =================================================
             STEP 1 - VERIFY IDENTITY
        ================================================== -->

        <section
            id="step1"
            class="form-step active"
        >


            <!-- HEADING -->

            <div class="form-heading">

                <div class="heading-icon">

                    <i class="fa-solid fa-shield-halved"></i>

                </div>


                <div>

                    <h2>
                        Verify your identity
                    </h2>

                    <p>
                        Enter the information associated with your
                        Horizon Bank account.
                    </p>

                </div>

            </div>



            <!-- SECURITY MESSAGE -->

            <div class="security-message">

                <i class="fa-solid fa-lock"></i>

                <div>

                    <strong>
                        Your information is protected
                    </strong>

                    <p>
                        We use your information only to verify your
                        identity and protect your account.
                    </p>

                </div>

            </div>



            <!-- =================================================
                 IDENTITY FORM
            ================================================== -->

            <form
                id="identityForm"
                method="POST"
                autocomplete="off"
                novalidate
            >


                <!-- ACCOUNT NUMBER -->

                <div class="form-group">

                    <label for="accountNumber">
                        Account Number
                    </label>


                    <div class="input-wrapper">

                        <i class="fa-solid fa-building-columns"></i>


                        <input
                            type="text"
                            id="accountNumber"
                            name="account_number"
                            placeholder="Enter your account number"
                            inputmode="numeric"
                            maxlength="20"
                            autocomplete="off"
                        >

                    </div>


                    <small
                        class="field-error"
                        id="accountError"
                    ></small>

                </div>



                <!-- SSN -->

                <div class="form-group">

                    <label for="ssnLast4">
                        Last 4 digits of SSN
                    </label>


                    <div class="input-wrapper">

                        <i class="fa-solid fa-id-card"></i>


                        <input
                            type="password"
                            id="ssnLast4"
                            name="ssn_last4"
                            placeholder="Enter last 4 digits"
                            inputmode="numeric"
                            maxlength="4"
                            autocomplete="off"
                        >


                        <button
                            type="button"
                            class="input-action"
                            data-target="ssnLast4"
                            aria-label="Show last 4 digits of SSN"
                        >

                            <i class="fa-solid fa-eye"></i>

                        </button>

                    </div>


                    <small
                        class="field-error"
                        id="ssnError"
                    ></small>

                </div>



                <!-- DATE OF BIRTH -->

                <div class="form-group">

                    <label for="dateOfBirth">
                        Date of Birth
                    </label>


                    <div class="input-wrapper">

                        <i class="fa-solid fa-calendar"></i>


                        <input
                            type="date"
                            id="dateOfBirth"
                            name="date_of_birth"
                            autocomplete="bday"
                        >

                    </div>


                    <small
                        class="field-error"
                        id="dobError"
                    ></small>

                </div>



                <!-- ENROLLMENT REFERENCE -->

                <div class="form-group">

                    <label for="enrollmentReference">

                        Enrollment Reference Number

                        <span class="label-help">

                            <i class="fa-solid fa-circle-question"></i>

                        </span>

                    </label>


                    <div class="input-wrapper">

                        <i class="fa-solid fa-key"></i>


                        <input
                            type="text"
                            id="enrollmentReference"
                            name="enrollment_reference"
                            placeholder="Enter your enrollment reference"
                            maxlength="50"
                            autocomplete="off"
                        >

                    </div>


                    <small
                        class="field-error"
                        id="referenceError"
                    ></small>


                    <p class="field-help">

                        You received this reference number when your
                        Horizon Bank account was opened.

                    </p>

                </div>



                <!-- GENERAL VERIFICATION ERROR -->

                <div
                    id="verificationError"
                    class="general-error"
                    role="alert"
                >

                    <i class="fa-solid fa-circle-exclamation"></i>


                    <div>

                        <strong>
                            We couldn't verify your information.
                        </strong>

                        <p>
                            Please check your information and try again.
                        </p>

                    </div>

                </div>



                <!-- CONTINUE -->

                <button
                    type="submit"
                    id="verifyButton"
                    class="form-submit"
                >

                    <span class="button-text">
                        Continue
                    </span>


                    <span class="button-loader">

                        <i class="fa-solid fa-spinner fa-spin"></i>

                        Verifying...

                    </span>


                    <i class="fa-solid fa-arrow-right button-arrow"></i>

                </button>



                <!-- SECURITY FOOTER -->

                <div class="form-footer">

                    <i class="fa-solid fa-lock"></i>

                    <span>
                        Secure connection
                    </span>

                </div>

            </form>

        </section>



        <!-- =================================================
             STEP 2 - CREATE CREDENTIALS
        ================================================== -->

        <section
            id="step2"
            class="form-step"
        >


            <!-- HEADING -->

            <div class="form-heading">

                <div class="heading-icon success-heading">

                    <i class="fa-solid fa-check"></i>

                </div>


                <div>

                    <h2>
                        Create your online access
                    </h2>

                    <p>
                        Your account has been successfully verified.
                        Now create your online banking credentials.
                    </p>

                </div>

            </div>



            <!-- VERIFIED -->

            <div class="verified-message">

                <div class="verified-icon">

                    <i class="fa-solid fa-check"></i>

                </div>


                <div>

                    <strong>
                        Identity verified
                    </strong>

                    <p>
                        You're ready to create your online banking login.
                    </p>

                </div>

            </div>



            <!-- =================================================
                 CREDENTIAL FORM
            ================================================== -->

            <form
                id="credentialsForm"
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
                            placeholder="Create a username"
                            maxlength="30"
                            autocomplete="username"
                        >


                        <span
                            id="usernameStatus"
                            class="username-status"
                        ></span>

                    </div>


                    <small
                        class="field-error"
                        id="usernameError"
                    ></small>


                    <p class="field-help">

                        Use 6–30 characters.
                        Letters and numbers are recommended.

                    </p>

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
                            placeholder="Create a secure password"
                            autocomplete="new-password"
                        >


                        <button
                            type="button"
                            class="input-action"
                            data-target="password"
                            aria-label="Show password"
                        >

                            <i class="fa-solid fa-eye"></i>

                        </button>

                    </div>


                    <small
                        class="field-error"
                        id="passwordError"
                    ></small>

                </div>



                <!-- PASSWORD REQUIREMENTS -->

                <div class="password-requirements">

                    <h4>
                        Your password must contain:
                    </h4>


                    <div
                        class="requirement"
                        id="reqLength"
                    >

                        <i class="fa-solid fa-circle-xmark"></i>

                        <span>
                            At least 8 characters
                        </span>

                    </div>


                    <div
                        class="requirement"
                        id="reqUpper"
                    >

                        <i class="fa-solid fa-circle-xmark"></i>

                        <span>
                            One uppercase letter
                        </span>

                    </div>


                    <div
                        class="requirement"
                        id="reqLower"
                    >

                        <i class="fa-solid fa-circle-xmark"></i>

                        <span>
                            One lowercase letter
                        </span>

                    </div>


                    <div
                        class="requirement"
                        id="reqNumber"
                    >

                        <i class="fa-solid fa-circle-xmark"></i>

                        <span>
                            One number
                        </span>

                    </div>


                    <div
                        class="requirement"
                        id="reqSpecial"
                    >

                        <i class="fa-solid fa-circle-xmark"></i>

                        <span>
                            One special character
                        </span>

                    </div>

                </div>



                <!-- CONFIRM PASSWORD -->

                <div class="form-group">

                    <label for="confirmPassword">
                        Confirm Password
                    </label>


                    <div class="input-wrapper">

                        <i class="fa-solid fa-lock"></i>


                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirm_password"
                            placeholder="Re-enter your password"
                            autocomplete="new-password"
                        >


                        <button
                            type="button"
                            class="input-action"
                            data-target="confirmPassword"
                            aria-label="Show password"
                        >

                            <i class="fa-solid fa-eye"></i>

                        </button>

                    </div>


                    <small
                        class="field-error"
                        id="confirmPasswordError"
                    ></small>

                </div>



                <!-- CREDENTIAL ERROR -->

                <div
                    id="credentialError"
                    class="general-error"
                    role="alert"
                >

                    <i class="fa-solid fa-circle-exclamation"></i>


                    <div>

                        <strong>
                            We couldn't create your online access.
                        </strong>

                        <p>
                            Please review your information and try again.
                        </p>

                    </div>

                </div>



                <!-- CREATE -->

                <button
                    type="submit"
                    id="createButton"
                    class="form-submit"
                >

                    <span class="button-text">
                        Create Online Access
                    </span>


                    <span class="button-loader">

                        <i class="fa-solid fa-spinner fa-spin"></i>

                        Creating...

                    </span>


                    <i class="fa-solid fa-arrow-right button-arrow"></i>

                </button>



                <div class="form-footer">

                    <i class="fa-solid fa-shield-halved"></i>

                    <span>
                        Your password is securely protected
                    </span>

                </div>

            </form>

        </section>



        <!-- =================================================
             STEP 3 - SUCCESS
        ================================================== -->

        <section
            id="step3"
            class="form-step success-step"
        >


            <!-- SUCCESS ICON -->

            <div class="success-circle">

                <i class="fa-solid fa-check"></i>

            </div>


            <span class="success-label">
                ENROLLMENT COMPLETE
            </span>


            <h2>
                You're all set!
            </h2>


            <p class="success-description">

                Your Horizon Bank online banking access has
                been successfully created.

            </p>



            <!-- USERNAME -->

            <div class="username-result">

                <span>
                    YOUR USERNAME
                </span>


                <strong id="createdUsername">
                    username
                </strong>

            </div>



            <!-- SUCCESS DETAILS -->

            <div class="success-details">


                <div>

                    <i class="fa-solid fa-check"></i>

                    <span>
                        Your online banking profile has been created.
                    </span>

                </div>


                <div>

                    <i class="fa-solid fa-check"></i>

                    <span>
                        Your account is now linked to your online access.
                    </span>

                </div>


                <div>

                    <i class="fa-solid fa-check"></i>

                    <span>
                        Your enrollment reference can no longer be reused.
                    </span>

                </div>

            </div>



            <!-- LOGIN BUTTON -->

            <a
                href="login.php"
                class="success-login-button"
            >

                Sign In to Online Banking

                <i class="fa-solid fa-arrow-right"></i>

            </a>


            <!-- HOME -->

            <a
                href="index.php"
                class="back-home"
            >

                Return to Horizon Bank

            </a>

        </section>

    </div>



    <!-- =====================================================
         HELP
    ====================================================== -->

    <div class="enrollment-help">


        <div class="help-icon">

            <i class="fa-solid fa-circle-question"></i>

        </div>


        <div>

            <strong>
                Need help enrolling?
            </strong>

            <p>

                If you have questions about your account or
                enrollment reference, contact Horizon Bank.

            </p>

        </div>


        <a href="#">
            Contact Us
        </a>

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
     JAVASCRIPT
========================================================= -->

<script src="register.js"></script>


</body>
</html>
