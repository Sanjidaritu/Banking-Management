document.addEventListener("DOMContentLoaded", () => {

    const welcomeMessage = document.getElementById("welcomeMessage");
    const accountInfo = document.getElementById("accountInfo");
    const errorMessage = document.getElementById("errorMessage");
    const logoutButton = document.getElementById("logoutButton");


    // =====================================================
    // LOAD DASHBOARD
    // =====================================================

    async function loadDashboard() {

        try {

            accountInfo.textContent =
                "Loading account information...";

            errorMessage.textContent = "";


            const response = await fetch("/api/dashboard", {
                method: "GET",
                credentials: "include",
                headers: {
                    "Accept": "application/json"
                }
            });


            // Read response as TEXT first
            const responseText = await response.text();

            console.log(
                "Dashboard status:",
                response.status
            );

            console.log(
                "Dashboard response:",
                responseText
            );


            // =================================================
            // NOT LOGGED IN
            // =================================================

            if (response.status === 401) {

                window.location.href = "/login.html";

                return;
            }


            // =================================================
            // SERVER RETURNED HTML
            // =================================================

            if (
                responseText.trim().startsWith("<")
            ) {

                console.error(
                    "Server returned HTML:",
                    responseText
                );

                throw new Error(
                    "The dashboard API returned an HTML page instead of JSON. " +
                    "Please check the /api/dashboard route in server.js."
                );
            }


            // =================================================
            // CONVERT RESPONSE TO JSON
            // =================================================

            let data;

            try {

                data = JSON.parse(responseText);

            } catch (error) {

                console.error(
                    "JSON parsing error:",
                    error
                );

                throw new Error(
                    "The server returned invalid JSON."
                );
            }


            console.log(
                "Dashboard data:",
                data
            );


            // =================================================
            // API ERROR
            // =================================================

            if (!response.ok || data.success === false) {

                throw new Error(
                    data.message ||
                    "Unable to load account information."
                );
            }


            // =================================================
            // WELCOME MESSAGE
            // =================================================

            const firstName =
                data.first_name ||
                data.firstName ||
                "Customer";


            welcomeMessage.textContent =
                "Welcome, " + firstName + "!";


            // =================================================
            // ACCOUNT NUMBER
            // =================================================

            const accountNumber =
                String(
                    data.account_number ||
                    data.accountNumber ||
                    ""
                );


            let maskedAccount = accountNumber;


            if (accountNumber.length > 4) {

                maskedAccount =
                    "••••" +
                    accountNumber.slice(-4);

            }


            // =================================================
            // ACCOUNT TYPE
            // =================================================

            const accountType =
                data.account_type ||
                data.accountType ||
                "--";


            // =================================================
            // CURRENT BALANCE
            // =================================================

            const currentBalance =
                Number(
                    data.current_balance ??
                    data.currentBalance ??
                    0
                );


            // =================================================
            // AVAILABLE BALANCE
            // =================================================

            const availableBalance =
                Number(
                    data.available_balance ??
                    data.availableBalance ??
                    0
                );


            // =================================================
            // ACCOUNT STATUS
            // =================================================

            const accountStatus =
                data.account_status ||
                data.accountStatus ||
                "Active";


            // =================================================
            // DISPLAY ACCOUNT INFORMATION
            // =================================================

            accountInfo.innerHTML = `

                <div class="account-row">

                    <span class="label">
                        Account Number
                    </span>

                    <span class="value">
                        ${maskedAccount}
                    </span>

                </div>


                <div class="account-row">

                    <span class="label">
                        Account Type
                    </span>

                    <span class="value">
                        ${accountType}
                    </span>

                </div>


                <div class="account-row">

                    <span class="label">
                        Current Balance
                    </span>

                    <span class="value">
                        $${currentBalance.toFixed(2)}
                    </span>

                </div>


                <div class="account-row">

                    <span class="label">
                        Available Balance
                    </span>

                    <span class="value">
                        $${availableBalance.toFixed(2)}
                    </span>

                </div>


                <div class="account-row">

                    <span class="label">
                        Status
                    </span>

                    <span class="value">
                        ${accountStatus}
                    </span>

                </div>

            `;


            errorMessage.textContent = "";


        } catch (error) {

            console.error(
                "Dashboard error:",
                error
            );


            accountInfo.textContent =
                "Unable to load account information.";


            errorMessage.textContent =
                error.message;

        }

    }


    // =====================================================
    // LOGOUT
    // =====================================================

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await fetch("/api/logout", {

                    method: "POST",

                    credentials: "include",

                    headers: {
                        "Accept": "application/json"
                    }

                });

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }


            // Go back to login page
            window.location.href = "/login.html";

        }
    );


    // =====================================================
    // START DASHBOARD
    // =====================================================

    loadDashboard();

});
