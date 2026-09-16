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

app.use(express.urlencoded({
    extended: true
}));


// ======================================================
// SESSION
// ======================================================

app.use(session({

    secret:
        process.env.SESSION_SECRET ||
        "upright-bank-secret",

    resave: false,

    saveUninitialized: false,

    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 1000
    }

}));


// ======================================================
// HEALTH
// ======================================================

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        message: "Upright Bank API is running."
    });

});


// ======================================================
// VERIFY EXISTING BANK CUSTOMER
// ======================================================

app.post("/api/verify", async (req, res) => {

    try {

        const {
            account_number,
            ssn_last4,
            date_of_birth,
            enrollment_reference
        } = req.body;


        if (
            !account_number ||
            !ssn_last4 ||
            !date_of_birth ||
            !enrollment_reference
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "All verification fields are required."

            });

        }


        const [rows] = await pool.execute(`

            SELECT
                id,
                account_number,
                first_name,
                last_name,
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

        `, [account_number]);


        if (rows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Customer account not found."

            });

        }


        const customer = rows[0];


        if (customer.active !== 1) {

            return res.status(403).json({

                success: false,

                message:
                    "Customer account is inactive."

            });

        }


        if (customer.account_status !== "active") {

            return res.status(403).json({

                success: false,

                message:
                    "Bank account is not active."

            });

        }


        if (customer.online_enrolled === 1) {

            return res.status(409).json({

                success: false,

                message:
                    "This customer is already enrolled in online banking."

            });

        }


        if (
            String(customer.ssn_last4) !==
            String(ssn_last4)
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "The last 4 digits of SSN are incorrect."

            });

        }


        if (
            String(customer.date_of_birth)
                .substring(0, 10) !==
            String(date_of_birth)
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Date of birth is incorrect."

            });

        }


        let referenceHash =
            customer.enrollment_reference_hash;

        if (!referenceHash) {

            return res.status(401).json({

                success: false,

                message:
                    "Enrollment reference is not configured."

            });

        }


        // PHP bcrypt $2y$ compatibility
        if (referenceHash.startsWith("$2y$")) {

            referenceHash =
                "$2b$" +
                referenceHash.substring(4);

        }


        const referenceValid =
            await bcrypt.compare(
                String(enrollment_reference),
                referenceHash
            );


        if (!referenceValid) {

            return res.status(401).json({

                success: false,

                message:
                    "Enrollment reference is incorrect."

            });

        }


        const enrollmentToken =
            crypto.randomBytes(32).toString("hex");


        req.session.enrollment_token =
            enrollmentToken;

        req.session.enrollment_customer_id =
            customer.id;


        return res.json({

            success: true,

            message:
                "Customer verification successful.",

            enrollment_token:
                enrollmentToken,

            customer: {

                first_name:
                    customer.first_name,

                last_name:
                    customer.last_name,

                account_number:
                    customer.account_number

            }

        });

    } catch (error) {

        console.error(
            "VERIFY ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Server error during verification."

        });

    }

});


// ======================================================
// CHECK USERNAME
// ======================================================

app.get("/api/check-username", async (req, res) => {

    try {

        const username =
            String(req.query.username || "")
                .trim();


        if (
            !/^[A-Za-z0-9_]{6,20}$/
                .test(username)
        ) {

            return res.json({

                success: false,

                available: false,

                message:
                    "Username must be 6–20 characters."

            });

        }


        const [rows] = await pool.execute(`

            SELECT id

            FROM online_users

            WHERE username = ?

            LIMIT 1

        `, [username]);


        return res.json({

            success: true,

            available:
                rows.length === 0,

            message:
                rows.length === 0
                    ? "Username is available."
                    : "Username is already taken."

        });

    } catch (error) {

        console.error(
            "USERNAME CHECK ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            available: false,

            message:
                "Unable to check username."

        });

    }

});


// ======================================================
// CREATE ONLINE BANKING ACCOUNT
// ======================================================

