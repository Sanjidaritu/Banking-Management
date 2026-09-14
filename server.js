const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const pool = require("./database");

const app = express();


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ======================================================
// SESSION
// ======================================================

app.use(session({
    secret: process.env.SESSION_SECRET || "upright-bank-secret-change-this",
    resave: false,
    saveUninitialized: false,

    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 1000
    }
}));


// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        message: "Upright Bank API is running.",
        version: "2026-09-14-VERIFY-PHP"
    });

});


// ======================================================
// VERIFY EXISTING BANK CUSTOMER
// ROUTE MUST STAY /verify.php
// ======================================================

app.post("/verify.php", async (req, res) => {

    console.log("========================================");
    console.log("VERIFY REQUEST RECEIVED");
    console.log("BODY:", req.body);
    console.log("========================================");

    try {

        // --------------------------------------------------
        // Make sure JSON body exists
        // --------------------------------------------------

        if (!req.body || typeof req.body !== "object") {

            return res.status(400).json({
                success: false,
                message: "Invalid JSON request."
            });

        }


        // --------------------------------------------------
        // Read submitted values
        // --------------------------------------------------

        const accountNumber =
            String(req.body.account_number || "").trim();

        const ssnLast4 =
            String(req.body.ssn_last4 || "").trim();

        const dateOfBirth =
            String(req.body.date_of_birth || "").trim();

        const enrollmentReference =
            String(req.body.enrollment_reference || "").trim();


        console.log("Account:", accountNumber);
        console.log("SSN Last 4:", ssnLast4);
        console.log("DOB:", dateOfBirth);
        console.log("Enrollment Reference:", enrollmentReference);


        // --------------------------------------------------
        // Basic validation
        // --------------------------------------------------

        if (
            !accountNumber ||
            !ssnLast4 ||
            !dateOfBirth ||
            !enrollmentReference
        ) {

            return res.status(400).json({
                success: false,
                message: "All verification fields are required."
            });

        }


        // SSN must be exactly 4 digits

        if (!/^\d{4}$/.test(ssnLast4)) {

            return res.status(400).json({
                success: false,
                message: "SSN last 4 digits must contain exactly 4 digits."
            });

        }


        // --------------------------------------------------
        // Find customer
        // --------------------------------------------------

        const [rows] = await pool.query(
            
            SELECT
                *
            FROM customers
            WHERE account_number = ?
            LIMIT 1
            ,
            [accountNumber]
        );


        if (!rows || rows.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Customer account was not found."
            });

        }


        const customer = rows[0];


        console.log("CUSTOMER FOUND:", customer);


        // --------------------------------------------------
        // Check active status
        // --------------------------------------------------

        if (
            customer.active !== undefined &&
            Number(customer.active) !== 1
        ) {

            return res.status(403).json({
                success: false,
                message: "This account is not active."
            });

        }


        // --------------------------------------------------
        // Check account_status if column exists
        // --------------------------------------------------

        if (
            customer.account_status !== undefined &&
            customer.account_status !== null &&
            String(customer.account_status).toLowerCase() !== "active"
        ) {

            return res.status(403).json({
                success: false,
                message: "This account is not active."
            });

        }


        // --------------------------------------------------
        // Check whether already enrolled
        // --------------------------------------------------

        if (
            customer.online_enrolled !== undefined &&
            Number(customer.online_enrolled) === 1
        ) {

            return res.status(409).json({
                success: false,
                message: "This customer is already enrolled in online banking."
            });

        }


        // --------------------------------------------------
        // Check SSN last 4
        // --------------------------------------------------

        const databaseSSN =
            String(customer.ssn_last4 || "").trim();


        if (databaseSSN !== ssnLast4) {

            return res.status(401).json({
                success: false,
                message: "The SSN information does not match our records."
            });

        }


        // --------------------------------------------------
        // Normalize DOB
        // Supports:
        //
        // 7/3/1991
        // 07/03/1991
        // 1991-07-03
        // --------------------------------------------------

        function normalizeDate(value) {

            const input = String(value || "").trim();

            // YYYY-MM-DD
            if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(input)) {

                const parts = input.split("-");

                return [
                    parts[0],
                    String(parts[1]).padStart(2, "0"),
                    String(parts[2]).padStart(2, "0")
                ].join("-");

            }


            // MM/DD/YYYY
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(input)) {

                const parts = input.split("/");

                const month = String(parts[0]).padStart(2, "0");
                const day = String(parts[1]).padStart(2, "0");
                const year = parts[2];

                return ${year}-${month}-${day};

            }


            // DD/MM/YYYY
            if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(input)) {

                const parts = input.split("-");

                const day = String(parts[0]).padStart(2, "0");
                const month = String(parts[1]).padStart(2, "0");
                const year = parts[2];

                return ${year}-${month}-${day};

            }


            return input;

        }


        const submittedDOB =
            normalizeDate(dateOfBirth);


        // --------------------------------------------------
        // Get database DOB safely
        // --------------------------------------------------

        let databaseDOB = customer.date_of_birth;


        if (databaseDOB instanceof Date) {

            databaseDOB =
                databaseDOB.toISOString().substring(0, 10);

        } else {

            databaseDOB =
                String(databaseDOB || "").substring(0, 10);

        }


        databaseDOB =
            normalizeDate(databaseDOB);


        console.log("Submitted DOB:", submittedDOB);
        console.log("Database DOB:", databaseDOB);


        // --------------------------------------------------
        // Compare DOB
        // --------------------------------------------------

        if (submittedDOB !== databaseDOB) {

            return res.status(401).json({
                success: false,
                message: "The date of birth does not match our records."
            });

        }


        // --------------------------------------------------
        // Check enrollment reference
        // --------------------------------------------------

        const storedReferenceHash =
            String(customer.enrollment_reference_hash || "").trim();


        if (!storedReferenceHash) {

            return res.status(500).json({
                success: false,
                message: "Enrollment reference is not configured for this account."
            });

        }


        let referenceHash =
            storedReferenceHash;


        // MySQL/PHP bcrypt hashes may start with $2y$
        // Node bcrypt expects $2b$

        if (referenceHash.startsWith("$2y$")) {

            referenceHash =
                "$2b$" + referenceHash.substring(4);

        }


        const referenceMatches =
            await bcrypt.compare(
                enrollmentReference,
                referenceHash
            );


        if (!referenceMatches) {

            return res.status(401).json({
                success: false,
                message: "The enrollment reference does not match our records."
            });

        }


        // --------------------------------------------------
        // Generate enrollment token
        // --------------------------------------------------

        const enrollmentToken =
            crypto.randomBytes(32).toString("hex");


        // --------------------------------------------------
        // Store enrollment information in session
        // --------------------------------------------------

        req.session.enrollment = {

            customerId:
                customer.customer_id !== undefined
                    ? customer.customer_id
                    : customer.id,

            accountNumber:
                customer.account_number,

            token:
                enrollmentToken,

            verifiedAt:
                Date.now()

        };


        // --------------------------------------------------
        // Return SUCCESS
        // --------------------------------------------------

        console.log("IDENTITY VERIFIED SUCCESSFULLY");

        return res.status(200).json({

            success: true,

            message:
                "Identity verified successfully.",

            enrollment_token:
                enrollmentToken

        });

    } catch (error) {

        console.error("VERIFY ERROR:");
        console.error(error);

        return res.status(500).json({

            success: false,

            message:
                "Server error while verifying customer identity."

        });

    }

});


