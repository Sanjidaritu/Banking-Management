document.addEventListener("DOMContentLoaded", loadDashboard);

async function loadDashboard() {

    const errorMessage = document.getElementById("errorMessage");
    const dashboardContent = document.getElementById("dashboardContent");

    try {

        const response = await fetch("/api/dashboard", {
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        });

        const contentType =
            response.headers.get("content-type") || "";

        const text = await response.text();

        // Make sure the server actually returned JSON
        if (!contentType.includes("application/json")) {

            console.error(
                "Dashboard returned non-JSON:",
                text
            );

            throw new Error(
                "Dashboard server returned an HTML page instead of JSON."
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
        const usernameElement =
            document.getElementById("username");

        if (usernameElement) {
            usernameElement.textContent =
                data.username || "";
        }

        // Account number
        const accountNumberElement =
            document.getElementById("accountNumber");

        if (accountNumberElement && data.account) {

            const accountNumber =
                String(data.account.account_number || "");

            if (accountNumber.length >= 4) {

                accountNumberElement.textContent =
                    "•••• " +
                    accountNumber.slice(-4);

            } else {

                accountNumberElement.textContent =
                    accountNumber;
            }
        }

        // Account type
        const accountTypeElement =
            document.getElementById("accountType");

        if (accountTypeElement && data.account) {

            accountTypeElement.textContent =
                data.account.account_type || "";
        }

        // Current balance
        const currentBalanceElement =
            document.getElementById("currentBalance");

        if (currentBalanceElement && data.account) {

            currentBalanceElement.textContent =
                formatMoney(
                    data.account.current_balance
                );
        }

        // Available balance
        const availableBalanceElement =
            document.getElementById("availableBalance");

        if (availableBalanceElement && data.account) {

            availableBalanceElement.textContent =
                formatMoney(
                    data.account.available_balance
                );
        }

        if (dashboardContent) {
            dashboardContent.style.display = "block";
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

    const number = Number(value);

    if (Number.isNaN(number)) {
        return "$0.00";
    }

    return number.toLocaleString(
        "en-US",
        {
            style: "currency",
            currency: "USD"
        }
    );
}


async function logout() {

    try {

        const response = await fetch("/api/logout", {
            method: "POST",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        });

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
            "Unable to logout."
        );
    }
}

