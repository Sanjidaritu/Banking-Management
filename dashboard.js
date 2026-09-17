document.addEventListener("DOMContentLoaded", loadDashboard);

async function loadDashboard() {
const loadingMessage = document.getElementById("loadingMessage");
const dashboardContent = document.getElementById("dashboardContent");
const errorMessage = document.getElementById("errorMessage");

try {
    const response = await fetch("dashboard.php", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
            "Accept": "application/json"
        }
    });

    const text = await response.text();

    console.log("dashboard.php response:", text);

    let data;

    try {
        data = JSON.parse(text);
    } catch (jsonError) {
        console.error("Invalid JSON:", text);
        throw new Error("Dashboard server returned an invalid response.");
    }

    if (!response.ok || !data.success) {
        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        throw new Error(
            data.message || "Unable to load account information."
        );
    }

    const usernameElement = document.getElementById("username");

    if (usernameElement) {
        usernameElement.textContent = data.username || "";
    }

    const welcomeNameElement = document.getElementById("welcomeName");

    if (welcomeNameElement && data.customer) {
        welcomeNameElement.textContent =
            "Welcome, " + data.customer.first_name;
    }

    const customerNameElement = document.getElementById("customerName");

    if (customerNameElement && data.customer) {
        customerNameElement.textContent =
            data.customer.first_name + " " +
            data.customer.last_name;
    }

    const accountNumberElement =
        document.getElementById("accountNumber");

    if (accountNumberElement && data.account) {
        const accountNumber =
            String(data.account.account_number || "");

        if (accountNumber.length >= 4) {
            accountNumberElement.textContent =
                "•••• " + accountNumber.slice(-4);
        } else {
            accountNumberElement.textContent =
                accountNumber;
        }
    }

    const accountTypeElement =
        document.getElementById("accountType");

    if (accountTypeElement && data.account) {
        accountTypeElement.textContent =
            capitalize(data.account.account_type || "");
    }

    const accountStatusElement =
        document.getElementById("accountStatus");

    if (accountStatusElement) {
        accountStatusElement.textContent = "Active";
    }

    const currentBalanceElement =
        document.getElementById("currentBalance");

    if (currentBalanceElement && data.account) {
        currentBalanceElement.textContent =
            formatMoney(data.account.current_balance);
    }

    const availableBalanceElement =
        document.getElementById("availableBalance");

    if (availableBalanceElement && data.account) {
        availableBalanceElement.textContent =
            formatMoney(data.account.available_balance);
    }

    if (loadingMessage) {
        loadingMessage.style.display = "none";
    }

    if (dashboardContent) {
        dashboardContent.style.display = "block";
    }

    if (errorMessage) {
        errorMessage.style.display = "none";
    }

} catch (error) {
    console.error("Dashboard error:", error);

    if (loadingMessage) {
        loadingMessage.style.display = "none";
    }

    if (dashboardContent) {
        dashboardContent.style.display = "none";
    }

    if (errorMessage) {
        errorMessage.textContent =
            error.message ||
            "Unable to load account information.";

        errorMessage.style.display = "block";
    }
}

}

function formatMoney(value) {
const amount = Number(value);

if (Number.isNaN(amount)) {
    return "$0.00";
}

return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD"
});

}

function capitalize(value) {
if (!value) {
return "";
}

return value.charAt(0).toUpperCase() +
    value.slice(1);

}

async function logout() {
try {
await fetch("logout.php", {
method: "POST",
credentials: "include",
cache: "no-store"
});
} catch (error) {
console.error("Logout error:", error);
}


window.location.href = "login.html";

}

const logoutButton =
document.getElementById("logoutButton");

if (logoutButton) {
logoutButton.addEventListener("click", logout);
}
