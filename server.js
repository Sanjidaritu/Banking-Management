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

        // Railway HTTPS requires secure cookies in production
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
        message: "Upright Bank API is running."
    });

});


// ======================================================
// VERIFY CUSTOMER FOR ONLINE BANKING ENROLLMENT
// ======================================================

app.post("/api/verify", async (req, res) => {

    console.log("=================================");
    console.log("VERIFY API CALLED");
    console.log("Request body:", req.body);
    console.log("=================================");

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


        const {
            account_number,
            ssn_last4,
            date_of_birth,
            enrollment_reference
        } = req.body;


        // --------------------------------------------------
        // Validate required fields
        // --------------------------------------------------

        if (
            !account_number ||
            !ssn_last4 ||
            !date_of_birth ||
            !enrollment_reference
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Account number, SSN last 4, date of birth, and enrollment reference are required."

            });

        }


        console.log("Account:", account_number);
        console.log("SSN:", ssn_last4);
        console.log("DOB:", date_of_birth);
        console.log("Enrollment:", enrollment_reference);


        // --------------------------------------------------
        // Find customer
        // --------------------------------------------------

        const [rows] = await pool.execute(`

            SELECT
                id,
                first_name,
                last_name,
                account_number,
                ssn_last4,
                date_of_birth,
                enrollment_reference,
                active,
                online_enrolled,
                account_status,
                account_type

            FROM customers

            WHERE account_number = ?

            LIMIT 1

        `, [account_number]);


        // --------------------------------------------------
        // Customer not found
        // --------------------------------------------------

        if (rows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "We could not verify your banking information."

            });

        }


        const customer = rows[0];


        // --------------------------------------------------
        // Check active status
        // --------------------------------------------------

        if (
            Number(customer.active) !== 1 ||
            String(customer.account_status).toLowerCase() !== "active"
        ) {

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
            String(customer.account_type || "").toLowerCase();


        if (
            accountType !== "checking" &&
            accountType !== "savings"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "This account is not eligible for online banking enrollment."

            });

        }


        // --------------------------------------------------
        // Check already enrolled
        // --------------------------------------------------

        if (Number(customer.online_enrolled) === 1) {

            return res.status(409).json({

                success: false,

                message:
                    "This account is already enrolled in online banking."

            });

        }


        // --------------------------------------------------
        // Verify SSN
        // --------------------------------------------------

        if (
            String(customer.ssn_last4).trim() !==
            String(ssn_last4).trim()
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "The information provided could not be verified."

            });

        }


        // --------------------------------------------------
        // Verify DOB
        //
        // Accept:
        // 7/3/1991
        // 07/03/1991
        // 1991-07-03
        // --------------------------------------------------

        function normalizeDate(value) {

            if (!value) {
                return null;
            }

            const stringValue =
                String(value).trim();


            // YYYY-MM-DD
            if (
                /^\d{4}-\d{2}-\d{2}$/.test(stringValue)
            ) {

                return stringValue;

            }


            // M/D/YYYY or MM/DD/YYYY
            const parts =
                stringValue.split("/");


            if (parts.length === 3) {

                const month =
                    parts[0].padStart(2, "0");

                const day =
                    parts[1].padStart(2, "0");

                const year =
                    parts[2];

                if (
                    /^\d{4}$/.test(year) &&
                    /^\d{1,2}$/.test(parts[0]) &&
                    /^\d{1,2}$/.test(parts[1])
                ) {

                    return `${year}-${month}-${day}`;

                }

            }


            return stringValue;

        }


        const suppliedDOB =
            normalizeDate(date_of_birth);

        const databaseDOB =
            normalizeDate(customer.date_of_birth);


        console.log("Normalized DOB:", {
            suppliedDOB,
            databaseDOB
        });


        if (
            suppliedDOB !==
            databaseDOB
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "The information provided could not be verified."

            });

        }


        // --------------------------------------------------
        // Verify enrollment reference
        // --------------------------------------------------

        if (
            String(customer.enrollment_reference).trim() !==
            String(enrollment_reference).trim()
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "The information provided could not be verified."

            });

        }


        // --------------------------------------------------
        // Verification successful
        // --------------------------------------------------

        req.session.enrollment_customer_id =
            customer.id;


        req.session.enrollment_account_number =
            customer.account_number;


        return res.json({

            success: true,

            message:
                "Customer verified successfully.",

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
                "Server error while verifying customer."

        });

    }

});


// ======================================================
// CHECK USERNAME
// ======================================================

