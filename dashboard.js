document.addEventListener("DOMContentLoaded", loadDashboard);


async function loadDashboard() {

    const errorMessage =
        document.getElementById("errorMessage");

    try {

        const response = await fetch("dashboard.php", {

            method: "GET",

            credentials: "include",

            headers: {
                "Accept": "application/json"
            }

        });


        const text = await response.text();

        let data;

        try {

            data = JSON.parse(text);

        } catch (error) {

            console.error(
                "Invalid dashboard response:",
                text
            );

            throw new Error(
                "Dashboard returned an invalid response."
            );
        }


        if (!response.ok || !data.success) {

            if (response.status === 401) {

                window.location.href = "login.html";
                return;

            }

            throw new Error(
                data.message ||
                "Unable to load dashboard."
            );
        }


        // ==================================================
        // USERNAME
        // ==================================================

        const usernameElement =
            document.getElementById("username");

        if (usernameElement) {

            usernameElement.textContent =
                data.username || "";

        }


        // ==================================================
        // CUSTOMER NAME
        // ==================================================

        const customerNameElement =
            document.getElementById("customerName");

        if (
            customerNameElement &&
            data.customer
        ) {

            customerNameElement.textContent =
                `${data.customer.first_name} ${data.customer.last_name}`;

        }


        // ==================================================
        // ACCOUNT NUMBER
        // ==================================================

        const accountNumberElement =
            document.getElementById("accountNumber");

        if (
            accountNumberElement &&
            data.account
        ) {

            const accountNumber =
                String(
                    data.account.account_number || ""
                );


            if (accountNumber.length >= 4) {

                accountNumberElement.textContent =
                    "•••• " +
                    accountNumber.slice(-4);

            } else {

                accountNumberElement.textContent =
                    accountNumber;

            }

        }


        // ==================================================
        // ACCOUNT TYPE
        // ==================================================

        const accountTypeElement =
            document.getElementById("accountType");

        if (
            accountTypeElement &&
            data.account
        ) {

            accountTypeElement.textContent =
                data.account.account_type || "";

        }


        // ==================================================
        // CURRENT BALANCE
        // ==================================================

        const currentBalanceElement =
            document.getElementById("currentBalance");

        if (
            currentBalanceElement &&
            data.account
        ) {

            currentBalanceElement.textContent =
                formatMoney(
                    data.account.current_balance
                );

        }


        // ==================================================
        // AVAILABLE BALANCE
        // ==================================================

        const availableBalanceElement =
            document.getElementById("availableBalance");

        if (
            availableBalanceElement &&
            data.account
        ) {

            availableBalanceElement.textContent =
                formatMoney(
                    data.account.available_balance
                );

        }


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        if (errorMessage) {

            errorMessage.textContent =
                error.message ||
                "Unable to load account information.";

            errorMessage.style.display = "block";

        }

    }

}


// ======================================================
// FORMAT MONEY
// ======================================================

function formatMoney(value) {

    const amount = Number(value);

    if (Number.isNaN(amount)) {

        return "$0.00";

    }

    return amount.toLocaleString(
        "en-US",
        {
            style: "currency",
            currency: "USD"
        }
    );
}


// ======================================================
// LOGOUT
// ======================================================

async function logout() {

    try {

        const response = await fetch(
            "logout.php",
            {
                method: "POST",
                credentials: "include"
            }
        );


        if (response.ok) {

            window.location.href =
                "login.html";

            return;

        }


        window.location.href =
            "login.html";


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        window.location.href =
            "login.html";
    }

}
