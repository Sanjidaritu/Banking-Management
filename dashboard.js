document.addEventListener("DOMContentLoaded", loadDashboard);


async function loadDashboard() {

    const loading = document.getElementById("loading");
    const errorMessage = document.getElementById("errorMessage");
    const accountsContainer =
        document.getElementById("accountsContainer");

    try {

        const response = await fetch("/api/dashboard", {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        loading.style.display = "none";

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load dashboard."
            );
        }


        // Welcome message
        document.getElementById("welcomeMessage").textContent =
            `Welcome, ${data.customer.firstName}.`;


        // No accounts
        if (!data.accounts || data.accounts.length === 0) {

            accountsContainer.innerHTML = `
                <div class="no-accounts">
                    No active checking or savings accounts
                    were found.
                </div>
            `;

            return;
        }


        // Create account cards
        accountsContainer.innerHTML =
            data.accounts.map(account => {

                return `
                    <div class="account-card">

                        <div class="account-type">
                            ${escapeHtml(account.accountType)}
                        </div>

                        <div class="account-number">
                            ${escapeHtml(
                                account.maskedAccountNumber
                            )}
                        </div>

                        <div class="balance-row">

                            <span class="balance-label">
                                Current Balance
                            </span>

                            <span class="balance-value">
                                ${formatCurrency(
                                    account.currentBalance
                                )}
                            </span>

                        </div>


                        <div class="balance-row">

                            <span class="balance-label">
                                Available Balance
                            </span>

                            <span class="balance-value">
                                ${formatCurrency(
                                    account.availableBalance
                                )}
                            </span>

                        </div>

                    </div>
                `;

            }).join("");

    } catch (error) {

        console.error(error);

        loading.style.display = "none";

        errorMessage.hidden = false;

        errorMessage.textContent =
            "Unable to load your account information. Please try again later.";
    }
}


function formatCurrency(amount) {

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    }).format(amount);
}


function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}


document
    .getElementById("logoutButton")
    .addEventListener("click", async () => {

        try {

            await fetch("/api/logout", {
                method: "POST",
                credentials: "include"
            });

        } finally {

            window.location.href = "/login.html";
        }
    });
