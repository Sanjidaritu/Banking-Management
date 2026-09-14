const mysql = require("mysql2/promise");

// ======================================================
// UPRIGHT BANK - MYSQL DATABASE CONNECTION
// ======================================================

const pool = mysql.createPool({

    // Railway MySQL connection
    host: process.env.MYSQLHOST,

    port: Number(process.env.MYSQLPORT) || 3306,

    user: process.env.MYSQLUSER,

    password: process.env.MYSQLPASSWORD,

    database: process.env.MYSQLDATABASE,


    // Connection pool settings
    waitForConnections: true,

    connectionLimit: 10,

    queueLimit: 0
});


// ======================================================
// TEST DATABASE CONNECTION
// ======================================================

pool.getConnection()
    .then(connection => {

        console.log("MySQL database connected successfully.");

        connection.release();

    })
    .catch(error => {

        console.error(
            "MySQL database connection failed:",
            error.message
        );

    });


// ======================================================
// EXPORT DATABASE POOL
// ======================================================

module.exports = pool;