// ======================================================
// CHECK USERNAME
// ======================================================

app.post("/api/check-username", async (req, res) => {

    try {

        const username =
            String(req.body.username || "").trim();


        if (!username) {

            return res.status(400).json({
                success: false,
                message: "Username is required."
            });

        }


        const [rows] = await pool.query(
            
            SELECT customer_id
            FROM online_users
            WHERE username = ?
            LIMIT 1
            ,
            [username]
        );


        if (rows.length > 0) {

            return res.json({

                success: true,
                available: false,
                message: "Username is already taken."

            });

        }


        return res.json({

            success: true,
            available: true,
            message: "Username is available."

        });

    } catch (error) {

        console.error("USERNAME CHECK ERROR:", error);

        return res.status(500).json({

            success: false,
            message: "Unable to check username."

        });

    }

});


// ======================================================
// CREATE ONLINE BANKING USER
// ======================================================

app.post("/api/create", async (req, res) => {

    try {

        const username =
            String(req.body.username || "").trim();

        const password =
            String(req.body.password || "");

        const enrollmentToken =
            String(req.body.enrollment_token || "").trim();


        // --------------------------------------------------
        // Validate request
        // --------------------------------------------------

        if (
            !username ||
            !password ||
            !enrollmentToken
        ) {

            return res.status(400).json({

                success: false,
                message: "Username, password and enrollment token are required."

            });

        }


        // --------------------------------------------------
        // Validate enrollment session
        // --------------------------------------------------

        if (
            !req.session.enrollment ||
            req.session.enrollment.token !== enrollmentToken
        ) {

            return res.status(401).json({

                success: false,
                message: "Invalid or expired enrollment session."

            });

        }


        // --------------------------------------------------
        // Check token expiration
        // 15 minutes
        // --------------------------------------------------

        const age =
            Date.now() -
            Number(req.session.enrollment.verifiedAt);


        if (age > 15 * 60 * 1000) {

            delete req.session.enrollment;

            return res.status(401).json({

                success: false,
                message: "Enrollment session has expired. Please verify your identity again."

            });

        }


        // --------------------------------------------------
        // Validate username
        // --------------------------------------------------

        if (!/^[A-Za-z0-9_]{6,20}$/.test(username)) {

            return res.status(400).json({

                success: false,
                message: "Username must contain 6-20 letters, numbers or underscores."

            });

        }


        // --------------------------------------------------
        // Validate password
        // --------------------------------------------------

        if (password.length < 8) {

            return res.status(400).json({

                success: false,
                message: "Password must be at least 8 characters."

            });

        }


        // --------------------------------------------------
        // Check username again
        // --------------------------------------------------

        const [existingUsers] = await pool.query(
            
            SELECT customer_id
            FROM online_users
            WHERE username = ?
            LIMIT 1
            ,
            [username]
        );


        if (existingUsers.length > 0) {

            return res.status(409).json({

                success: false,
                message: "Username is already taken."

            });

        }


        // --------------------------------------------------
        // Get customer
        // --------------------------------------------------

        const customerId =
            req.session.enrollment.customerId;


        const accountNumber =
            req.session.enrollment.accountNumber;


        const [customers] = await pool.query(
            
            SELECT *
            FROM customers
            WHERE account_number = ?
            LIMIT 1
            ,
            [accountNumber]
        );


        if (!customers.length) {

            return res.status(404).json({

                success: false,
                message: "Customer account could not be found."

            });

        }


        const customer =
            customers[0];


        // Make sure same customer

        const databaseCustomerId =
            customer.customer_id !== undefined
                ? customer.customer_id
                : customer.id;


        if (
            String(databaseCustomerId) !==
            String(customerId)
        ) {

            return res.status(403).json({

                success: false,
                message: "Enrollment session is invalid."

            });

        }


        // --------------------------------------------------
        // Check enrollment status
        // --------------------------------------------------

        if (
            customer.online_enrolled !== undefined &&
            Number(customer.online_enrolled) === 1
        ) {

            return res.status(409).json({

                success: false,
                message: "This customer is already enrolled."

            });

        }


        // --------------------------------------------------
        // Hash password
        // --------------------------------------------------

        const passwordHash =
            await bcrypt.hash(password, 10);


        // --------------------------------------------------
        // Create online banking user
        // --------------------------------------------------

        await pool.query(
            
            INSERT INTO online_users
            (
                customer_id,
                username,
                password_hash,
                active
            )
            VALUES (?, ?, ?, 1)
            ,
            [
                databaseCustomerId,
                username,
                passwordHash
            ]
        );


        // --------------------------------------------------
        // Mark customer as enrolled
        // --------------------------------------------------

        await pool.query(
            
            UPDATE customers
            SET online_enrolled = 1
            WHERE account_number = ?
            ,
            [accountNumber]
        );


        // --------------------------------------------------
        // Destroy enrollment session
        // --------------------------------------------------

        delete req.session.enrollment;


        return res.status(201).json({

            success: true,

            message:
                "Online banking account created successfully."

        });

    } catch (error) {

        console.error("CREATE USER ERROR:");
        console.error(error);

        // Duplicate username protection

        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({

                success: false,
                message: "Username is already taken."

            });

        }


        return res.status(500).json({

            success: false,
            message:
                "Unable to create online banking account."

        });

    }

});


