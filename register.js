const $ = id => document.getElementById(id);

let enrollmentToken = null;


/* =========================================================
   STEP 1 — VERIFY EXISTING BANK CUSTOMER
   ========================================================= */

$("identityForm").addEventListener("submit", async e => {

  e.preventDefault();

  $("verifyError").textContent = "";

  const body = {
    account_number: $("accountNumber").value.trim(),
    ssn_last4: $("ssnLast4").value.trim(),
    date_of_birth: $("dateOfBirth").value,
    enrollment_reference: $("enrollmentReference").value.trim()
  };


  /* -----------------------------
     Validate SSN
     ----------------------------- */

  if (!/^\d{4}$/.test(body.ssn_last4)) {

    $("verifyError").textContent =
      "Enter exactly 4 digits for the SSN.";

    return;
  }


  /* -----------------------------
     Send verification request
     ----------------------------- */

  try {

    const res = await fetch("api/enrollment/verify.php", {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },

      body: JSON.stringify(body)

    });


    /* -----------------------------
       Read raw server response
       ----------------------------- */

    const text = await res.text();

    console.log("VERIFY STATUS:", res.status);

    console.log("VERIFY RAW RESPONSE:", text);


    /* -----------------------------
       Empty response
       ----------------------------- */

    if (!text.trim()) {

    throw new Error(
  "SERVER RESPONSE: " + text.substring(0, 500)
);
    }


    /* -----------------------------
       Convert response to JSON
       ----------------------------- */

    let data;

    try {

      data = JSON.parse(text);

    } catch (error) {

      console.error("JSON PARSE ERROR:", error);

      throw new Error(
        "verify.php returned this instead of JSON: " +
        text.substring(0, 500)
      );

    }


    /* -----------------------------
       Check API result
       ----------------------------- */

    if (!res.ok || !data.success) {

      throw new Error(
        data.message || "Verification failed."
      );

    }


    /* -----------------------------
       Save enrollment token
       ----------------------------- */

    enrollmentToken = data.enrollment_token;


    /* -----------------------------
       Move to Step 2
       ----------------------------- */

    $("step1").classList.remove("active");

    $("step2").classList.add("active");

  }


  /* -----------------------------
     Handle errors
     ----------------------------- */

  catch (err) {

    console.error("VERIFY ERROR:", err);

    $("verifyError").textContent = err.message;

  }

});


/* =========================================================
   USERNAME AVAILABILITY CHECK
   ========================================================= */

$("username").addEventListener("input", async () => {

  const username = $("username").value.trim();

  $("usernameStatus").textContent = "";

  $("usernameStatus").className = "status";


  /* -----------------------------
     Username format
     ----------------------------- */

  if (!/^[A-Za-z0-9_]{6,20}$/.test(username)) {

    return;

  }


  /* -----------------------------
     Check username with API
     ----------------------------- */

  try {

    const res = await fetch(
      "api/enrollment/check-username.php?username=" +
      encodeURIComponent(username)
    );


    const text = await res.text();

    console.log("USERNAME STATUS:", res.status);

    console.log("USERNAME RESPONSE:", text);


    if (!text.trim()) {

      return;

    }


    const data = JSON.parse(text);


    if (data.available) {

      $("usernameStatus").textContent =
        "Username is available.";

      $("usernameStatus").className =
        "status success";

    } else {

      $("usernameStatus").textContent =
        "Username is already taken.";

      $("usernameStatus").className =
        "status error";

    }

  }

  catch (error) {

    console.error("USERNAME CHECK ERROR:", error);

  }

});


/* =========================================================
   BACK BUTTON
   ========================================================= */

$("backBtn").addEventListener("click", () => {

  $("step2").classList.remove("active");

  $("step1").classList.add("active");

});


/* =========================================================
   STEP 2 — CREATE ONLINE BANKING LOGIN
   ========================================================= */

$("credentialsForm").addEventListener("submit", async e => {

  e.preventDefault();

  $("credentialError").textContent = "";


  const username =
    $("username").value.trim();

  const password =
    $("password").value;

  const confirm =
    $("confirmPassword").value;


  /* -----------------------------
     Validate username
     ----------------------------- */

  if (!/^[A-Za-z0-9_]{6,20}$/.test(username)) {

    $("credentialError").textContent =
      "Username must be 6-20 letters, numbers, or underscores.";

    return;

  }


  /* -----------------------------
     Validate password
     ----------------------------- */

  if (
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,72}$/.test(password)
  ) {

    $("credentialError").textContent =
      "Password must be 12-72 characters and include upper, lower, and a number.";

    return;

  }


  /* -----------------------------
     Confirm password
     ----------------------------- */

  if (password !== confirm) {

    $("credentialError").textContent =
      "Passwords do not match.";

    return;

  }


  /* -----------------------------
     Check enrollment token
     ----------------------------- */

  if (!enrollmentToken) {

    $("credentialError").textContent =
      "Your verification session expired. Start again.";

    return;

  }


  /* -----------------------------
     Create online banking account
     ----------------------------- */

  try {

    const res = await fetch(
      "api/enrollment/create.php",
      {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },

        body: JSON.stringify({

          enrollment_token:
            enrollmentToken,

          username:
            username,

          password:
            password

        })

      }
    );


    /* -----------------------------
       Read server response
       ----------------------------- */

    const text = await res.text();

    console.log("CREATE STATUS:", res.status);

    console.log("CREATE RESPONSE:", text);


    if (!text.trim()) {

      throw new Error(
        "create.php returned an EMPTY response. Check the PHP file."
      );

    }


    /* -----------------------------
       Parse JSON
       ----------------------------- */

    let data;

    try {

      data = JSON.parse(text);

    }

    catch (error) {

      console.error("CREATE JSON ERROR:", error);

      throw new Error(
        "create.php returned invalid JSON: " +
        text.substring(0, 500)
      );

    }


    /* -----------------------------
       Check API result
       ----------------------------- */

    if (!res.ok || !data.success) {

      throw new Error(
        data.message ||
        "Could not create account."
      );

    }


    /* -----------------------------
       Show created username
       ----------------------------- */

    $("createdUsername").textContent =
      data.username;


    /* -----------------------------
       Move to Step 3
       ----------------------------- */

    $("step2").classList.remove("active");

    $("step3").classList.add("active");


    /* -----------------------------
       Clear enrollment token
       ----------------------------- */

    enrollmentToken = null;

  }


  /* -----------------------------
     Handle errors
     ----------------------------- */

  catch (err) {

    console.error("CREATE ACCOUNT ERROR:", err);

    $("credentialError").textContent =
      err.message;

  }

});
