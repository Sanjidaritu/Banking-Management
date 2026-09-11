document
    .getElementById("loginForm")
    .addEventListener("submit", async function (e) {

        e.preventDefault();

        const error = document.getElementById("error");

        error.textContent = "";

        const username = document
            .getElementById("username")
            .value
            .trim();

        const password = document
            .getElementById("password")
            .value;

        if (!username || !password) {

            error.textContent =
                "Username and password are required.";

            return;
        }

        try {

            const response = await fetch("/api/login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Invalid username or password."
                );
            }

            // Login successful
            window.location.href = "/dashboard";

        } catch (error) {

            console.error("Login error:", error);

            document.getElementById("error").textContent =
                error.message ||
                "Unable to connect to the banking server.";
        }
    });
