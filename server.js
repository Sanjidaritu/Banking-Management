const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");

const pool = require("./database");

const app = express();


// ============================
// MIDDLEWARE
// ============================

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ============================
// SESSION
// ============================

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


// ============================
// STATIC FILES
// ============================

app.use(express.static(__dirname));


// ============================
// API HEALTH CHECK
// ============================

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        message: "Node.js API is running"
    });

});


// ============================
// LOGIN API
// ============================

app.post("/api/login", async (req, res) => {

    const { username, password } = req.body;


    // Check input
    if (!username || !password) {

        return res.status(400).json({
            success: false,
            message: "Username and password are required."
        });

    }


    try {

        // Find online banking user
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
            [username.trim()]
        );


        // User not found
        if (rows.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });

        }


        const user = rows[0];


        // Check active status
        if (Number(user.active) !== 1) {

            return res.status(403).json({
                success: false,
                message: "This online banking account is inactive."
            });

        }


        // Check password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );


        if (!passwordMatch) {

            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });

        }


        // Create login session
        req.session.user_id = Number(user.id);

        req.session.customer_id = Number(user.customer_id);

        req.session.username = user.username;


        return res.json({

            success: true,

            message: "Login successful."

        });


    } catch (error) {

        console.error("Login error:", error);


        return res.status(500).json({

            success: false,

            message: "Unable to process login."

        });

    }

});


// ============================
// DASHBOARD API
// ============================

app.get("/api/dashboard", async (req, res) => {


    // Check login session
    if (!req.session.customer_id) {

        return res.status(401).json({

            success: false,

            message: "You are not logged in."

        });

    }


    const customerId = req.session.customer_id;


    try {

        // Get customer account
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


        // No account found
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


        // Format account information
        const accounts = rows.map(account => {


            const accountNumber = String(
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

            accounts: accounts

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


// ============================
// CHECK LOGIN API
// ============================

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


// ============================
// LOGOUT API
// ============================

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


// ============================
// LOGIN PAGE
// ============================

app.get("/login", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "login.html"
        )
    );

});


// ============================
// DASHBOARD PAGE
// ============================

app.get("/dashboard", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "dashboard.html"
        )
    );

});


// ============================
// HOME PAGE
// ============================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

});


// ============================
// START SERVER
// ============================

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

