const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");

const dashboardRoutes = require("./routes/dashboard");

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(
    session({
        secret: process.env.SESSION_SECRET || "change-this-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        }
    })
);

// Static frontend
app.use(express.static(path.join(__dirname, "public")));

// Dashboard API
app.use("/api/dashboard", dashboardRoutes);

// Dashboard page
app.get("/dashboard", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "dashboard.html")
    );
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
