const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");

const pool = require("./database");

const app = express();


// ======================================================
// BASIC CONFIGURATION
// ======================================================

const PORT = process.env.PORT || 8080;


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Important when running behind Railway's proxy
app.set("trust proxy", 1);


// ======================================================
// SESSION
// ======================================================

app.use(
    session({
        secret: process.env.SESSION_SECRET || "change-this-secret",

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,

            secure: process.env.NODE_ENV === "production",

            sameSite: "lax",

            maxAge: 1000 * 60 * 60
        }
    })
);


// ======================================================
// STATIC FILES
// ======================================================

app.use(express.static(__dirname));


// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", (req, res) => {

    return res.json({
        success: true,
        message: "Node.js API is running"
    });

});


// ======================================================
// STEP 1 — VERIFY CUSTOMER
// ======================================================

app.post("/api/verify", async (req, res) => {

    const {
        account_number,
        ssn_last4,
        date_of_birth,
        enrollment_reference
    } = req.body;


    console.log("");
    console.log("========================================");
    console.log("VERIFY CUSTOMER REQUEST");
    console.log("========================================");

    console.log("Account:", account_number);
    console.log("SSN last 4:", ssn_last4);
    console.log("DOB:", date_of_birth);
    console.log(
        "Enrollment reference received:",
        !!enrollment_reference
    );


    // --------------------------------------------------
    // Validate input
    // --------------------------------------------------

    if (
        !account_number ||
        !ssn_last4 ||
        !date_of_birth ||
        !enrollment_reference
    ) {

        return res.status(400).json({
            success: false,
            message: "All verification fields are required."
        });

    }


    const cleanAccountNumber =
        String(account_number).trim();

    const cleanSSN =
        String(ssn_last4).trim();

    const cleanDOB =
        String(date_of_birth).trim();

    const cleanEnrollmentReference =
        String(enrollment_reference).trim();


    // --------------------------------------------------
    // Validate SSN
    // --------------------------------------------------

    if (!/^\d{4}$/.test(cleanSSN)) {

        return res.status(400).json({
            success: false,
            message: "SSN must contain exactly 4 digits."
        });

    }


    try {

        // --------------------------------------------------
        // Find customer
        // --------------------------------------------------

        const [rows] =
            await pool.execute(
                `
                SELECT
                    id,
                    first_name,
                    last_name,
                    account_number,
                    date_of_birth,
                    ssn_last4,
                    enrollment_reference_hash,
                    active,
                    online_enrolled,
                    account_type,
                    account_status
                FROM customers
                WHERE account_number = ?
                LIMIT 1
                `,
                [
                    cleanAccountNumber
                ]
            );


        console.log(
            "Customer rows found:",
            rows.length
        );


        if (rows.length === 0) {

            console.log(
                "VERIFY FAILED: Account not found"
            );

            return res.status(401).json({
                success: false,
                message:
                    "Account information could not be verified."
            });

        }


        const customer =
            rows[0];


        console.log(
            "Customer ID:",
            customer.id
        );

        console.log(
            "Customer:",
            `${customer.first_name} ${customer.last_name}`
        );

        console.log(
            "Account type:",
            customer.account_type
        );

        console.log(
            "Account status:",
            customer.account_status
        );

        console.log(
            "Active:",
            customer.active
        );

        console.log(
            "Online enrolled:",
            customer.online_enrolled
        );


        // --------------------------------------------------
        // Check active account
        // --------------------------------------------------

        if (
            Number(customer.active) !== 1 ||
            String(customer.account_status)
                .toLowerCase() !== "active"
        ) {

            console.log(
                "VERIFY FAILED: Account inactive"
            );

            return res.status(403).json({
                success: false,
                message:
                    "This bank account is not active."
            });

        }


        // --------------------------------------------------
        // Check account type
        // --------------------------------------------------

        const accountType =
            String(customer.account_type)
                .toLowerCase();


        if (
            accountType !== "checking" &&
            accountType !== "savings"
        ) {

            console.log(
                "VERIFY FAILED: Invalid account type"
            );

            return res.status(403).json({
                success: false,
                message:
                    "This account is not eligible for online banking enrollment."
            });

        }


        // --------------------------------------------------
        // Check SSN
        // --------------------------------------------------

        const databaseSSN =
            String(customer.ssn_last4).trim();


        if (databaseSSN !== cleanSSN) {

            console.log(
                "VERIFY FAILED: SSN mismatch"
            );

            return res.status(401).json({
                success: false,
                message:
                    "Account information could not be verified."
            });

        }


        // --------------------------------------------------
        // Check DOB
        // --------------------------------------------------

        let databaseDOB;


        if (
            customer.date_of_birth instanceof Date
        ) {

            databaseDOB =
                customer.date_of_birth
                    .toISOString()
                    .slice(0, 10);

        } else {

            databaseDOB =
                String(customer.date_of_birth)
                    .slice(0, 10);

        }


        const enteredDOB =
            cleanDOB.slice(0, 10);


        console.log(
            "Database DOB:",
            databaseDOB
        );

        console.log(
            "Entered DOB:",
            enteredDOB
        );


        if (databaseDOB !== enteredDOB) {

            console.log(
                "VERIFY FAILED: DOB mismatch"
            );

            return res.status(401).json({
                success: false,
                message:
                    "Account information could not be verified."
            });

        }


        // --------------------------------------------------
        // Check enrollment reference hash
        // --------------------------------------------------

        if (
            !customer.enrollment_reference_hash
        ) {

            console.log(
                "VERIFY FAILED: Missing enrollment reference hash"
            );

            return res.status(401).json({
                success: false,
                message:
                    "Enrollment reference is not configured for this account."
            });

        }


        let storedHash =
            String(
                customer.enrollment_reference_hash
            );


        // PHP bcrypt uses $2y$
        // Node bcrypt normally expects $2a$ / $2b$

        if (
            storedHash.startsWith("$2y$")
        ) {

            storedHash =
                "$2b$" +
                storedHash.substring(4);

        }


        const enrollmentMatch =
            await bcrypt.compare(
                cleanEnrollmentReference,
                storedHash
            );


        console.log(
            "Enrollment reference match:",
            enrollmentMatch
        );


        if (!enrollmentMatch) {

            console.log(
                "VERIFY FAILED: Enrollment reference mismatch"
            );

            return res.status(401).json({
                success: false,
                message:
                    "Account information could not be verified."
            });

        }


        // --------------------------------------------------
        // Check already enrolled
        // --------------------------------------------------

        if (
            Number(customer.online_enrolled) === 1
        ) {

            console.log(
                "VERIFY FAILED: Already enrolled"
            );

            return res.status(409).json({
                success: false,
                message:
                    "This account is already enrolled in online banking."
            });

        }


        // --------------------------------------------------
        // Create enrollment session
        // --------------------------------------------------

        req.session.enrollment_customer_id =
            Number(customer.id);

        req.session.enrollment_account_number =
            String(customer.account_number);


        // Explicitly save session before responding.
        // This prevents Step 2 from reaching the API
        // before the session has been persisted.

        req.session.save((sessionError) => {

            if (sessionError) {

                console.error(
                    "SESSION SAVE ERROR:",
                    sessionError
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to create verification session."
                });

            }


            console.log(
                "VERIFY SUCCESS"
            );

            console.log(
                "Enrollment customer ID:",
                req.session.enrollment_customer_id
            );


            return res.json({

                success: true,

                message:
                    "Identity verified successfully.",

                customer: {

                    id:
                        Number(customer.id),

                    first_name:
                        customer.first_name,

                    last_name:
                        customer.last_name,

                    account_number:
                        customer.account_number,

                    account_type:
                        customer.account_type

                }

            });

        });


    } catch (error) {

        console.error("");
        console.error("========================================");
        console.error("VERIFICATION DATABASE ERROR");
        console.error("========================================");
        console.error("Message:", error.message);
        console.error("SQL Message:", error.sqlMessage);
        console.error("SQL State:", error.sqlState);
        console.error("Code:", error.code);
        console.error("========================================");


        return res.status(500).json({

            success: false,

            message:
                "Server error while verifying account.",

            error:
                error.sqlMessage ||
                error.message ||
                "Unknown server error"

        });

    }

});


