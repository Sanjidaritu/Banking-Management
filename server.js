const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");

const pool = require("./database");

const app = express();


// ======================================================
// SERVER VERSION
// ======================================================

console.log("========================================");
console.log("UPRIGHT BANK SERVER STARTING");
console.log("VERSION: 2026-09-14-FINAL");
console.log("========================================");


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors({
    origin: true,
    credentials: true
}));


// IMPORTANT:
// JSON parser must come BEFORE API routes.

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

        secure:
            process.env.NODE_ENV === "production",

        sameSite: "lax",

        maxAge:
            60 * 60 * 1000

    }

}));


// ======================================================
// REQUEST DEBUGGING
// ======================================================

app.use((req, res, next) => {

    console.log("----------------------------------------");
    console.log("REQUEST:", req.method, req.originalUrl);
    console.log("CONTENT TYPE:", req.headers["content-type"]);

    if (req.method === "POST") {
        console.log("BODY:", req.body);
    }

    console.log("----------------------------------------");

    next();

});


// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", (req, res) => {

    res.json({

        success: true,

        message:
            "Upright Bank API is running.",

        version:
            "2026-09-14-FINAL"

    });

});


// ======================================================
// VERIFY CUSTOMER
// ======================================================

app.post("/api/verify", async (req, res) => {

    console.log("");
    console.log("========================================");
    console.log("VERIFY API CALLED");
    console.log("========================================");
    console.log("BODY:", req.body);


    try {

        // --------------------------------------------------
        // Check body
        // --------------------------------------------------

        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body)
        ) {

            console.log("INVALID BODY");

            return res.status(400).json({

                success: false,

                message:
                    "Invalid JSON request."

            });

        }


        // --------------------------------------------------
        // Get values
        // --------------------------------------------------

        const account_number =
            String(
                req.body.account_number || ""
            ).trim();


        const ssn_last4 =
            String(
                req.body.ssn_last4 || ""
            ).trim();


        const date_of_birth =
            String(
                req.body.date_of_birth || ""
            ).trim();


        const enrollment_reference =
            String(
                req.body.enrollment_reference || ""
            ).trim();


        console.log("Account:", account_number);
        console.log("SSN:", ssn_last4);
        console.log("DOB:", date_of_birth);
        console.log(
            "Enrollment:",
            enrollment_reference
        );


        // --------------------------------------------------
        // Required fields
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
                    "All verification fields are required."

            });

        }


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
                `,

                [account_number]

            );


        console.log(
            "CUSTOMER ROWS:",
            rows.length
        );


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


        const customer =
            rows[0];


        // --------------------------------------------------
        // Active check
        // --------------------------------------------------

        if (
            Number(customer.active) !== 1
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "This customer account is inactive."

            });

        }


        // --------------------------------------------------
        // Account status
        // --------------------------------------------------

        if (
            String(
                customer.account_status || ""
            ).toLowerCase() !== "active"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "This bank account is not active."

            });

        }


        // --------------------------------------------------
        // Account type
        // --------------------------------------------------

        const accountType =
            String(
                customer.account_type || ""
            ).toLowerCase();


        if (
            accountType !== "checking" &&
            accountType !== "savings"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "This account is not eligible for online banking."

            });

        }


        // --------------------------------------------------
        // Already enrolled
        // --------------------------------------------------

        if (
            Number(customer.online_enrolled) === 1
        ) {

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
            ssn_last4
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "The information provided could not be verified."

            });

        }


        // --------------------------------------------------
        // Normalize DOB
        // --------------------------------------------------

        function normalizeDate(value) {

            if (!value) {
                return "";
            }


            let valueString =
                String(value).trim();


            // Remove time if MySQL returns datetime
            if (
                valueString.includes("T")
            ) {

                valueString =
                    valueString.split("T")[0];

            }


            // YYYY-MM-DD
            if (
                /^\d{4}-\d{1,2}-\d{1,2}$/
                    .test(valueString)
            ) {

                const parts =
                    valueString.split("-");

                return (
                    parts[0] +
                    "-" +
                    parts[1].padStart(2, "0") +
                    "-" +
                    parts[2].padStart(2, "0")
                );

            }


            // M/D/YYYY
            if (
                valueString.includes("/")
            ) {

                const parts =
                    valueString.split("/");


                if (parts.length === 3) {

                    const month =
                        parts[0].padStart(2, "0");

                    const day =
                        parts[1].padStart(2, "0");

                    const year =
                        parts[2];


                    if (
                        /^\d{4}$/.test(year)
                    ) {

                        return (
                            year +
                            "-" +
                            month +
                            "-" +
                            day
                        );

                    }

                }

            }


            return valueString;

        }


        const suppliedDOB =
            normalizeDate(
                date_of_birth
            );


        const databaseDOB =
            normalizeDate(
                customer.date_of_birth
            );


        console.log(
            "SUPPLIED DOB:",
            suppliedDOB
        );

        console.log(
            "DATABASE DOB:",
            databaseDOB
        );


        // --------------------------------------------------
        // Verify DOB
        // --------------------------------------------------

        if (
            suppliedDOB !== databaseDOB
        ) {

            console.log(
                "DOB DOES NOT MATCH"
            );


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
            String(
                customer.enrollment_reference
            ).trim() !==
            enrollment_reference
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "The information provided could not be verified."

            });

        }


        // --------------------------------------------------
        // Save enrollment session
        // --------------------------------------------------

        req.session.enrollment_customer_id =
            customer.id;


        req.session.enrollment_account_number =
            customer.account_number;


        // --------------------------------------------------
        // SUCCESS
        // --------------------------------------------------

        console.log(
            "CUSTOMER VERIFICATION SUCCESSFUL"
        );


        return res.json({

            success: true,

            message:
                "Customer verified successfully.",

            customer: {

                id:
                    customer.id,

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
                "Server error while verifying customer.",

            error:
                process.env.NODE_ENV === "production"
                    ? undefined
                    : error.message

        });

    }

});


// ======================================================
// CHECK USERNAME
// ======================================================

app.post(
    "/api/check-username",
    async (req, res) => {

        try {

            const username =
                String(
                    req.body.username || ""
                ).trim();


            if (!username) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Username is required."

                });

            }


            const [rows] =
                await pool.execute(

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
                    rows.length === 0,

                message:
                    rows.length === 0
                        ? "Username is available."
                        : "Username is already taken."

            });


        } catch (error) {

            console.error(
                "USERNAME ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to check username."

            });

        }

    }
);


// ======================================================
// CREATE ONLINE BANKING USER
// ======================================================

app.post(
    "/api/create",
    async (req, res) => {

        try {

            // ------------------------------------------------
            // Check enrollment session
            // ------------------------------------------------

            const customerId =
                req.session.enrollment_customer_id;


            if (!customerId) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Please verify your banking information first."

                });

            }


            const username =
                String(
                    req.body.username || ""
                ).trim();


            const password =
                String(
                    req.body.password || ""
                );


            if (
                !username ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Username and password are required."

                });

            }


            // ------------------------------------------------
            // Check username
            // ------------------------------------------------

            const [existing] =
                await pool.execute(

                    `
                    SELECT id

                    FROM online_users

                    WHERE username = ?

                    LIMIT 1
                    `,

                    [username]

                );


            if (existing.length > 0) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Username is already taken."

                });

            }


            // ------------------------------------------------
            // Find customer
            // ------------------------------------------------

            const [customers] =
                await pool.execute(

                    `
                    SELECT
                        id,
                        active,
                        account_status,
                        online_enrolled

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
                        "Customer could not be found."

                });

            }


            const customer =
                customers[0];


            if (
                Number(customer.active) !== 1 ||
                String(
                    customer.account_status
                ).toLowerCase() !== "active"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Customer account is not active."

                });

            }


            if (
                Number(customer.online_enrolled) === 1
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Customer is already enrolled."

                });

            }


            // ------------------------------------------------
            // Hash password
            // ------------------------------------------------

            const passwordHash =
                await bcrypt.hash(
                    password,
                    10
                );


            // ------------------------------------------------
            // Create user
            // ------------------------------------------------

            await pool.execute(

                `
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
                `,

                [
                    customerId,
                    username,
                    passwordHash
                ]

            );


            // ------------------------------------------------
            // Mark customer enrolled
            // ------------------------------------------------

            await pool.execute(

                `
                UPDATE customers

                SET online_enrolled = 1

                WHERE id = ?
                `,

                [customerId]

            );


            // ------------------------------------------------
            // Clear enrollment data
            // ------------------------------------------------

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
                    "Unable to create online banking account.",

                error:
                    process.env.NODE_ENV === "production"
                        ? undefined
                        : error.message

            });

        }

    }
);


