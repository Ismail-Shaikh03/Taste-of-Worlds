const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const app = express();

// Hardcoded Configuration
const config = {
  DB_HOST: 'localhost',           // MySQL host
  DB_USER: 'admin',               // MySQL username
  DB_PASSWORD: 'Recipeproject1!', // MySQL password
  DB_NAME: 'meal_db',             // Database name
  PORT: 3000                      // Application port
};

// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Create MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',           // Ensure this is correct
  user: 'admin',               // Ensure this matches your MySQL username
  password: 'Recipeproject1!', // Ensure this matches your MySQL password
  database: 'meal_db',         // Ensure this database exists
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

// Serve the home.html page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'), (err) => {
    if (err) {
      console.error('Error serving home.html:', err);
      res.status(500).json({ error: 'Error loading homepage' });
    }
  });
});

// Serve the recipes.html page
app.get('/recipes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'recipes.html'), (err) => {
    if (err) {
      console.error('Error serving recipes.html:', err);
      res.status(500).json({ error: 'Error loading recipes page' });
    }
  });
});

// Serve the about.html page
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'), (err) => {
    if (err) {
      console.error('Error serving about.html:', err);
      res.status(500).json({ error: 'Error loading about page' });
    }
  });
});

// API route to get meals data with filtering and search
app.get('/api/meals', async (req, res) => {
  let { category, area, search } = req.query;

  let sqlQuery = 'SELECT * FROM meals';
  let filters = [];
  let params = [];

  if (category) {
    filters.push('strCategory = ?');
    params.push(category);
  }
  if (area) {
    filters.push('strArea = ?');
    params.push(area);
  }
  if (search) {
    filters.push('(strMeal LIKE ? OR strCategory LIKE ? OR strArea LIKE ?)');
    const searchValue = `%${search}%`;
    params.push(searchValue, searchValue, searchValue);
  }

  if (filters.length > 0) {
    sqlQuery += ' WHERE ' + filters.join(' AND ');
  }

  try {
    const [results] = await pool.query(sqlQuery, params);
    res.json(results);
  } catch (err) {
    console.error('Error fetching meal data:', err);
    res.status(500).json({ error: 'Error fetching meal data', details: err.message });
  }
});

// API route to get categories
app.get('/api/categories', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT DISTINCT strCategory FROM meals');
    res.json(results);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Error fetching categories', details: err.message });
  }
});

// API route to get areas
app.get('/api/areas', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT DISTINCT strArea FROM meals');
    res.json(results);
  } catch (err) {
    console.error('Error fetching areas:', err);
    res.status(500).json({ error: 'Error fetching areas', details: err.message });
  }
});

// Handle undefined routes (404 error)
app.use((req, res) => {
  res.status(404).json({ error: 'Page not found' });
});

// Start the server
app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${config.PORT}`);
});
