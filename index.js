const express = require('express')
const app = express();
const PORT = 8000;
require('dotenv').config();
const cors = require("cors");
const bodyParser = require('body-parser')
app.use(cors());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
const { Pool } = require('pg')

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
})



app.get('/', (req, res) => {
    pool
        .query('SELECT * FROM books')
        .then(data => res.json(data.rows))
        .catch(err => console.log(err))
        
})
app.get('/books', async (req, res) => {
    const { genre, minLength, maxLength, isSeries } = req.query;

    let query = 'SELECT * FROM books WHERE 1=1';

    if (genre && genre !== 'any') {
        query += ` AND genre = '${genre}'`;
    }
    if (minLength && minLength !== 'any') {
        query += ` AND length >= ${minLength}`;
    }
    if (maxLength && maxLength !== 'any') {
        query += ` AND length <= ${maxLength}`;
    }
    if (isSeries === 'yes') {
        query += ' AND is_series = true';
    } else if (isSeries === 'no') {
        query += ' AND is_series = false'
    }

    try {
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

app.post('/addbook', async (req, res) => {
    const { title, author, genre, length, is_series } = req.body;

    try {
        const existingBook = await pool.query('SELECT * FROM books WHERE title = $1', [title]);

        if (existingBook.rows.length > 0) {
            return res.status(409).json({ message: 'Book already exists' });
        }
        const result = await pool.query(
            'INSERT INTO books (title, author, genre, length, is_series) VALUES ($1, $2, $3, $4, $5) RETURNING *;',
            [title, author, genre, length, is_series]
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

app.listen(PORT, () => {
    console.log('Server is running ...')
})