// ======================================================
// CHECK USERNAME
// ======================================================

app.get("/api/check-username", async (req, res) => {

    const username =
        String(
            req.query.username || ""
        ).trim();


    if (!username) {

        return res.status(400).json({

            success: false,

            message:
                "Username is required."

        });

    }


    // --------------------------------------------------
    // Username rule
    //
    // 8-12 characters
    // First 3 must be letters
    // Remaining can be letters/numbers
    // No underscore
    // No spaces
    // --------------------------------------------------

    if (
        !/^[A-Za-z]{3}[A-Za-z0-9]{5,9}$/
            .test(username)
    ) {

        return res.json({

            success: true,

            available: false,

            valid: false,

            message:
                "Username must be 8-12 characters. The first 3 characters must be letters and only letters and numbers are allowed."

        });

    }


    try {

        const [rows] =
            await pool.execute(
                `
                SELECT id
                FROM online_users
                WHERE username = ?
                LIMIT 1
                `,
                [
                    username
                ]
            );


        return res.json({

            success: true,

            available:
                rows.length === 0,

            valid: true,

            message:
                rows.length === 0
                    ? "Username is available."
                    : "Username is already taken."

        });


    } catch (error) {

        console.error(
            "Username check error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to check username.",

            error:
                error.sqlMessage ||
                error.message ||
                "Unknown database error"

        });

    }

});


