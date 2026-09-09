document.getElementById("loginForm").addEventListener("submit", async e => {

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
        error.textContent = "Username and password are required.";
        return;
    }

    try {

        const res = await fetch("login.php", {

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

        const text = await res.text();

        let data;

        try {

            data = JSON.parse(text);

        } catch (jsonError) {

            console.error("Invalid JSON from login.php:", text);

            throw new Error(
                "The login server returned an invalid response."
            );
        }

        if (!res.ok || !data.success) {

            throw new Error(
                data.message || "Invalid username or password."
            );
        }

        /*
         * Login successful
         */

        window.location.href = "dashboard.html";

    } catch (err) {

        console.error("Login error:", err);

        error.textContent = err.message ||
            "Unable to connect to the login service.";

    }

});
