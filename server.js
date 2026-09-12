
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");

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
        sameSite: "lax"
    }

}));


// ======================================================
// DASHBOARD API
// ======================================================

app.get("/api/dashboard", async (req, res) => {

    console.log("Dashboard API called");

    try {

        // Check login session
        if (!req.session.user_id) {

            return res.status(401).json({
                success: false,
                message: "You are not logged in."
            });

        }


        const customerId =
            req.session.customer_id;


        console.log(
            "Customer ID:",
            customerId
        );


        // Get customer's account
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
                message: "No active bank account found."
            });

        }


        // Return JSON
        res.json({

            success: true,

            username:
                req.session.username,

            account: rows[0]

        });


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        res.status(500).json({

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

                message: "Logout failed."

            });

        }


        res.json({

            success: true,

            message: "Logged out successfully."

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
// START SERVER
// ======================================================

const PORT =
    process.env.PORT || 3000;


app.listen(PORT, () => {

    console.log(
        `Upright Bank running on port ${PORT}`
    );

});
