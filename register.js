let currentStep = 1;
let verifiedEnrollmentToken = null;
let usernameAvailable = false;

document.addEventListener("DOMContentLoaded", function () {

    // ============================================
    // PASSWORD SHOW / HIDE
    // ============================================

    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    const passwordToggle = document.getElementById("passwordToggle");
    const confirmPasswordToggle = document.getElementById("confirmPasswordToggle");

    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener("click", function () {
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                passwordToggle.textContent = "Hide";
            } else {
                passwordInput.type = "password";
                passwordToggle.textContent = "Show";
            }
        });
    }

    if (confirmPasswordToggle && confirmPasswordInput) {
        confirmPasswordToggle.addEventListener("click", function () {
            if (confirmPasswordInput.type === "password") {
                confirmPasswordInput.type = "text";
                confirmPasswordToggle.textContent = "Hide";
            } else {
                confirmPasswordInput.type = "password";
                confirmPasswordToggle.textContent = "Show";
            }
        });
    }


    // ============================================
    // IDENTITY FORM
    // ============================================

    const identityForm = document.getElementById("identityForm");

    if (identityForm) {

        identityForm.addEventListener("submit", async function (e) {

            e.preventDefault();

            const accountNumber =
                document.getElementById("accountNumber")?.value.trim();

            const ssnLast4 =
                document.getElementById("ssnLast4")?.value.trim();

            const dateOfBirth =
                document.getElementById("dateOfBirth")?.value;

            const enrollmentReference =
                document.getElementById("enrollmentReference")?.value.trim();

            const errorBox =
                document.getElementById("identityError");

            if (errorBox) {
                errorBox.style.display = "none";
                errorBox.textContent = "";
            }


            // Basic validation
            if (!accountNumber ||
                !ssnLast4 ||
                !dateOfBirth ||
                !enrollmentReference) {

                showIdentityError(
                    "Please complete all required fields."
                );

                return;
            }


            if (!/^\d{4}$/.test(ssnLast4)) {

                showIdentityError(
                    "Please enter the last 4 digits of your SSN."
                );

                return;
            }


            const submitButton =
                identityForm.querySelector("button[type='submit']");

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Verifying...";
            }


            try {

                const response = await fetch(
                    "api/enrollment/verify.php",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            account_number: accountNumber,
                            ssn_last4: ssnLast4,
                            date_of_birth: dateOfBirth,
                            enrollment_reference: enrollmentReference
                        })
                    }
                );


                const result = await response.json();


                if (!response.ok || !result.status) {

                    showIdentityError(
                        result.message ||
                        "We could not verify your information."
                    );

                    return;
                }


                // Save verification token
                verifiedEnrollmentToken =
                    result.verification_token;


                // Move to step 2
                goToStep(2);

            } catch (error) {

                console.error(error);

                showIdentityError(
                    "Unable to connect to the server. Please try again."
                );

            } finally {

                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = "Continue";
                }
            }
        });
    }


    // ============================================
    // USERNAME AVAILABILITY
    // ============================================

    const usernameInput =
        document.getElementById("username");

    const usernameMessage =
        document.getElementById("usernameMessage");

    let usernameTimer = null;

    if (usernameInput) {

        usernameInput.addEventListener("input", function () {

            clearTimeout(usernameTimer);

            const username =
                usernameInput.value.trim();

            usernameAvailable = false;

            if (usernameMessage) {
                usernameMessage.textContent = "";
            }

            if (username.length < 4) {
                return;
            }

            usernameTimer = setTimeout(async function () {

                try {

                    const response = await fetch(
                        "api/enrollment/check-username.php",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                username: username
                            })
                        }
                    );

                    const result = await response.json();

                    if (result.available) {

                        usernameAvailable = true;

                        if (usernameMessage) {
                            usernameMessage.textContent =
                                "Username is available.";
                            usernameMessage.className =
                                "username-message success";
                        }

                    } else {

                        usernameAvailable = false;

                        if (usernameMessage) {
                            usernameMessage.textContent =
                                "Username is already taken.";
                            usernameMessage.className =
                                "username-message error";
                        }
                    }

                } catch (error) {

                    console.error(error);

                    if (usernameMessage) {
                        usernameMessage.textContent =
                            "Unable to check username.";
                        usernameMessage.className =
                            "username-message error";
                    }
                }

            }, 500);
        });
    }


    // ============================================
    // CREDENTIAL FORM
    // ============================================

    const credentialsForm =
        document.getElementById("credentialsForm");

    if (credentialsForm) {

        credentialsForm.addEventListener("submit", async function (e) {

            e.preventDefault();


            const username =
                document.getElementById("username")?.value.trim();

            const password =
                document.getElementById("password")?.value;

            const confirmPassword =
                document.getElementById("confirmPassword")?.value;

            const errorBox =
                document.getElementById("credentialsError");


            if (errorBox) {
                errorBox.style.display = "none";
                errorBox.textContent = "";
            }


            // Username validation
            if (!username) {

                showCredentialsError(
                    "Please enter a username."
                );

                return;
            }


            if (username.length < 4) {

                showCredentialsError(
                    "Username must be at least 4 characters."
                );

                return;
            }


            if (!usernameAvailable) {

                showCredentialsError(
                    "Please choose an available username."
                );

                return;
            }


            // Password validation
            if (!password) {

                showCredentialsError(
                    "Please enter a password."
                );

                return;
            }


            if (password.length < 8) {

                showCredentialsError(
                    "Password must be at least 8 characters."
                );

                return;
            }


            if (!/[A-Z]/.test(password)) {

                showCredentialsError(
                    "Password must contain an uppercase letter."
                );

                return;
            }


            if (!/[a-z]/.test(password)) {

                showCredentialsError(
                    "Password must contain a lowercase letter."
                );

                return;
            }


            if (!/\d/.test(password)) {

                showCredentialsError(
                    "Password must contain a number."
                );

                return;
            }


            if (!/[^A-Za-z0-9]/.test(password)) {

                showCredentialsError(
                    "Password must contain a special character."
                );

                return;
            }


            if (password !== confirmPassword) {

                showCredentialsError(
                    "Passwords do not match."
                );

                return;
            }


            if (!verifiedEnrollmentToken) {

                showCredentialsError(
                    "Your verification session has expired. Please start again."
                );

                goToStep(1);

                return;
            }


            const submitButton =
                credentialsForm.querySelector("button[type='submit']");

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Creating Account...";
            }


            try {

                const response = await fetch(
                    "api/enrollment/create.php",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            verification_token:
                                verifiedEnrollmentToken,

                            username: username,

                            password: password
                        })
                    }
                );


                const result = await response.json();


                if (response.status !== 201 || !result.status) {

                    showCredentialsError(
                        result.message ||
                        "Unable to create your online banking account."
                    );

                    return;
                }


                // ========================================
                // SUCCESS
                // ========================================

                const successUsername =
                    document.getElementById("successUsername");

                if (successUsername) {
                    successUsername.textContent = username;
                }


                goToStep(3);


            } catch (error) {

                console.error(error);

                showCredentialsError(
                    "Unable to connect to the server. Please try again."
                );

            } finally {

                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = "Create Online Banking";
                }
            }

        });
    }


    // ============================================
    // BACK BUTTON
    // ============================================

    const backButton =
        document.getElementById("backToIdentity");

    if (backButton) {

        backButton.addEventListener("click", function () {

            goToStep(1);

        });
    }

});