// ======================================================
// STEP 2 — CREATE ONLINE BANKING ACCOUNT
// ======================================================

app.post("/api/create", async (req, res) => {

    const {
        username,
        password
    } = req.body;


    console.log("");
    console.log("========================================");
    console.log("CREATE ONLINE BANKING ACCOUNT");
    console.log("========================================");

    console.log(
        "Username:",
        username
    );

    console.log(
        "Password received:",
        !!password
    );

    console.log(
        "Session ID:",
        req.sessionID
    );

    console.log(
        "Enrollment customer ID:",
        req.session.enrollment_customer_id
    );


    // --------------------------------------------------
    // Check enrollment session
    // --------------------------------------------------

    if (
        !req.session.enrollment_customer_id
    ) {

        console.log(
            "CREATE FAILED: Enrollment session missing"
        );

        return res.status(401).json({

            success: false,

            message:
                "Your verification session has expired. Please verify your account again."

        });

    }


    // --------------------------------------------------
    // Clean username
    // --------------------------------------------------

    const cleanUsername =
        String(username || "").trim();


    // --------------------------------------------------
    // Username validation
    //
    // 8-12 characters
    // First 3 must be letters
    // Remaining characters letters/numbers
    // --------------------------------------------------

    if (
        !/^[A-Za-z]{3}[A-Za-z0-9]{5,9}$/
            .test(cleanUsername)
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Username must be 8-12 characters. The first 3 characters must be letters and only letters and numbers are allowed."

        });

    }


    // --------------------------------------------------
    // Clean password
    // --------------------------------------------------

    const cleanPassword =
        String(password || "");


    // --------------------------------------------------
    // Password validation
    //
    // 12-72 characters
    // At least lowercase
    // At least uppercase
    // At least number
    // --------------------------------------------------

    if (
        cleanPassword.length < 12 ||
        cleanPassword.length > 72
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Password must be between 12 and 72 characters."

        });

    }


    if (!/[a-z]/.test(cleanPassword)) {

        return res.status(400).json({

            success: false,

            message:
                "Password must contain at least one lowercase letter."

        });

    }


    if (!/[A-Z]/.test(cleanPassword)) {

        return res.status(400).json({

            success: false,

            message:
                "Password must contain at least one uppercase letter."

        });

    }


    if (!/\d/.test(cleanPassword)) {

        return res.status(400).json({

            success: false,

            message:
                "Password must contain at least one number."

        });

    }


    // --------------------------------------------------
    // Get customer ID from session
    // --------------------------------------------------

    const customerId =
        Number(
            req.session.enrollment_customer_id
        );


    if (
        !Number.isInteger(customerId) ||
        customerId <= 0
    ) {

        return res.status(401).json({

            success: false,

            message:
                "Invalid enrollment session. Please start again."

        });

    }


    let connection;


    try {

        // --------------------------------------------------
        // Get connection
        // --------------------------------------------------

        connection =
            await pool.getConnection();


        console.log(
            "Database connection acquired."
        );


        // --------------------------------------------------
        // Start transaction
        // --------------------------------------------------

        await connection.beginTransaction();


        console.log(
            "Transaction started."
        );


        // --------------------------------------------------
        // Lock customer record
        // --------------------------------------------------

        const [customers] =
            await connection.execute(
                `
                SELECT
                    id,
                    account_number,
                    online_enrolled,
                    active,
                    account_status,
                    account_type
                FROM customers
                WHERE id = ?
                LIMIT 1
                FOR UPDATE
                `,
                [
                    customerId
                ]
            );


        console.log(
            "Customer rows:",
            customers.length
        );


        if (
            customers.length === 0
        ) {

            await connection.rollback();

            return res.status(404).json({

                success: false,

                message:
                    "Customer account could not be found."

            });

        }


        const customer =
            customers[0];


        console.log(
            "Customer record:",
            customer
        );


        // --------------------------------------------------
        // Verify account status
        // --------------------------------------------------

        if (
            Number(customer.active) !== 1 ||
            String(customer.account_status)
                .toLowerCase() !== "active"
        ) {

            await connection.rollback();

            return res.status(403).json({

                success: false,

                message:
                    "This bank account is not active."

            });

        }


        // --------------------------------------------------
        // Verify account type
        // --------------------------------------------------

        const accountType =
            String(customer.account_type)
                .toLowerCase();


        if (
            accountType !== "checking" &&
            accountType !== "savings"
        ) {

            await connection.rollback();

            return res.status(403).json({

                success: false,

                message:
                    "This account is not eligible for online banking."

            });

        }


        // --------------------------------------------------
        // Check existing enrollment
        // --------------------------------------------------

        if (
            Number(customer.online_enrolled) === 1
        ) {

            await connection.rollback();

            return res.status(409).json({

                success: false,

                message:
                    "This account is already enrolled in online banking."

            });

        }


        // --------------------------------------------------
        // Check username
        // --------------------------------------------------

        const [existingUsers] =
            await connection.execute(
                `
                SELECT
                    id
                FROM online_users
                WHERE username = ?
                LIMIT 1
                `,
                [
                    cleanUsername
                ]
            );


        console.log(
            "Existing username rows:",
            existingUsers.length
        );


        if (
            existingUsers.length > 0
        ) {

            await connection.rollback();

            return res.status(409).json({

                success: false,

                message:
                    "Username is already taken. Please choose another username."

            });

        }


        // --------------------------------------------------
        // Hash password
        // --------------------------------------------------

        console.log(
            "Hashing password..."
        );


        const passwordHash =
            await bcrypt.hash(
                cleanPassword,
                10
            );


        console.log(
            "Password hashed."
        );


        // --------------------------------------------------
        // Insert online user
        // --------------------------------------------------

        console.log(
            "Inserting online user..."
        );


        const [insertResult] =
            await connection.execute(
                `
                INSERT INTO online_users
                (
                    customer_id,
                    username,
                    password_hash,
                    active,
                    created_at,
                    updated_at
                )
                VALUES
                (?, ?, ?, 1, NOW(), NOW())
                `,
                [
                    customerId,
                    cleanUsername,
                    passwordHash
                ]
            );


        console.log(
            "Online user inserted."
        );

        console.log(
            "New online user ID:",
            insertResult.insertId
        );


        // --------------------------------------------------
        // Update customer
        // --------------------------------------------------

        console.log(
            "Updating customer online enrollment..."
        );


        const [updateResult] =
            await connection.execute(
                `
                UPDATE customers
                SET online_enrolled = 1
                WHERE id = ?
                `,
                [
                    customerId
                ]
            );


        console.log(
            "Customer rows updated:",
            updateResult.affectedRows
        );


        if (
            updateResult.affectedRows !== 1
        ) {

            throw new Error(
                "Customer enrollment status could not be updated."
            );

        }


        // --------------------------------------------------
        // Commit
        // --------------------------------------------------

        await connection.commit();


        console.log(
            "Transaction committed successfully."
        );


        // --------------------------------------------------
        // Remove enrollment session
        // --------------------------------------------------

        req.session.enrollment_customer_id = null;
        req.session.enrollment_account_number = null;


        req.session.save((sessionError) => {

            if (sessionError) {

                console.error(
                    "Session cleanup error:",
                    sessionError
                );

            }


            console.log(
                "Online banking account creation SUCCESS."
            );


            console.log(
                "========================================"
            );


            return res.json({

                success: true,

                message:
                    "Online banking account created successfully.",

                username:
                    cleanUsername

            });

        });


    } catch (error) {

        // --------------------------------------------------
        // Rollback
        // --------------------------------------------------

        if (connection) {

            try {

                await connection.rollback();

                console.log(
                    "Transaction rolled back."
                );

            } catch (rollbackError) {

                console.error(
                    "Rollback error:",
                    rollbackError
                );

            }

        }


        // --------------------------------------------------
        // Log complete database error
        // --------------------------------------------------

        console.error("");
        console.error("========================================");
        console.error("CREATE ACCOUNT ERROR");
        console.error("========================================");

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "SQL Message:",
            error.sqlMessage
        );

        console.error(
            "SQL State:",
            error.sqlState
        );

        console.error(
            "Error Code:",
            error.code
        );

        console.error(
            "Error Number:",
            error.errno
        );

        console.error(
            "========================================");


        let message =
            error.sqlMessage ||
            error.message ||
            "Unknown database error";


        // More user-friendly MySQL messages

        if (
            error.code === "ER_DUP_ENTRY"
        ) {

            message =
                "This username already exists. Please choose another username.";

        }


        if (
            error.code === "ER_NO_REFERENCED_ROW_2"
        ) {

            message =
                "The customer account could not be linked to the online banking account.";

        }


        if (
            error.code === "ER_BAD_FIELD_ERROR"
        ) {

            message =
                "The database structure does not match the application. Check the online_users table columns.";

        }


        if (
            error.code === "ER_NO_SUCH_TABLE"
        ) {

            message =
                "The online_users table does not exist in the database.";

        }


        return res.status(500).json({

            success: false,

            message:
                "Could not create online banking account.",

            error:
                message

        });

    } finally {

        if (connection) {

            connection.release();

            console.log(
                "Database connection released."
            );

        }

    }

});