app.post("/api/check-username", async (req, res) => {

    try {

        const {
            username
        } = req.body;


        if (!username) {

            return res.status(400).json({

                success: false,

                message:
                    "Username is required."

            });

        }


        const [rows] = await pool.execute(`

            SELECT id

            FROM online_users

            WHERE username = ?

            LIMIT 1

        `, [username]);


        if (rows.length > 0) {

            return res.json({

                success: true,

                available: false,

                message:
                    "Username is already taken."

            });

        }


        return res.json({

            success: true,

            available: true,

            message:
                "Username is available."

        });


    } catch (error) {

        console.error(
            "USERNAME CHECK ERROR:",
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
// CREATE ONLINE BANKING USER
// ======================================================

app.post("/api/create", async (req, res) => {

    console.log("CREATE API CALLED");
    console.log(req.body);

    try {

        // --------------------------------------------------
        // Require successful enrollment verification
        // --------------------------------------------------

        const customerId =
            req.session.enrollment_customer_id;


        if (!customerId) {

            return res.status(401).json({

                success: false,

                message:
                    "Please verify your banking information first."

            });

        }


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


        // --------------------------------------------------
        // Check username
        // --------------------------------------------------

        const [existing] = await pool.execute(`

            SELECT id

            FROM online_users

            WHERE username = ?

            LIMIT 1

        `, [username]);


        if (existing.length > 0) {

            return res.status(409).json({

                success: false,

                message:
                    "Username is already taken."

            });

        }


        // --------------------------------------------------
        // Check customer
        // --------------------------------------------------

        const [customers] = await pool.execute(`

            SELECT
                id,
                online_enrolled,
                active,
                account_status

            FROM customers

            WHERE id = ?

            LIMIT 1

        `, [customerId]);


        if (customers.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Customer account could not be found."

            });

        }


        const customer =
            customers[0];


        if (
            Number(customer.active) !== 1 ||
            String(customer.account_status).toLowerCase() !== "active"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Customer account is not active."

            });

        }


        if (Number(customer.online_enrolled) === 1) {

            return res.status(409).json({

                success: false,

                message:
                    "This customer is already enrolled."

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

        await pool.execute(`

            INSERT INTO online_users
            (
                customer_id,
                username,
                password_hash,
                active,
                created_at
            )

            VALUES
            (?, ?, ?, 1, NOW())

        `, [
            customerId,
            username,
            passwordHash
        ]);


        // --------------------------------------------------
        // Mark customer enrolled
        // --------------------------------------------------

        await pool.execute(`

            UPDATE customers

            SET online_enrolled = 1

            WHERE id = ?

        `, [customerId]);


        // --------------------------------------------------
        // Clear enrollment session
        // --------------------------------------------------

        req.session.enrollment_customer_id =
            null;


        req.session.enrollment_account_number =
            null;


        return res.json({

            success: true,

            message:
                "Online banking account created successfully."

        });


    } catch (error) {

        console.error(
            "CREATE ERROR:",
            error
        );


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

    console.log("LOGIN API CALLED");

    try {

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


        // --------------------------------------------------
        // Find online banking user
        // --------------------------------------------------

        const [rows] = await pool.execute(`

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


        if (Number(user.active) !== 1) {

            return res.status(403).json({

                success: false,

                message:
                    "This online banking account is inactive."

            });

        }


        // --------------------------------------------------
        // Support old $2y$ hashes
        // --------------------------------------------------

        let storedHash =
            user.password_hash;


        if (
            storedHash &&
            storedHash.startsWith("$2y$")
        ) {

            storedHash =
                "$2b$" +
                storedHash.substring(4);

        }


        const passwordCorrect =
            await bcrypt.compare(
                password,
                storedHash
            );


        if (!passwordCorrect) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid username or password."

            });

        }


        // --------------------------------------------------
        // Save login session
        // --------------------------------------------------

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

            redirect:
                "/dashboard.html"

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
// DASHBOARD API
// ======================================================

app.get("/api/dashboard", async (req, res) => {

    console.log("Dashboard API called");

    try {

        // --------------------------------------------------
        // Check login session
        // --------------------------------------------------

        if (!req.session.user_id) {

            return res.status(401).json({

                success: false,

                message:
                    "You are not logged in."

            });

        }


        const customerId =
            req.session.customer_id;


        console.log(
            "Customer ID:",
            customerId
        );


        // --------------------------------------------------
        // Get customer information
        // --------------------------------------------------

        const [customerRows] = await pool.execute(`

            SELECT
                first_name,
                last_name

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


        // --------------------------------------------------
        // Get active account
        // --------------------------------------------------

        const [rows] = await pool.execute(`

            SELECT
                account_number,
                account_type,
                current_balance,
                available_balance

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


        // --------------------------------------------------
        // Mask account number
        // --------------------------------------------------

        const accountNumber =
            String(account.account_number);


        const maskedAccount =
            "••••" +
            accountNumber.slice(-4);


        // --------------------------------------------------
        // Return dashboard data
        // --------------------------------------------------

        return res.json({

            success: true,

            username:
                req.session.username,

            customer: {

                first_name:
                    customerRows[0].first_name,

                last_name:
                    customerRows[0].last_name

            },

            account: {

                account_number:
                    maskedAccount,

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
            "Dashboard error:",
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
                "Logout error:",
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
// SERVE HTML / JS / CSS
// ======================================================

app.use(
    express.static(
        path.join(__dirname)
    )
);


// ======================================================
// 404 API HANDLER
// ======================================================

app.use("/api", (req, res) => {

    res.status(404).json({

        success: false,

        message:
            "API endpoint not found."

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
            Upright Bank running on port ${PORT}
        );

    }
);
