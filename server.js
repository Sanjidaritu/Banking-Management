
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");

const pool = require("./database");

const app = express();


/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


/*
 * Session
 */

app.use(session({

    secret:
        process.env.SESSION_SECRET ||
        "upright-bank-secret",

    resave: false,

    saveUninitialized: false,

    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: "lax"
    }

}));


/*
 * Serve HTML / JS / CSS files
 */

app.use(
    express.static(
        path.join(__dirname)
    )
);


/* =====================================================
   DASHBOARD API
===================================================== */

app.get("/api/dashboard", async (req, res) => {

    try {

        /*
         * Check login
         */

        if (!req.session.user_id) {

            return res.status(401).json({

                success: false,

                message:
                    "You are not logged in."

            });

        }


        const customerId =
            req.session.customer_id;


        /*
         * Find customer's active account
         */

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

        `, [
            customerId
        ]);


        /*
         * Account not found
         */

        if (rows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "No active bank account found."

            });

        }


        /*
         * Send account information
         */

        res.json({

            success: true,

            username:
                req.session.username,

            account: rows[0]

        });


    } catch (error) {

        console.error(
            "Dashboard database error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to load account information."

        });

    }

});


/* =====================================================
   LOGOUT API
===================================================== */

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


        res.json({

            success: true,

            message:
                "Logged out successfully."

        });

    });

});


/* =====================================================
   START SERVER
===================================================== */

const PORT =
    process.env.PORT || 3000;


app.listen(PORT, () => {

    console.log(
        `Upright Bank server running on port ${PORT}`
    );

});