// ======================================================
// LOGIN API
// ======================================================

app.post("/api/login", async (req, res) => {

    const {
        username,
        password
    } = req.body;


    const cleanUsername =
        String(username || "").trim();

    const cleanPassword =
        String(password || "");


    if (
        !cleanUsername ||
        !cleanPassword
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Username and password are required."

        });

    }


    try {

        const [rows] =
            await pool.execute(
                `
                SELECT
                    id,
                    customer_id,
                    username,
                    password_hash,
                    active
                FROM online_users
                WHERE username = ?
                LIMIT 1
                `,
                [
                    cleanUsername
                ]
            );


        if (
            rows.length === 0
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid username or password."

            });

        }


        const user =
            rows[0];


        if (
            Number(user.active) !== 1
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "This online banking account is inactive."

            });

        }


        let storedPasswordHash =
            String(user.password_hash);


        // Support PHP bcrypt $2y$
        if (
            storedPasswordHash.startsWith("$2y$")
        ) {

            storedPasswordHash =
                "$2b$" +
                storedPasswordHash.substring(4);

        }


        const passwordMatch =
            await bcrypt.compare(
                cleanPassword,
                storedPasswordHash
            );


        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid username or password."

            });

        }


        // --------------------------------------------------
        // Create login session
        // --------------------------------------------------

        req.session.user_id =
            Number(user.id);

        req.session.customer_id =
            Number(user.customer_id);

        req.session.username =
            user.username;


        req.session.save((sessionError) => {

            if (sessionError) {

                console.error(
                    "Login session error:",
                    sessionError
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to create login session."

                });

            }


            return res.json({

                success: true,

                message:
                    "Login successful."

            });

        });


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to process login.",

            error:
                error.sqlMessage ||
                error.message ||
                "Unknown database error"

        });

    }

});


