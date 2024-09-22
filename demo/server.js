// server.js
const express = require('express');
const sql = require('mssql');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Function to get the database pool
const getPool = async () => {
    const pool = await sql.connect({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_SERVER,
        database: process.env.DB_DATABASE,
        options: {
            encrypt: true, // Use this if you're on Azure
            trustServerCertificate: true // Change to true for local dev / self-signed certs
        }
    });
    return pool;
};

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .input('password', sql.VarChar, password)
            .query('SELECT description FROM [User] WHERE username = @username AND password = @password');

        if (result.recordset.length > 0) {
            res.status(200).json({ description: result.recordset[0].description });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
