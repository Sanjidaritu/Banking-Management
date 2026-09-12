const $ = id => document.getElementById(id);

let enrollmentToken = null;


/* =========================================================
   STEP 1 — VERIFY CUSTOMER
========================================================= */

$("identityForm").addEventListener("submit", async e => {

    e.preventDefault();

    $("verifyError").textContent = "";


    const body = {

        account_number:
            $("accountNumber").value.trim(),

        ssn_last4:
            $("ssnLast4").value.trim(),

        date_of_birth:
            $("dateOfBirth").value,

        enrollment_reference:
            $("enrollmentReference").value.trim()

    };


    /* -----------------------------------------------------
       VALIDATE ACCOUNT
    ----------------------------------------------------- */

    if (!body.account_number) {

        $("verifyError").textContent =
            "Enter your account number.";

        return;
    }


    /* -----------------------------------------------------
       VALIDATE SSN
    ----------------------------------------------------- */

    if (!/^\d{4}$/.test(body.ssn_last4)) {

        $("verifyError").textContent =
            "Enter exactly 4 digits for the SSN.";

        return;
    }


    /* -----------------------------------------------------
       VALIDATE DOB
    ----------------------------------------------------- */

    if (!body.date_of_birth) {

        $("verifyError").textContent =
            "Enter your date of birth.";

        return;
    }


    /* -----------------------------------------------------
       VALIDATE REFERENCE
    ----------------------------------------------------- */

    if (!body.enrollment_reference) {

        $("verifyError").textContent =
            "Enter your enrollment reference.";

        return;
    }


    try {

        const res = await fetch(
            "verify.php",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"
                },

                body: JSON.stringify(body)
            }
        );


        const text = await res.text();

        console.log(
            "VERIFY STATUS:",
            res.status
        );

        console.log(
            "VERIFY RAW RESPONSE:",
            text
        );


        if (!text.trim()) {

            throw new Error(
                "verify.php returned an empty response."
            );
        }


        let data;

        try {

            data = JSON.parse(text);

        } catch (error) {

            console.error(
                "JSON PARSE ERROR:",
                error
            );

            throw new Error(
                "verify.php returned invalid JSON."
            );
        }


        if (!res.ok || !data.success) {

            throw new Error(
                data.message ||
                "Verification failed."
            );
        }


        /* -------------------------------------------------
           SAVE TOKEN
        ------------------------------------------------- */

        enrollmentToken =
            data.enrollment_token;


        console.log(
            "Enrollment verification successful."
        );


        /* -------------------------------------------------
           STEP 2
        ------------------------------------------------- */

        $("step1")
            .classList
            .remove("active");

        $("step2")
            .classList
            .add("active");

    }


    catch (error) {

        console.error(
            "VERIFY ERROR:",
            error
        );

        $("verifyError").textContent =
            error.message;

    }

});


/* =========================================================
   BACK BUTTON
========================================================= */

$("backBtn").addEventListener(
    "click",
    () => {

        $("step2")
            .classList
            .remove("active");

        $("step1")
            .classList
            .add("active");

    }
);


/* =========================================================
   USERNAME CHECK
========================================================= */

$("username").addEventListener(
    "input",
    async () => {

        const username =
            $("username").value.trim();


        $("usernameStatus").textContent = "";

        $("usernameStatus").className =
            "status";


        if (
            !/^[A-Za-z0-9_]{6,20}$/.test(
                username
            )
        ) {

            return;
        }


        try {

            const res = await fetch(
                "check-username.php?username=" +
                encodeURIComponent(username)
            );


            const text = await res.text();


            console.log(
                "USERNAME STATUS:",
                res.status
            );


            console.log(
                "USERNAME RESPONSE:",
                text
            );


            if (!text.trim()) {

                $("usernameStatus")
                    .textContent =
                    "Unable to check username.";

                $("usernameStatus")
                    .className =
                    "status error";

                return;
            }


            let data;

            try {

                data = JSON.parse(text);

            } catch (error) {

                $("usernameStatus")
                    .textContent =
                    "Username service returned invalid data.";

                $("usernameStatus")
                    .className =
                    "status error";

                return;
            }


            if (!res.ok || !data.success) {

                $("usernameStatus")
                    .textContent =
                    data.message ||
                    "Unable to check username.";

                $("usernameStatus")
                    .className =
                    "status error";

                return;
            }


            if (data.available) {

                $("usernameStatus")
                    .textContent =
                    "Username is available.";

                $("usernameStatus")
                    .className =
                    "status success";

            } else {

                $("usernameStatus")
                    .textContent =
                    "Username is already taken.";

                $("usernameStatus")
                    .className =
                    "status error";
            }

        }

        catch (error) {

            console.error(
                "USERNAME CHECK ERROR:",
                error
            );

            $("usernameStatus")
                .textContent =
                "Unable to check username.";

            $("usernameStatus")
                .className =
                "status error";
        }

    }
);


/* =========================================================
   STEP 2 — CREATE ACCOUNT
========================================================= */

$("credentialsForm").addEventListener(
    "submit",
    async e => {

        e.preventDefault();

        $("credentialError").textContent = "";


        const username =
            $("username").value.trim();

        const password =
            $("password").value;

        const confirm =
            $("confirmPassword").value;


        /* -------------------------------------------------
           USERNAME
        ------------------------------------------------- */

        if (
            !/^[A-Za-z0-9_]{6,20}$/.test(
                username
            )
        ) {

            $("credentialError")
                .textContent =
                "Username must be 6-20 characters using letters, numbers, or underscores.";

            return;
        }


        /* -------------------------------------------------
           PASSWORD
        ------------------------------------------------- */

        if (
            !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,72}$/
                .test(password)
        ) {

            $("credentialError")
                .textContent =
                "Password must be 12-72 characters and include uppercase, lowercase, and a number.";

            return;
        }


        /* -------------------------------------------------
           CONFIRM PASSWORD
        ------------------------------------------------- */

        if (password !== confirm) {

            $("credentialError")
                .textContent =
                "Passwords do not match.";

            return;
        }


        /* -------------------------------------------------
           TOKEN
        ------------------------------------------------- */

        if (!enrollmentToken) {

            $("credentialError")
                .textContent =
                "Your verification session has expired. Start again.";

            return;
        }


        /*
         * create.php is the next endpoint.
         *
         * It will use the session created by verify.php.
         */

        try {

            const res = await fetch(
                "create.php",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify({

                        enrollment_token:
                            enrollmentToken,

                        username:
                            username,

                        password:
                            password

                    })
                }
            );


            const text = await res.text();


            console.log(
                "CREATE STATUS:",
                res.status
            );

            console.log(
                "CREATE RESPONSE:",
                text
            );


            if (!text.trim()) {

                throw new Error(
                    "create.php returned an empty response."
                );
            }


            let data;

            try {

                data = JSON.parse(text);

            } catch (error) {

                throw new Error(
                    "create.php returned invalid JSON."
                );
            }


            if (!res.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Could not create account."
                );
            }


            $("createdUsername")
                .textContent =
                data.username;


            $("step2")
                .classList
                .remove("active");

            $("step3")
                .classList
                .add("active");


            enrollmentToken = null;

        }


        catch (error) {

            console.error(
                "CREATE ACCOUNT ERROR:",
                error
            );

            $("credentialError")
                .textContent =
                error.message;

        }

    }
);
