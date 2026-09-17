document.addEventListener("DOMContentLoaded", async function () {

    const loadingMessage =
        document.getElementById("loadingMessage");

    const dashboardContent =
        document.getElementById("dashboardContent");

    const errorMessage =
        document.getElementById("errorMessage");


    try {

        const response = await fetch(
            "/api/dashboard",
            {
                method: "GET",
                credentials: "include"
            }
        );


        const data = await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load dashboard."
            );

        }


        /*
        ----------------------------------------------
        ACCOUNT DATA FROM BACKEND
        ----------------------------------------------
        */

        const account = data.account;


        /*
        ----------------------------------------------
        CUSTOMER NAME
        ----------------------------------------------
        */

        /*
        Your current /api/dashboard route does not
        return first_name/last_name.

        So the account information available from
        your existing backend is displayed below.
        */


        document.getElementById("username").textContent =
            data.username || "-";


        /*
        ----------------------------------------------
        ACCOUNT NUMBER
        ----------------------------------------------
        */

        const accountNumber =
            String(account.account_number || "");

        const lastFour =
            accountNumber.slice(-4);

        document.getElementById("accountNumber").textContent =
            lastFour
                ? "••••" + lastFour
                : "-";


        /*
        ----------------------------------------------
        ACCOUNT TYPE
        ----------------------------------------------
        */

        document.getElementById("accountType").textContent =
            account.account_type || "-";


        /*
        ----------------------------------------------
        BALANCES
        ----------------------------------------------
        */

        document.getElementById("currentBalance").textContent =
            formatMoney(account.current_balance);


        document.getElementById("availableBalance").textContent =
            formatMoney(account.available_balance);


        /*
        ----------------------------------------------
        CUSTOMER NAME
        ----------------------------------------------
        */

        document.getElementById("welcomeName").textContent =
            "Welcome";


        document.getElementById("customerName").textContent =
            "-";


        /*
        ----------------------------------------------
        SHOW DASHBOARD
        ----------------------------------------------
        */

        loadingMessage.style.display = "none";

        dashboardContent.style.display = "block";


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        loadingMessage.style.display = "none";

        errorMessage.textContent =
            error.message ||
            "Unable to load your account.";

        errorMessage.style.display = "block";

    }


    /*
    ----------------------------------------------
    FORMAT MONEY
    ----------------------------------------------
    */

    function formatMoney(amount) {

        const number =
            Number(amount);

        if (Number.isNaN(number)) {
            return "$0.00";
        }

        return new Intl.NumberFormat(
            "en-US",
            {
                style: "currency",
                currency: "USD"
            }
        ).format(number);

    }


    /*
    ----------------------------------------------
    LOGOUT
    ----------------------------------------------
    */

    document
        .getElementById("logoutButton")
        .addEventListener(
            "click",
            async function () {

                try {

                    await fetch(
                        "/api/logout",
                        {
                            method: "POST",
                            credentials: "include"
                        }
                    );

                } catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                }

                window.location.href =
                    "login.html";

            }
        );

});
