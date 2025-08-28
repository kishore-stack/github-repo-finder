const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MySQL connection for both development and production
const connection = mysql.createConnection({
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'github_repos',
  port: process.env.MYSQLPORT || 3306
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
  
  // Create table if not exists
  connection.execute(`
    CREATE TABLE IF NOT EXISTS searches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      keyword VARCHAR(255) NOT NULL,
      results JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err);
    } else {
      console.log('Table ready');
    }
  });
});

// API route to get search history
app.get('/api/searches', (req, res) => {
  connection.execute(
    'SELECT * FROM searches ORDER BY created_at DESC LIMIT 10',
    (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);
    }
  );
});

// API route to search GitHub
app.post('/api/search', async (req, res) => {
  const { keyword, page = 1 } = req.body;
  
  if (!keyword) {
    return res.status(400).json({ error: 'Keyword is required' });
  }

  try {
    // Fetch from GitHub API
    const perPage = 30;
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(keyword)}&page=${page}&per_page=${perPage}`
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Save to database
    connection.execute(
      'INSERT INTO searches (keyword, results) VALUES (?, ?)',
      [keyword, JSON.stringify(data)],
      (err) => {
        if (err) {
          console.error('Error saving to database:', err);
        }
      }
    );
    
    res.json(data);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});