// ======================================================
// LOGIN
// ======================================================

app.post("/api/login", async (req, res) => {

    try {

        const username =
            String(req.body.username || "").trim();

        const password =
            String(req.body.password || "");


        if (!username || !password) {

            return res.status(400).json({

                success: false,
                message: "Username and password are required."

            });

        }


        // --------------------------------------------------
        // Find online user
        // --------------------------------------------------

        const [rows] = await pool.query(
            
            SELECT *
            FROM online_users
            WHERE username = ?
            LIMIT 1
            ,
            [username]
        );


        if (!rows.length) {

            return res.status(401).json({

                success: false,
                message: "Invalid username or password."

            });

        }


        const user =
            rows[0];


        // --------------------------------------------------
        // Check active
        // --------------------------------------------------

        if (
            user.active !== undefined &&
            Number(user.active) !== 1
        ) {

            return res.status(403).json({

                success: false,
                message: "Online banking account is inactive."

            });

        }


        // --------------------------------------------------
        // Get password hash
        // --------------------------------------------------

        let passwordHash =
            String(
                user.password_hash ||
                user.password ||
                ""
            );


        if (!passwordHash) {

            return res.status(500).json({

                success: false,
                message: "Password configuration error."

            });

        }


        // PHP bcrypt compatibility

        if (passwordHash.startsWith("$2y$")) {

            passwordHash =
                "$2b$" + passwordHash.substring(4);

        }


        // --------------------------------------------------
        // Compare password
        // --------------------------------------------------

        const passwordMatches =
            await bcrypt.compare(
                password,
                passwordHash
            );


        if (!passwordMatches) {

            return res.status(401).json({

                success: false,
                message: "Invalid username or password."

            });

        }


        // --------------------------------------------------
        // Store login session
        // --------------------------------------------------

        const customerId =
            user.customer_id !== undefined
                ? user.customer_id
                : user.id;


        req.session.user = {

            userId:
                user.id !== undefined
                    ? user.id
                    : user.user_id,

            customerId:
                customerId,

            username:
                user.username

        };


        return res.json({

            success: true,

            message:
                "Login successful.",

            redirect:
                "dashboard.html"

        });

    } catch (error) {

        console.error("LOGIN ERROR:");
        console.error(error);

        return res.status(500).json({

            success: false,
            message: "Unable to process login."

        });

    }

});


