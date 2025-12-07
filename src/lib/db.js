/**
 * Database initialization and connection
 * Uses better-sqlite3 for SQLite database operations
 */

import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'

// ============================================================================
// DATABASE SETUP
// ============================================================================

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'assignments.db')

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR)
}

// Initialize database connection
const db = new Database(DB_PATH)

// Create assignments table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    dueDate TEXT,
    difficulty INTEGER,
    estimatedMinutes INTEGER,
    description TEXT,
    completed INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 5
  )
`).run()

// Add priority column if it doesn't exist
try {
  db.prepare('ALTER TABLE assignments ADD COLUMN priority INTEGER DEFAULT 5').run()
} catch (e) {
  // Column already exists
}

// Create flashcards table
db.prepare(`
  CREATE TABLE IF NOT EXISTS flashcards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run()

// Create study_guides table
db.prepare(`
  CREATE TABLE IF NOT EXISTS study_guides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run()

export default db
