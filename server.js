const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");

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

    res.json({
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


    if (!/^\d{4}$/.test(String(ssn_last4))) {

        return res.status(400).json({
            success: false,
            message: "SSN must contain exactly 4 digits."
        });

    }


    try {

        // --------------------------------------------------
        // Find customer
        // --------------------------------------------------

        const [rows] = await pool.execute(
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
            [String(account_number).trim()]
        );


        if (rows.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Account information could not be verified."
            });

        }


        const customer = rows[0];


        // --------------------------------------------------
        // Check account status
        // --------------------------------------------------

        if (
            Number(customer.active) !== 1 ||
            customer.account_status !== "active"
        ) {

            return res.status(403).json({
                success: false,
                message: "This bank account is not active."
            });

        }


        // --------------------------------------------------
        // Check account type
        // --------------------------------------------------

        if (
            customer.account_type !== "checking" &&
            customer.account_type !== "savings"
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "This account is not eligible for online banking enrollment."
            });

        }


        // --------------------------------------------------
        // Check SSN
        // --------------------------------------------------

        if (
            String(customer.ssn_last4) !==
            String(ssn_last4).trim()
        ) {

            return res.status(401).json({
                success: false,
                message: "Account information could not be verified."
            });

        }


        // --------------------------------------------------
        // Check DOB
        // --------------------------------------------------

        const databaseDOB =
            customer.date_of_birth instanceof Date
                ? customer.date_of_birth
                      .toISOString()
                      .slice(0, 10)
                : String(customer.date_of_birth)
                      .slice(0, 10);


        if (databaseDOB !== String(date_of_birth)) {

            return res.status(401).json({
                success: false,
                message: "Account information could not be verified."
            });

        }


        // --------------------------------------------------
        // Check enrollment reference
        // --------------------------------------------------

        if (
            !customer.enrollment_reference_hash ||
            !(await bcrypt.compare(
                String(enrollment_reference).trim(),
                customer.enrollment_reference_hash
            ))
        ) {

            return res.status(401).json({
                success: false,
                message: "Account information could not be verified."
            });

        }


        // --------------------------------------------------
        // Check whether already enrolled
        // --------------------------------------------------

        if (Number(customer.online_enrolled) === 1) {

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
            customer.account_number;


        // --------------------------------------------------
        // Successful verification
        // --------------------------------------------------

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

            },

            enrollment_token:
                "verified"

        });

    } catch (error) {

        console.error(
            "Verification error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Server error while verifying account."

        });

    }

});


// ======================================================
// CHECK USERNAME
// ======================================================

