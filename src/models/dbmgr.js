const sqlite3 = require('better-sqlite3-with-prebuilds');

// Create a new database
const db = new sqlite3('../src/Chinook.db');
// Create a table
/* db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )
`); */

// Export the database instance
module.exports = db;