// ======================================================
// LOGIN
// ======================================================

app.post(
    "/api/login",
    async (req, res) => {

        try {

            const username =
                String(
                    req.body.username || ""
                ).trim();


            const password =
                String(
                    req.body.password || ""
                );


            if (
                !username ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Username and password are required."

                });

            }


            // ------------------------------------------------
            // Find online user
            // ------------------------------------------------

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

                    [username]

                );


            if (rows.length === 0) {

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


            // ------------------------------------------------
            // Convert PHP bcrypt $2y$ to Node bcrypt $2b$
            // ------------------------------------------------

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


            // ------------------------------------------------
            // Check password
            // ------------------------------------------------

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


            // ------------------------------------------------
            // Create login session
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

    }
);


// ======================================================
// DASHBOARD
// ======================================================

app.get(
    "/api/dashboard",
    async (req, res) => {

        try {

            // ------------------------------------------------
            // Check session
            // ------------------------------------------------

            if (
                !req.session.user_id
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "You are not logged in."

                });

            }


            const customerId =
                req.session.customer_id;


            // ------------------------------------------------
            // Customer
            // ------------------------------------------------

            const [customerRows] =
                await pool.execute(

                    `
                    SELECT
                        first_name,
                        last_name

                    FROM customers

                    WHERE id = ?

                    LIMIT 1
                    `,

                    [customerId]

                );


            if (
                customerRows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Customer not found."

                });

            }


            // ------------------------------------------------
            // Account
            // ------------------------------------------------

            const [accountRows] =
                await pool.execute(

                    `
                    SELECT
                        account_number,
                        account_type,
                        current_balance,
                        available_balance

                    FROM accounts

                    WHERE customer_id = ?

                    AND status = 'ACTIVE'

                    LIMIT 1
                    `,

                    [customerId]

                );


            if (
                accountRows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "No active bank account found."

                });

            }


            const account =
                accountRows[0];


            // ------------------------------------------------
            // Mask account number
            // ------------------------------------------------

            const accountNumber =
                String(
                    account.account_number
                );


            const maskedAccount =
                "••••" +
                accountNumber.slice(-4);


            // ------------------------------------------------
            // Return dashboard
            // ------------------------------------------------

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
                "DASHBOARD ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Database error while loading dashboard."

            });

        }

    }
);


// ======================================================
// LOGOUT
// ======================================================

app.post(
    "/api/logout",
    (req, res) => {

        req.session.destroy(
            error => {

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


                res.clearCookie(
                    "connect.sid"
                );


                return res.json({

                    success: true,

                    message:
                        "Logged out successfully."

                });

            }
        );

    }
);


// ======================================================
// STATIC FILES
// ======================================================

app.use(
    express.static(
        path.join(__dirname)
    )
);


// ======================================================
// UNKNOWN API ROUTE
// ======================================================

app.use(
    "/api",
    (req, res) => {

        return res.status(404).json({

            success: false,

            message:
                "API endpoint not found.",

            endpoint:
                req.originalUrl

        });

    }
);


// ======================================================
// GENERAL ERROR HANDLER
// ======================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "SERVER ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Internal server error."

        });

    }
);


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
            "========================================"
        );

        console.log(
            `Upright Bank running on port ${PORT}`
        );

        console.log(
            "VERSION: 2026-09-14-FINAL"
        );

        console.log(
            "========================================"
        );

    }
);
