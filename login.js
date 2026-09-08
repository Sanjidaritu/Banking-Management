document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const error = document.getElementById("error");
  error.textContent = "";

  try {
    const res = await fetch("api/auth/login.php", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        username: document.getElementById("username").value.trim(),
        password: document.getElementById("password").value
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Login failed.");
    window.location.href = "dashboard.html";
  } catch (err) {
    error.textContent = err.message;
  }
});
