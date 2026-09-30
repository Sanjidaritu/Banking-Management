document.addEventListener("DOMContentLoaded", loadDashboard);


/* =========================================================
   LOAD DASHBOARD
   ========================================================= */

async function loadDashboard() {

    const loadingMessage =
        document.getElementById("loadingMessage");

    const dashboardContent =
        document.getElementById("dashboardContent");

    const errorMessage =
        document.getElementById("errorMessage");


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

            throw new Error(
                "Dashboard server returned an invalid response."
            );

        }


        if (!response.ok || !data.success) {

            if (response.status === 401) {

                window.location.href = "login.html";

                return;
            }


            throw new Error(
                data.message ||
                "Unable to load account information."
            );

        }


        /* =====================================================
           USERNAME
           ===================================================== */

        const usernameElement =
            document.getElementById("username");

        if (usernameElement) {

            usernameElement.textContent =
                data.username || "";

        }


        /* =====================================================
           WELCOME NAME
           ===================================================== */

        const welcomeNameElement =
            document.getElementById("welcomeName");

        if (
            welcomeNameElement &&
            data.customer
        ) {

            welcomeNameElement.textContent =
                "Welcome, " +
                data.customer.first_name;

        }


        /* =====================================================
           CUSTOMER NAME
           ===================================================== */

        const customerNameElement =
            document.getElementById("customerName");

        if (
            customerNameElement &&
            data.customer
        ) {

            customerNameElement.textContent =
                data.customer.first_name +
                " " +
                data.customer.last_name;

        }


        /* =====================================================
           ACCOUNT NUMBER
           ===================================================== */

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


        /* =====================================================
           ACCOUNT TYPE
           ===================================================== */

        const accountTypeElement =
            document.getElementById("accountType");


        if (
            accountTypeElement &&
            data.account
        ) {

            accountTypeElement.textContent =
                capitalize(
                    data.account.account_type || ""
                );

        }


        /* =====================================================
           ACCOUNT STATUS
           ===================================================== */

        const accountStatusElement =
            document.getElementById("accountStatus");


        if (accountStatusElement) {

            accountStatusElement.textContent =
                capitalize(
                    data.account.account_status ||
                    "Active"
                );

        }


        /* =====================================================
           CURRENT BALANCE
           ===================================================== */

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


        /* =====================================================
           AVAILABLE BALANCE
           ===================================================== */

        const availableBalanceElement =
            document.getElementById(
                "availableBalance"
            );


        if (
            availableBalanceElement &&
            data.account
        ) {

            availableBalanceElement.textContent =
                formatMoney(
                    data.account.available_balance
                );

        }


        /* =====================================================
           TRANSACTION ACCOUNT DROPDOWN
           ===================================================== */

        setupTransactionAccount(
            data.account
        );


        /* =====================================================
           SHOW DASHBOARD
           ===================================================== */

        if (loadingMessage) {

            loadingMessage.style.display =
                "none";

        }


        if (dashboardContent) {

            dashboardContent.style.display =
                "block";

        }


        if (errorMessage) {

            errorMessage.style.display =
                "none";

        }


        /* =====================================================
           LOAD TRANSACTIONS
           ===================================================== */

        await loadTransactions();


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        if (loadingMessage) {

            loadingMessage.style.display =
                "none";

        }


        if (dashboardContent) {

            dashboardContent.style.display =
                "none";

        }


        if (errorMessage) {

            errorMessage.textContent =
                error.message ||
                "Unable to load account information.";

            errorMessage.style.display =
                "block";

        }

    }

}


/* =========================================================
   SETUP TRANSACTION ACCOUNT
   ========================================================= */

function setupTransactionAccount(account) {

    const select =
        document.getElementById(
            "transactionAccount"
        );


    if (!select || !account) {

        return;
    }


    const accountNumber =
        String(
            account.account_number || ""
        );


    const lastFour =
        accountNumber.length >= 4
            ? accountNumber.slice(-4)
            : accountNumber;


    const accountType =
        capitalize(
            account.account_type || ""
        );


    select.innerHTML = "";


    const option =
        document.createElement("option");


    option.value =
        accountNumber;


    option.textContent =
        accountType +
        " •••• " +
        lastFour;


    select.appendChild(option);

}


/* =========================================================
   LOAD TRANSACTIONS
   ========================================================= */

