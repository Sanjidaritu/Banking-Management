document.addEventListener("DOMContentLoaded", loadDashboard);

async function loadDashboard() {

    const errorMessage =
        document.getElementById("errorMessage");

    try {

        const response = await fetch(
            "https://banking-management-production.up.railway.app/api/dashboard",
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const contentType =
            response.headers.get("content-type") || "";

        const text = await response.text();

        console.log("Dashboard response:", text);

        if (!contentType.includes("application/json")) {

            throw new Error(
                "The Railway dashboard API returned HTML instead of JSON."
            );
        }

        const data = JSON.parse(text);

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load dashboard."
            );
        }

        // Username
        const username =
            document.getElementById("username");

        if (username) {
            username.textContent =
                data.username || "";
        }

        // Account number
        const accountNumber =
            document.getElementById("accountNumber");

        if (accountNumber && data.account) {

            const number =
                String(
                    data.account.account_number || ""
                );

            accountNumber.textContent =
                number.length >= 4
                    ? "•••• " + number.slice(-4)
                    : number;
        }

        // Account type
        const accountType =
            document.getElementById("accountType");

        if (accountType && data.account) {

            accountType.textContent =
                data.account.account_type || "";
        }

        // Current balance
        const currentBalance =
            document.getElementById("currentBalance");

        if (currentBalance && data.account) {

            currentBalance.textContent =
                formatMoney(
                    data.account.current_balance
                );
        }

        // Available balance
        const availableBalance =
            document.getElementById("availableBalance");

        if (availableBalance && data.account) {

            availableBalance.textContent =
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
                "Unable to load dashboard.";

            errorMessage.style.display = "block";
        }
    }
}


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


async function logout() {

    try {

        const response = await fetch(
            "https://banking-management-production.up.railway.app/api/logout",
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const data = await response.json();

        if (data.success) {

            window.location.href = "login.html";

        } else {

            alert(
                data.message ||
                "Logout failed."
            );
        }

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(
            "Unable to connect to logout service."
        );
    }
}