app.post("/api/create", async (req, res) => {

    const connection =
        await pool.getConnection();

    try {

        const {
            username,
            password,
            confirm_password,
            enrollment_token
        } = req.body;


        console.log(
            "CREATE ACCOUNT:",
            username
        );


        if (!username || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Username and password are required."

            });

        }


        if (
            !/^[A-Za-z0-9_]{6,20}$/
                .test(username)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Username must be 6–20 characters."

            });

        }


        if (password.length < 8) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must be at least 8 characters."

            });

        }


        if (
            confirm_password &&
            password !== confirm_password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Passwords do not match."

            });

        }


        // ------------------------------------------------
        // CHECK ENROLLMENT SESSION
        // ------------------------------------------------

        if (
            !req.session.enrollment_customer_id ||
            !req.session.enrollment_token
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Please verify your bank account first."

            });

        }


        if (
            enrollment_token &&
            enrollment_token !==
            req.session.enrollment_token
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid enrollment token."

            });

        }


        const customerId =
            req.session.enrollment_customer_id;


        // ------------------------------------------------
        // CHECK CUSTOMER
        // ------------------------------------------------

        const [customerRows] =
            await connection.execute(`

                SELECT
                    id,
                    active,
                    online_enrolled,
                    account_status

                FROM customers

                WHERE id = ?

                LIMIT 1

            `, [customerId]);


        if (customerRows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Customer not found."

            });

        }


        const customer =
            customerRows[0];


        if (customer.active !== 1) {

            return res.status(403).json({

                success: false,

                message:
                    "Customer account is inactive."

            });

        }


        if (customer.account_status !== "active") {

            return res.status(403).json({

                success: false,

                message:
                    "Bank account is inactive."

            });

        }


        if (customer.online_enrolled === 1) {

            return res.status(409).json({

                success: false,

                message:
                    "Customer is already enrolled."

            });

        }


        // ------------------------------------------------
        // CHECK USERNAME
        // ------------------------------------------------

        const [existingUsers] =
            await connection.execute(`

                SELECT id

                FROM online_users

                WHERE username = ?

                LIMIT 1

            `, [username]);


        if (existingUsers.length > 0) {

            return res.status(409).json({

                success: false,

                message:
                    "Username is already taken."

            });

        }


        // ------------------------------------------------
        // HASH PASSWORD
        // ------------------------------------------------

        const passwordHash =
            await bcrypt.hash(
                password,
                10
            );


        // ------------------------------------------------
        // CREATE ONLINE USER
        // ------------------------------------------------

        await connection.beginTransaction();


        await connection.execute(`

            INSERT INTO online_users
            (
                customer_id,
                username,
                password_hash,
                active
            )

            VALUES (?, ?, ?, 1)

        `, [
            customerId,
            username,
            passwordHash
        ]);


        await connection.execute(`

            UPDATE customers

            SET online_enrolled = 1

            WHERE id = ?

        `, [customerId]);


        await connection.commit();


        // ------------------------------------------------
        // LOGIN SESSION
        // ------------------------------------------------

        req.session.user_id =
            customerId;

        req.session.customer_id =
            customerId;

        req.session.username =
            username;


        delete req.session.enrollment_token;

        delete req.session.enrollment_customer_id;


        return res.status(201).json({

            success: true,

            message:
                "Online banking account created successfully.",

            username

        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "CREATE ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to create online banking account."

        });

    } finally {

        connection.release();

    }

});


// ======================================================
// LOGIN
// ======================================================

app.post("/api/login", async (req, res) => {

    try {

        const {
            username,
            password
        } = req.body;


        console.log(
            "LOGIN REQUEST:",
            username
        );


        if (!username || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Username and password are required."

            });

        }


        // Find online banking user
        const [rows] =
            await pool.execute(`

                SELECT
                    id,
                    customer_id,
                    username,
                    password_hash,
                    active

                FROM online_users

                WHERE username = ?

                LIMIT 1

            `, [username]);


        if (rows.length === 0) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid username or password."

            });

        }


        const user =
            rows[0];


        if (user.active !== 1) {

            return res.status(403).json({

                success: false,

                message:
                    "Online banking account is inactive."

            });

        }


        let passwordHash =
            user.password_hash;


        // PHP bcrypt compatibility
        if (passwordHash.startsWith("$2y$")) {

            passwordHash =
                "$2b$" +
                passwordHash.substring(4);

        }


        const passwordValid =
            await bcrypt.compare(
                password,
                passwordHash
            );


        if (!passwordValid) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid username or password."

            });

        }


        // ------------------------------------------------
        // MAKE SURE CUSTOMER STILL HAS ACTIVE ACCOUNT
        // ------------------------------------------------

        const [customerRows] =
            await pool.execute(`

                SELECT
                    id,
                    active,
                    account_status

                FROM customers

                WHERE id = ?

                LIMIT 1

            `, [user.customer_id]);


        if (customerRows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Customer account not found."

            });

        }


        const customer =
            customerRows[0];


        if (
            customer.active !== 1 ||
            customer.account_status !== "active"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Bank account is inactive."

            });

        }


        // ------------------------------------------------
        // UPDATE LAST LOGIN
        // ------------------------------------------------

        await pool.execute(`

            UPDATE online_users

            SET last_login_at = NOW()

            WHERE id = ?

        `, [user.id]);


        // ------------------------------------------------
        // CREATE SESSION
        // ------------------------------------------------

        req.session.user_id =
            user.id;

        req.session.customer_id =
            user.customer_id;

        req.session.username =
            user.username;


        return res.json({

            success: true,

            message:
                "Login successful.",

            username:
                user.username

        });

    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Database error during login."

        });

    }

});


// ======================================================
// DASHBOARD
// ======================================================

app.get("/api/dashboard", async (req, res) => {

    try {

        console.log(
            "DASHBOARD SESSION:",
            req.session
        );


        if (!req.session.user_id) {

            return res.status(401).json({

                success: false,

                message:
                    "You are not logged in."

            });

        }


        const customerId =
            req.session.customer_id;


        // =================================================
        // GET ACCOUNT FROM ACCOUNTS TABLE
        // =================================================

        const [rows] =
            await pool.execute(`

                SELECT
                    account_number,
                    account_type,
                    current_balance,
                    available_balance,
                    status

                FROM accounts

                WHERE customer_id = ?

                AND status = 'ACTIVE'

                LIMIT 1

            `, [customerId]);


        if (rows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "No active bank account found."

            });

        }


        const account =
            rows[0];


        return res.json({

            success: true,

            username:
                req.session.username,

            account: {

                account_number:
                    account.account_number,

                account_type:
                    account.account_type,

                current_balance:
                    account.current_balance,

                available_balance:
                    account.available_balance

            }

        });

    } catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Database error while loading dashboard."

        });

    }

});


// ======================================================
// LOGOUT
// ======================================================

app.post("/api/logout", (req, res) => {

    req.session.destroy(error => {

        if (error) {

            console.error(
                "LOGOUT ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Logout failed."

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
// STATIC FILES
// ======================================================

app.use(
    express.static(
        path.join(__dirname)
    )
);


// ======================================================
// START SERVER
// ======================================================

const PORT =
    process.env.PORT || 8080;


app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `Upright Bank running on port ${PORT}`
    );

});
