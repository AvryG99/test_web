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
            encrypt: true,
            trustServerCertificate: true
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
            .query('SELECT description, password FROM [User] WHERE username = @username');

        if (result.recordset.length > 0) {
            const storedPassword = result.recordset[0].password;
            if (password === storedPassword) {
                res.status(200).json({ description: result.recordset[0].description });
            } else {
                res.status(401).json({ message: 'Invalid username or password' });
            }
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Register endpoint
app.post('/register', async (req, res) => {
    const { username, password, description } = req.body;

    try {
        const pool = await getPool();

        const existingUser = await pool.request()
            .input('username', sql.VarChar, username)
            .query('SELECT * FROM [User] WHERE username = @username');

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        await pool.request()
            .input('username', sql.VarChar, username)
            .input('password', sql.VarChar, password) // Store plain text password
            .input('description', sql.VarChar, description)
            .query('INSERT INTO [User] (username, password, description) VALUES (@username, @password, @description)');

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// User Profile endpoint
app.get('/user/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query('SELECT description FROM [User] WHERE username = @username');

        if (result.recordset.length > 0) {
            res.status(200).json({ description: result.recordset[0].description });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
