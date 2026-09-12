document.getElementById("loginForm").addEventListener("submit", async function (e) {

e.preventDefault();

const error = document.getElementById("error");

error.textContent = "";

const username = document.getElementById("username").value.trim();
const password = document.getElementById("password").value;

if (!username || !password) {
    error.textContent = "Username and password are required.";
    return;
}

try {

    const response = await fetch("login.php", {

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

        error.textContent =
            data.message || "Invalid username or password.";

        return;
    }

    // Login successful
    window.location.href = "dashboard.html";

} catch (error) {

    console.error("Login error:", error);

    error.textContent =
        "Unable to connect to the login server.";

}

});