// ======================================================
// DASHBOARD
// ======================================================

app.get("/api/dashboard", async (req, res) => {

    try {

        // --------------------------------------------------
        // Check session
        // --------------------------------------------------

        if (!req.session.user) {

            return res.status(401).json({

                success: false,
                message: "Not authenticated."

            });

        }


        const customerId =
            req.session.user.customerId;


        // --------------------------------------------------
        // Get customer
        // --------------------------------------------------

        const [customers] = await pool.query(
            
            SELECT *
            FROM customers
            WHERE customer_id = ?
            LIMIT 1
            ,
            [customerId]
        );


        if (!customers.length) {

            return res.status(404).json({

                success: false,
                message: "Customer information not found."

            });

        }


        const customer =
            customers[0];


        // --------------------------------------------------
        // Get account information
        //
        // This query assumes an accounts table.
        // If your balances are stored directly in customers,
        // this part can be adjusted to your exact schema.
        // --------------------------------------------------

        let accounts = [];


        try {

            const [accountRows] = await pool.query(
                
                SELECT
                    account_number,
                    account_type,
                    current_balance,
                    available_balance,
                    status
                FROM accounts
                WHERE customer_id = ?
                AND status = 'active'
                AND account_type IN ('checking', 'savings')
                ORDER BY account_type
                ,
                [customerId]
            );


            accounts = accountRows;

        } catch (accountError) {

            console.log(
                "Accounts table query failed:",
                accountError.message
            );

            // If accounts table is not available,
            // return customer-level balance fields if present.

            if (
                customer.account_number !== undefined
            ) {

                accounts = [{

                    account_number:
                        customer.account_number,

                    account_type:
                        customer.account_type ||
                        "checking",

                    current_balance:
                        customer.current_balance ||
                        customer.balance ||
                        0,

                    available_balance:
                        customer.available_balance ||
                        customer.current_balance ||
                        customer.balance ||
                        0,

                    status:
                        "active"

                }];

            }

        }


        // --------------------------------------------------
        // Mask account number
        // --------------------------------------------------

        accounts =
            accounts.map(account => {

                const number =
                    String(
                        account.account_number || ""
                    );

                const last4 =
                    number.slice(-4);


                return {

                    account_type:
                        account.account_type,

                    account_number:
                        ••••${last4},

                    current_balance:
                        Number(
                            account.current_balance || 0
                        ),

                    available_balance:
                        Number(
                            account.available_balance || 0
                        )

                };

            });


        // --------------------------------------------------
        // Return dashboard
        // --------------------------------------------------

        return res.json({

            success: true,

            customer: {

                first_name:
                    customer.first_name ||
                    customer.firstname ||
                    "",

                last_name:
                    customer.last_name ||
                    customer.lastname ||
                    ""

            },

            username:
                req.session.user.username,

            accounts:
                accounts

        });

    } catch (error) {

        console.error("DASHBOARD ERROR:");
        console.error(error);

        return res.status(500).json({

            success: false,
            message:
                "Unable to load account information."

        });

    }

});


// ======================================================
// LOGOUT
// ======================================================

app.post("/api/logout", (req, res) => {

    req.session.destroy(error => {

        if (error) {

            console.error("LOGOUT ERROR:", error);

            return res.status(500).json({

                success: false,
                message: "Unable to log out."

            });

        }


        res.clearCookie("connect.sid");


        return res.json({

            success: true,

            message:
                "Logged out successfully.",

            redirect:
                "login.html"

        });

    });

});


// ======================================================
// STATIC FRONTEND
// ======================================================

app.use(express.static(__dirname));


// ======================================================
// 404 API HANDLER
// ======================================================

app.use("/api", (req, res) => {

    res.status(404).json({

        success: false,
        message: "API endpoint not found."

    });

});


// ======================================================
// START SERVER
// ======================================================

const PORT =
    process.env.PORT || 8080;


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            Upright Bank server running on port ${PORT}
        );

    }
);
