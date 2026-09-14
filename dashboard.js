document.addEventListener("DOMContentLoaded", () => {

    const welcomeMessage =
        document.getElementById("welcomeMessage");

    const accountInfo =
        document.getElementById("accountInfo");

    const errorMessage =
        document.getElementById("errorMessage");

    const logoutButton =
        document.getElementById("logoutButton");


    // =====================================================
    // LOAD DASHBOARD
    // =====================================================

    async function loadDashboard() {

        try {

            // Clear previous messages

            if (accountInfo) {
                accountInfo.textContent =
                    "Loading account information...";
            }

            if (errorMessage) {
                errorMessage.textContent = "";
            }


            console.log(
                "Requesting /api/dashboard..."
            );


            // =================================================
            // REQUEST DASHBOARD
            // =================================================

            const response = await fetch(
                "/api/dashboard",
                {
                    method: "GET",

                    credentials: "include",

                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


            console.log(
                "Dashboard HTTP status:",
                response.status
            );


            // =================================================
            // READ RESPONSE AS TEXT FIRST
            // =================================================

            const responseText =
                await response.text();


            console.log(
                "Dashboard raw response:",
                responseText
            );


            // =================================================
            // NOT LOGGED IN
            // =================================================

            if (response.status === 401) {

                console.log(
                    "User is not authenticated."
                );

                window.location.href =
                    "/login.html";

                return;
            }


            // =================================================
            // EMPTY RESPONSE
            // =================================================

            if (!responseText.trim()) {

                throw new Error(
                    "The server returned an empty response."
                );
            }


            // =================================================
            // SERVER RETURNED HTML
            // =================================================

            if (
                responseText
                    .trim()
                    .startsWith("<")
            ) {

                console.error(
                    "Server returned HTML instead of JSON."
                );

                console.error(
                    responseText
                );


                throw new Error(
                    "The dashboard API returned an HTML page instead of JSON. " +
                    "Please check the Railway API URL and /api/dashboard route."
                );
            }


            // =================================================
            // PARSE JSON
            // =================================================

            let data;

            try {

                data =
                    JSON.parse(responseText);

            } catch (jsonError) {

                console.error(
                    "JSON parsing error:",
                    jsonError
                );

                console.error(
                    "Response received:",
                    responseText
                );


                throw new Error(
                    "The server returned invalid JSON."
                );
            }


            console.log(
                "Dashboard JSON:",
                data
            );


            // =================================================
            // API ERROR
            // =================================================

            if (
                !response.ok ||
                data.success === false
            ) {

                throw new Error(
                    data.message ||
                    "Unable to load account information."
                );
            }


            // =================================================
            // GET CUSTOMER NAME
            // =================================================

            const firstName =
                data.first_name ||
                data.firstName ||
                (
                    data.customer &&
                    (
                        data.customer.first_name ||
                        data.customer.firstname
                    )
                ) ||
                "Customer";


            const lastName =
                data.last_name ||
                data.lastName ||
                (
                    data.customer &&
                    (
                        data.customer.last_name ||
                        data.customer.lastname
                    )
                ) ||
                "";


            // =================================================
            // WELCOME MESSAGE
            // =================================================

            if (welcomeMessage) {

                welcomeMessage.textContent =
                    `Welcome, ${firstName}!`;

            }


            // =================================================
            // ACCOUNT NUMBER
            // =================================================

            let accountNumber =
                String(
                    data.account_number ||
                    data.accountNumber ||
                    ""
                );


            // If API returned nested account information

            if (
                !accountNumber &&
                data.accounts &&
                data.accounts.length > 0
            ) {

                accountNumber =
                    String(
                        data.accounts[0].account_number ||
                        ""
                    );

            }


            // =================================================
            // MASK ACCOUNT NUMBER
            // =================================================

            let maskedAccount =
                accountNumber;


            if (
                accountNumber.length > 4 &&
                !accountNumber.includes("••••")
            ) {

                maskedAccount =
                    `••••${accountNumber.slice(-4)}`;

            }


            // =================================================
            // ACCOUNT TYPE
            // =================================================

            let accountType =
                data.account_type ||
                data.accountType ||
                "";


            if (
                !accountType &&
                data.accounts &&
                data.accounts.length > 0
            ) {

                accountType =
                    data.accounts[0].account_type ||
                    "";

            }


            if (!accountType) {

                accountType =
                    "checking";

            }


            // =================================================
            // CURRENT BALANCE
            // =================================================

            let currentBalance =
                data.current_balance ??
                data.currentBalance;


            if (
                currentBalance === undefined &&
                data.accounts &&
                data.accounts.length > 0
            ) {

                currentBalance =
                    data.accounts[0].current_balance ??
                    0;

            }


            currentBalance =
                Number(currentBalance || 0);


            // =================================================
            // AVAILABLE BALANCE
            // =================================================

            let availableBalance =
                data.available_balance ??
                data.availableBalance;


            if (
                availableBalance === undefined &&
                data.accounts &&
                data.accounts.length > 0
            ) {

                availableBalance =
                    data.accounts[0].available_balance ??
                    0;

            }


            availableBalance =
                Number(
                    availableBalance || 0
                );


            // =================================================
            // ACCOUNT STATUS
            // =================================================

            let accountStatus =
                data.account_status ||
                data.accountStatus ||
                "";


            if (
                !accountStatus &&
                data.accounts &&
                data.accounts.length > 0
            ) {

                accountStatus =
                    data.accounts[0].status ||
                    "active";

            }


            accountStatus =
                String(
                    accountStatus || "active"
                );


            // =================================================
            // FORMAT ACCOUNT TYPE
            // =================================================

            const formattedAccountType =
                accountType
                    .charAt(0)
                    .toUpperCase() +
                accountType
                    .slice(1);


            // =================================================
            // FORMAT STATUS
            // =================================================

            const formattedStatus =
                accountStatus
                    .charAt(0)
                    .toUpperCase() +
                accountStatus
                    .slice(1);


            // =================================================
            // DISPLAY ACCOUNT INFORMATION
            // =================================================

            if (accountInfo) {

                accountInfo.innerHTML = `

                    <div class="account-row">

                        <span class="label">
                            Account Holder
                        </span>

                        <span class="value">
                            ${escapeHTML(
                                firstName +
                                (
                                    lastName
                                        ? " " + lastName
                                        : ""
                                )
                            )}
                        </span>

                    </div>


                    <div class="account-row">

                        <span class="label">
                            Account Number
                        </span>

                        <span class="value">
                            ${escapeHTML(
                                maskedAccount
                            )}
                        </span>

                    </div>


                    <div class="account-row">

                        <span class="label">
                            Account Type
                        </span>

                        <span class="value">
                            ${escapeHTML(
                                formattedAccountType
                            )}
                        </span>

                    </div>


                    <div class="account-row">

                        <span class="label">
                            Current Balance
                        </span>

                        <span class="value balance">
                            $${currentBalance.toFixed(2)}
                        </span>

                    </div>


                    <div class="account-row">

                        <span class="label">
                            Available Balance
                        </span>

                        <span class="value balance">
                            $${availableBalance.toFixed(2)}
                        </span>

                    </div>


                    <div class="account-row">

                        <span class="label">
                            Status
                        </span>

                        <span class="value status">
                            ${escapeHTML(
                                formattedStatus
                            )}
                        </span>

                    </div>

                `;

            }


            // =================================================
            // CLEAR ERROR
            // =================================================

            if (errorMessage) {

                errorMessage.textContent = "";

            }


            console.log(
                "Dashboard loaded successfully."
            );


        } catch (error) {

            console.error(
                "Dashboard error:",
                error
            );


            if (accountInfo) {

                accountInfo.textContent =
                    "Unable to load account information.";

            }


            if (errorMessage) {

                errorMessage.textContent =
                    error.message ||
                    "Unable to load account information.";

            }

        }

    }


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // =====================================================
    // LOGOUT
    // =====================================================

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async () => {

                try {

                    logoutButton.disabled = true;

                    logoutButton.textContent =
                        "Logging out...";


                    const response =
                        await fetch(
                            "/api/logout",
                            {
                                method: "POST",

                                credentials:
                                    "include",

                                headers: {
                                    "Accept":
                                        "application/json"
                                }
                            }
                        );


                    console.log(
                        "Logout status:",
                        response.status
                    );


                    const responseText =
                        await response.text();


                    console.log(
                        "Logout response:",
                        responseText
                    );


                } catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                } finally {

                    // Always return to login page

                    window.location.href =
                        "/login.html";

                }

            }
        );

    }


    // =====================================================
    // START
    // =====================================================

    loadDashboard();

});
