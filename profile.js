
"use strict";

const API_URL = "/api/profile.php";

const form = document.getElementById("profileForm");
const profileCard = document.getElementById("profileCard");
const loading = document.getElementById("loading");
const message = document.getElementById("message");
const saveBtn = document.getElementById("saveBtn");
const logoutBtn = document.getElementById("logoutBtn");

/*
|--------------------------------------------------------------------------
| Display messages
|--------------------------------------------------------------------------
*/

function showMessage(text, type) {
    message.textContent = text;
    message.className = "message " + type;
}

function clearMessage() {
    message.textContent = "";
    message.className = "message";
}

/*
|--------------------------------------------------------------------------
| Verification status
|--------------------------------------------------------------------------
*/

function setVerification(elementId, verified) {
    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = verified
        ? "Verified"
        : "Not verified";

    element.className =
        "verification-status " +
        (verified ? "verified" : "unverified");
}

/*
|--------------------------------------------------------------------------
| Populate profile form
|--------------------------------------------------------------------------
*/

function populateProfile(data) {

    document.getElementById("firstName").value =
        data.firstName || "";

    document.getElementById("lastName").value =
        data.lastName || "";

    document.getElementById("dateOfBirth").value =
        data.dateOfBirth || "";

    document.getElementById("ssnLast4").value =
        data.ssnLast4 ? "****" + data.ssnLast4 : "Not available";

    document.getElementById("email").value =
        data.email || "";

    document.getElementById("phone").value =
        data.phone || "";

    document.getElementById("streetAddress").value =
        data.streetAddress || "";

    document.getElementById("city").value =
        data.city || "";

    document.getElementById("state").value =
        data.state || "";

    document.getElementById("zipCode").value =
        data.zipCode || "";

    setVerification(
        "emailVerification",
        data.emailVerified === true
    );

    setVerification(
        "phoneVerification",
        data.phoneVerified === true
    );
}

/*
|--------------------------------------------------------------------------
| Load customer profile
|--------------------------------------------------------------------------
*/

async function loadProfile() {

    loading.hidden = false;
    profileCard.hidden = true;

    clearMessage();

    try {

        const response = await fetch(API_URL, {
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        });

        const contentType =
            response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
            throw new Error(
                "Invalid server response. Check your PHP API endpoint."
            );
        }

        const data = await response.json();

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to load profile."
            );
        }

        populateProfile(data);

        profileCard.hidden = false;

    } catch (error) {

        console.error("Profile loading error:", error);

        showMessage(error.message, "error");

    } finally {

        loading.hidden = true;
    }
}

/*
|--------------------------------------------------------------------------
| Validate profile form
|--------------------------------------------------------------------------
*/

function validateProfile(data) {

    const requiredFields = [
        ["First name", data.firstName],
        ["Last name", data.lastName],
        ["Email", data.email],
        ["Phone", data.phone],
        ["Street address", data.streetAddress],
        ["City", data.city],
        ["State", data.state],
        ["ZIP code", data.zipCode]
    ];

    for (const [label, value] of requiredFields) {

        if (!value) {
            return label + " is required.";
        }
    }

    if (data.firstName.length > 100 ||
        data.lastName.length > 100) {
        return "First name and last name must not exceed 100 characters.";
    }

    if (data.email.length > 255) {
        return "Email address is too long.";
    }

    if (data.phone.length > 30) {
        return "Phone number is too long.";
    }

    if (data.streetAddress.length > 255) {
        return "Street address is too long.";
    }

    if (data.city.length > 100 ||
        data.state.length > 100) {
        return "City or state is too long.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(data.email)) {
        return "Please enter a valid email address.";
    }

    const phonePattern = /^\+?[0-9\s().-]{7,30}$/;

    if (!phonePattern.test(data.phone)) {
        return "Please enter a valid phone number.";
    }

    const zipPattern = /^\d{5}(-\d{4})?$/;

    if (!zipPattern.test(data.zipCode)) {
        return "Please enter a valid US ZIP code.";
    }

    return null;
}

/*
|--------------------------------------------------------------------------
| Save customer profile
|--------------------------------------------------------------------------
*/

async function saveProfile(event) {

    event.preventDefault();

    clearMessage();

    const profileData = {

        firstName:
            document.getElementById("firstName").value.trim(),

        lastName:
            document.getElementById("lastName").value.trim(),

        email:
            document.getElementById("email").value.trim(),

        phone:
            document.getElementById("phone").value.trim(),

        streetAddress:
            document.getElementById("streetAddress").value.trim(),

        city:
            document.getElementById("city").value.trim(),

        state:
            document.getElementById("state").value.trim(),

        zipCode:
            document.getElementById("zipCode").value.trim()
    };

    const validationError = validateProfile(profileData);

    if (validationError) {
        showMessage(validationError, "error");
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {

        const response = await fetch(API_URL, {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(profileData)
        });

        const contentType =
            response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
            throw new Error(
                "Invalid server response. Check your PHP API endpoint."
            );
        }

        const data = await response.json();

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to save profile."
            );
        }

        setVerification(
            "emailVerification",
            data.emailVerified === true
        );

        setVerification(
            "phoneVerification",
            data.phoneVerified === true
        );

        if (
            data.emailVerificationRequired ||
            data.phoneVerificationRequired
        ) {

            showMessage(
                "Profile updated successfully. Your changed email or phone number requires verification.",
                "success"
            );

        } else {

            showMessage(
                "Profile updated successfully.",
                "success"
            );
        }

    } catch (error) {

        console.error("Profile save error:", error);

        showMessage(error.message, "error");

    } finally {

        saveBtn.disabled = false;
        saveBtn.textContent = "Save Profile";
    }
}

/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

async function logout() {

    logoutBtn.disabled = true;

    try {

        const response = await fetch("logout.php", {
            method: "POST",
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error("Logout failed.");
        }

        window.location.href = "login.html";

    } catch (error) {

        console.error("Logout error:", error);

        showMessage(
            "Unable to log out. Please try again.",
            "error"
        );

        logoutBtn.disabled = false;
    }
}

/*
|--------------------------------------------------------------------------
| Event listeners
|--------------------------------------------------------------------------
*/

document.addEventListener("DOMContentLoaded", function() {

    if (form) {
        form.addEventListener("submit", saveProfile);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }

    loadProfile();
});