// ============================================
// CHANGE STEP
// ============================================

function goToStep(step) {

    currentStep = step;


    const step1 =
        document.getElementById("step1");

    const step2 =
        document.getElementById("step2");

    const step3 =
        document.getElementById("step3");


    if (step1) {
        step1.style.display =
            step === 1 ? "block" : "none";
    }

    if (step2) {
        step2.style.display =
            step === 2 ? "block" : "none";
    }

    if (step3) {
        step3.style.display =
            step === 3 ? "block" : "none";
    }


    // Update progress indicators

    document.querySelectorAll(".step").forEach(function (element) {

        const stepNumber =
            parseInt(element.dataset.step);

        element.classList.remove("active");
        element.classList.remove("completed");

        if (stepNumber === step) {

            element.classList.add("active");

        } else if (stepNumber < step) {

            element.classList.add("completed");
        }

    });

}


// ============================================
// IDENTITY ERROR
// ============================================

function showIdentityError(message) {

    const errorBox =
        document.getElementById("identityError");

    if (!errorBox) {
        alert(message);
        return;
    }

    errorBox.textContent = message;
    errorBox.style.display = "block";
}


// ============================================
// CREDENTIAL ERROR
// ============================================

function showCredentialsError(message) {

    const errorBox =
        document.getElementById("credentialsError");

    if (!errorBox) {
        alert(message);
        return;
    }

    errorBox.textContent = message;
    errorBox.style.display = "block";
}