// ======================================================
// DASHBOARD API
// ======================================================

app.get("/api/dashboard", async (req, res) => {

    if (
        !req.session.customer_id
    ) {

        return res.status(401).json({

            success: false,

            message:
                "You are not logged in."

        });

    }


    const customerId =
        Number(
            req.session.customer_id
        );


    try {

        const [rows] =
            await pool.execute(
                `
                SELECT
                    id,
                    first_name,
                    last_name,
                    account_number,
                    account_type,
                    current_balance,
                    available_balance,
                    account_status,
                    active
                FROM customers
                WHERE id = ?
                  AND active = 1
                  AND account_status = 'active'
                  AND account_type IN ('checking', 'savings')
                ORDER BY account_type, id
                `,
                [
                    customerId
                ]
            );


        if (
            rows.length === 0
        ) {

            return res.json({

                success: true,

                customer: {
                    firstName: "Customer"
                },

                accounts: []

            });

        }


        const customer =
            rows[0];


        const accounts =
            rows.map(account => {

                const accountNumber =
                    String(
                        account.account_number
                    );


                const lastFour =
                    accountNumber.slice(-4);


                return {

                    accountType:
                        account.account_type === "checking"
                            ? "Checking Account"
                            : "Savings Account",

                    maskedAccountNumber:
                        `••••${lastFour}`,

                    currentBalance:
                        Number(
                            account.current_balance || 0
                        ),

                    availableBalance:
                        Number(
                            account.available_balance || 0
                        )

                };

            });


        return res.json({

            success: true,

            customer: {

                firstName:
                    customer.first_name,

                lastName:
                    customer.last_name

            },

            accounts

        });


    } catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to retrieve account information.",

            error:
                error.sqlMessage ||
                error.message ||
                "Unknown database error"

        });

    }

});