app.get("/api/check-username", async (req, res) => {

    const username =
        String(req.query.username || "").trim();


    if (!username) {

        return res.status(400).json({

            success: false,

            message:
                "Username is required."

        });

    }


    try {

        const [rows] = await pool.execute(
            `
            SELECT id
            FROM online_users
            WHERE username = ?
            LIMIT 1
            `,
            [username]
        );


        return res.json({

            success: true,

            available:
                rows.length === 0

        });

    } catch (error) {

        console.error(
            "Username check error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to check username."

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


    // --------------------------------------------------
    // Check enrollment session
    // --------------------------------------------------

    if (!req.session.enrollment_customer_id) {

        return res.status(401).json({

            success: false,

            message:
                "Your verification session has expired. Start again."

        });

    }


    // --------------------------------------------------
    // Validate username
    // --------------------------------------------------

    if (
        !/^[A-Za-z0-9_]{6,20}$/.test(
            String(username || "")
        )
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Username must be 6-20 characters using letters, numbers, or underscores."

        });

    }


    // --------------------------------------------------
    // Validate password
    // --------------------------------------------------

    if (
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,72}$/
            .test(String(password || ""))
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Password must be 12-72 characters and include uppercase, lowercase, and a number."

        });

    }


    const customerId =
        req.session.enrollment_customer_id;


    try {

        // --------------------------------------------------
        // Check customer again
        // --------------------------------------------------

        const [customers] = await pool.execute(
            `
            SELECT
                id,
                online_enrolled,
                active,
                account_status
            FROM customers
            WHERE id = ?
            LIMIT 1
            `,
            [customerId]
        );


        if (customers.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Customer account could not be found."

            });

        }


        const customer = customers[0];


        if (
            Number(customer.active) !== 1 ||
            customer.account_status !== "active"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "This bank account is not active."

            });

        }


        if (Number(customer.online_enrolled) === 1) {

            return res.status(409).json({

                success: false,

                message:
                    "This account is already enrolled in online banking."

            });

        }


        // --------------------------------------------------
        // Check username again
        // --------------------------------------------------

        const [existingUsers] = await pool.execute(
            `
            SELECT id
            FROM online_users
            WHERE username = ?
            LIMIT 1
            `,
            [String(username).trim()]
        );


        if (existingUsers.length > 0) {

            return res.status(409).json({

                success: false,

                message:
                    "Username is already taken."

            });

        }


        // --------------------------------------------------
        // Hash password
        // --------------------------------------------------

        const passwordHash =
            await bcrypt.hash(
                String(password),
                10
            );


        // --------------------------------------------------
        // Create online user
        // --------------------------------------------------

        await pool.execute(
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
            VALUES (?, ?, ?, 1, NOW(), NOW())
            `,
            [
                customerId,
                String(username).trim(),
                passwordHash
            ]
        );


        // --------------------------------------------------
        // Mark customer as enrolled
        // --------------------------------------------------

        await pool.execute(
            `
            UPDATE customers
            SET online_enrolled = 1
            WHERE id = ?
            `,
            [customerId]
        );


        // --------------------------------------------------
        // Remove enrollment session
        // --------------------------------------------------

        delete req.session.enrollment_customer_id;

        delete req.session.enrollment_account_number;


        return res.json({

            success: true,

            message:
                "Online banking account created successfully.",

            username:
                String(username).trim()

        });

    } catch (error) {

        console.error(
            "Create account error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Could not create online banking account."

        });

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


    if (!username || !password) {

        return res.status(400).json({

            success: false,

            message:
                "Username and password are required."

        });

    }


    try {

        const [rows] = await pool.execute(
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
            [String(username).trim()]
        );


        if (rows.length === 0) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid username or password."

            });

        }


        const user = rows[0];


        if (Number(user.active) !== 1) {

            return res.status(403).json({

                success: false,

                message:
                    "This online banking account is inactive."

            });

        }


        const passwordMatch =
            await bcrypt.compare(
                String(password),
                user.password_hash
            );


        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid username or password."

            });

        }


        req.session.user_id =
            Number(user.id);

        req.session.customer_id =
            Number(user.customer_id);

        req.session.username =
            user.username;


        return res.json({

            success: true,

            message:
                "Login successful."

        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to process login."

        });

    }

});


// ======================================================
// DASHBOARD API
// ======================================================

app.get("/api/dashboard", async (req, res) => {

    if (!req.session.customer_id) {

        return res.status(401).json({

            success: false,

            message:
                "You are not logged in."

        });

    }


    const customerId =
        req.session.customer_id;


    try {

        const [rows] = await pool.execute(
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
            [customerId]
        );


        if (rows.length === 0) {

            return res.json({

                success: true,

                customer: {
                    firstName: "Customer"
                },

                accounts: []

            });

        }


        const customer = rows[0];


        const accounts =
            rows.map(account => {

                const accountNumber =
                    String(account.account_number);

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
                        Number(account.current_balance || 0),

                    availableBalance:
                        Number(account.available_balance || 0)

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
            "Dashboard error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to retrieve account information."

        });

    }

});


// ======================================================
// SESSION API
// ======================================================

app.get("/api/session", (req, res) => {

    if (!req.session.customer_id) {

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


        res.clearCookie("connect.sid");


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
        path.join(__dirname, "login.html")
    );

});


app.get("/dashboard", (req, res) => {

    res.sendFile(
        path.join(__dirname, "dashboard.html")
    );

});


app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

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
            `Server running on port ${PORT}`
        );

    }
);
