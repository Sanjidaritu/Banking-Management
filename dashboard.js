
document.addEventListener("DOMContentLoaded", loadDashboard);


/* =====================================================
   LOAD DASHBOARD
===================================================== */

async function loadDashboard() {

    const welcomeMessage =
        document.getElementById("welcomeMessage");

    const accountInfo =
        document.getElementById("accountInfo");

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


        /*
         * User is not logged in
         */

        if (response.status === 401) {

            window.location.href =
                "login.html";

            return;
        }


        /*
         * Server error
         */

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load dashboard."
            );
        }


        /*
         * Welcome message
         */

        welcomeMessage.textContent =
            "Welcome, " + data.username;


        /*
         * Display account
         */

        accountInfo.innerHTML = `

            <p>
                <strong>Account Number:</strong>
                ${data.account.account_number}
            </p>

            <p>
                <strong>Account Type:</strong>
                ${data.account.account_type}
            </p>

            <p>
                <strong>Current Balance:</strong>
                $${Number(
                    data.account.current_balance
                ).toFixed(2)}
            </p>

            <p>
                <strong>Available Balance:</strong>
                $${Number(
                    data.account.available_balance
                ).toFixed(2)}
            </p>

        `;


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        errorMessage.textContent =
            error.message ||
            "Unable to load account information.";

    }

}


/* =====================================================
   LOGOUT
===================================================== */

document
    .getElementById("logoutButton")
    .addEventListener("click", async function () {

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

    });