async function loadTransactions() {

    const fromDate =
        document.getElementById(
            "fromDate"
        ).value;


    const toDate =
        document.getElementById(
            "toDate"
        ).value;


    const transactionLoading =
        document.getElementById(
            "transactionLoading"
        );


    const tableBody =
        document.getElementById(
            "transactionTableBody"
        );


    const noTransactions =
        document.getElementById(
            "noTransactions"
        );


    try {

        if (transactionLoading) {

            transactionLoading.style.display =
                "block";

        }


        if (tableBody) {

            tableBody.innerHTML = "";

        }


        if (noTransactions) {

            noTransactions.style.display =
                "none";

        }


        let url =
            "dashboard.php?transactions=1";


        if (fromDate) {

            url +=
                "&from_date=" +
                encodeURIComponent(fromDate);

        }


        if (toDate) {

            url +=
                "&to_date=" +
                encodeURIComponent(toDate);

        }


        const response =
            await fetch(url, {

                method: "GET",

                credentials: "include",

                cache: "no-store",

                headers: {
                    "Accept": "application/json"
                }

            });


        const text =
            await response.text();


        console.log(
            "Transaction response:",
            text
        );


        let data;


        try {

            data = JSON.parse(text);

        } catch (error) {

            throw new Error(
                "Transaction server returned an invalid response."
            );

        }


        if (!response.ok || !data.success) {

            if (response.status === 401) {

                window.location.href =
                    "login.html";

                return;

            }


            throw new Error(
                data.message ||
                "Unable to load transactions."
            );

        }


        renderTransactions(
            data.transactions || []
        );


    } catch (error) {

        console.error(
            "Transaction error:",
            error
        );


        if (tableBody) {

            tableBody.innerHTML = "";

        }


        if (noTransactions) {

            noTransactions.textContent =
                error.message ||
                "Unable to load transactions.";

            noTransactions.style.display =
                "block";

        }


    } finally {

        if (transactionLoading) {

            transactionLoading.style.display =
                "none";

        }

    }

}


/* =========================================================
   RENDER TRANSACTIONS
   ========================================================= */

function renderTransactions(transactions) {

    const tableBody =
        document.getElementById(
            "transactionTableBody"
        );


    const noTransactions =
        document.getElementById(
            "noTransactions"
        );


    if (!tableBody) {

        return;
    }


    tableBody.innerHTML = "";


    if (!transactions.length) {

        if (noTransactions) {

            noTransactions.textContent =
                "No transactions found for the selected date range.";

            noTransactions.style.display =
                "block";

        }

        return;
    }


    if (noTransactions) {

        noTransactions.style.display =
            "none";

    }


    transactions.forEach(
        function (transaction) {

            const row =
                document.createElement("tr");


            /* =================================================
               DATE
               ================================================= */

            const dateCell =
                document.createElement("td");

            dateCell.textContent =
                formatTransactionDate(
                    transaction.transaction_date
                );


            /* =================================================
               DESCRIPTION
               ================================================= */

            const descriptionCell =
                document.createElement("td");

            descriptionCell.textContent =
                transaction.description || "";


            /* =================================================
               TYPE
               ================================================= */

            const typeCell =
                document.createElement("td");

            typeCell.className =
                "type-cell";


            const badge =
                document.createElement("span");


            badge.className =
                "transaction-badge " +
                (
                    transaction.transaction_type ===
                    "Credit"
                        ? "credit-badge"
                        : "debit-badge"
                );


            badge.textContent =
                transaction.transaction_type;


            typeCell.appendChild(badge);


            /* =================================================
               AMOUNT
               ================================================= */

            const amountCell =
                document.createElement("td");

            amountCell.className =
                "amount-cell " +
                (
                    transaction.transaction_type ===
                    "Credit"
                        ? "credit-amount"
                        : "debit-amount"
                );


            const amount =
                Number(
                    transaction.amount
                );


            const signedAmount =
                transaction.transaction_type ===
                "Credit"
                    ? amount
                    : -amount;


            amountCell.textContent =
                formatMoney(
                    signedAmount
                );


            /* =================================================
               BALANCE
               ================================================= */

            const balanceCell =
                document.createElement("td");

            balanceCell.className =
                "balance-cell";


            balanceCell.textContent =
                formatMoney(
                    transaction.balance_after
                );


            /* =================================================
               ADD CELLS
               ================================================= */

            row.appendChild(dateCell);

            row.appendChild(descriptionCell);

            row.appendChild(typeCell);

            row.appendChild(amountCell);

            row.appendChild(balanceCell);


            tableBody.appendChild(row);

        }
    );

}


/* =========================================================
   FORMAT TRANSACTION DATE
   ========================================================= */

function formatTransactionDate(dateValue) {

    if (!dateValue) {

        return "";

    }


    const parts =
        String(dateValue).split("-");


    if (parts.length !== 3) {

        return dateValue;

    }


    const year =
        Number(parts[0]);

    const month =
        Number(parts[1]);

    const day =
        Number(parts[2]);


    const date =
        new Date(
            year,
            month - 1,
            day
        );


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "2-digit",
            year: "numeric"
        }
    );

}


/* =========================================================
   FORMAT MONEY
   ========================================================= */

function formatMoney(value) {

    const amount =
        Number(value);


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


/* =========================================================
   CAPITALIZE
   ========================================================= */

function capitalize(value) {

    if (!value) {

        return "";

    }


    return value.charAt(0).toUpperCase() +
        value.slice(1);

}


/* =========================================================
   TRANSACTION SEARCH
   ========================================================= */

const transactionSearchButton =
    document.getElementById(
        "transactionSearchButton"
    );


if (transactionSearchButton) {

    transactionSearchButton.addEventListener(
        "click",
        function () {

            loadTransactions();

        }
    );

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

    try {

        await fetch(
            "logout.php",
            {
                method: "POST",
                credentials: "include",
                cache: "no-store"
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


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logout
    );

}