// ======================================================
// SESSION API
// ======================================================

app.get("/api/session", (req, res) => {

    if (
        !req.session.customer_id
    ) {

        return res.status(401).json({

            success: false,

            loggedIn: false

        });

    }


    return res.json({

        success: true,

        loggedIn: true,

        username:
            req.session.username,

        customerId:
            req.session.customer_id

    });

});


// ======================================================
// LOGOUT API
// ======================================================

app.post("/api/logout", (req, res) => {

    req.session.destroy(error => {

        if (error) {

            console.error(
                "Logout error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to log out."

            });

        }


        res.clearCookie(
            "connect.sid"
        );


        return res.json({

            success: true,

            message:
                "Logged out successfully."

        });

    });

});


// ======================================================
// PAGES
// ======================================================

app.get("/login", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "login.html"
        )
    );

});


app.get("/dashboard", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "dashboard.html"
        )
    );

});


app.get("/register", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "register.html"
        )
    );

});


app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

});


// ======================================================
// 404 API HANDLER
// ======================================================

app.use("/api", (req, res) => {

    return res.status(404).json({

        success: false,

        message:
            "API endpoint not found."

    });

});


// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {

    console.error(
        "Unhandled Express error:",
        err
    );


    return res.status(500).json({

        success: false,

        message:
            "Internal server error.",

        error:
            err.message ||
            "Unknown server error"

    });

});


// ======================================================
// START SERVER
// ======================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");
        console.log("========================================");
        console.log("BANKING APPLICATION");
        console.log("========================================");
        console.log(
            `Server running on port ${PORT}`
        );
        console.log(
            `Environment: ${process.env.NODE_ENV || "development"}`
        );
        console.log("========================================");

    }
);
