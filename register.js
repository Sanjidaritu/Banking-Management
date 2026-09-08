const $ = id => document.getElementById(id);
let enrollmentToken = null;

$("identityForm").addEventListener("submit", async e => {
  e.preventDefault();
  $("verifyError").textContent = "";

  const body = {
    account_number: $("accountNumber").value.trim(),
    ssn_last4: $("ssnLast4").value.trim(),
    date_of_birth: $("dateOfBirth").value,
    enrollment_reference: $("enrollmentReference").value.trim()
  };

  if (!/^\d{4}$/.test(body.ssn_last4)) {
    $("verifyError").textContent = "Enter exactly 4 digits for the SSN.";
    return;
  }

  try {
    const res = await fetch("api/enrollment/verify.php", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Verification failed.");
    enrollmentToken = data.enrollment_token;
    $("step1").classList.remove("active");
    $("step2").classList.add("active");
  } catch (err) {
    $("verifyError").textContent = err.message;
  }
});

$("username").addEventListener("input", async () => {
  const username = $("username").value.trim();
  $("usernameStatus").textContent = "";
  if (!/^[A-Za-z0-9_]{6,20}$/.test(username)) return;
  try {
    const res = await fetch("api/enrollment/check-username.php?username=" + encodeURIComponent(username));
    const data = await res.json();
    $("usernameStatus").textContent = data.available ? "Username is available." : "Username is already taken.";
    $("usernameStatus").className = "status " + (data.available ? "success" : "error");
  } catch (_) {}
});

$("backBtn").addEventListener("click", () => {
  $("step2").classList.remove("active");
  $("step1").classList.add("active");
});

$("credentialsForm").addEventListener("submit", async e => {
  e.preventDefault();
  $("credentialError").textContent = "";

  const username = $("username").value.trim();
  const password = $("password").value;
  const confirm = $("confirmPassword").value;

  if (!/^[A-Za-z0-9_]{6,20}$/.test(username)) {
    $("credentialError").textContent = "Username must be 6-20 letters, numbers, or underscores.";
    return;
  }
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,72}$/.test(password)) {
    $("credentialError").textContent = "Password must be 12-72 characters and include upper, lower, and a number.";
    return;
  }
  if (password !== confirm) {
    $("credentialError").textContent = "Passwords do not match.";
    return;
  }
  if (!enrollmentToken) {
    $("credentialError").textContent = "Your verification session expired. Start again.";
    return;
  }

  try {
    const res = await fetch("api/enrollment/create.php", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({enrollment_token: enrollmentToken, username, password})
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Could not create account.");

    $("createdUsername").textContent = data.username;
    $("step2").classList.remove("active");
    $("step3").classList.add("active");
    enrollmentToken = null;
  } catch (err) {
    $("credentialError").textContent = err.message;
  }
});
