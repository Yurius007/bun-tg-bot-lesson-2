import { Database } from "bun:sqlite";

export const db = new Database("food_tracker.db");

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    telegram_id INTEGER PRIMARY KEY,
    age         INTEGER NOT NULL,
    weight      REAL    NOT NULL,
    height      REAL    NOT NULL,
    sex         TEXT    NOT NULL,
    activity_level TEXT NOT NULL,
    bmr         REAL    NOT NULL,
    tdee        REAL    NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS meals (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL,
    raw_text            TEXT    NOT NULL,
    calories_estimated  REAL    NOT NULL DEFAULT 0,
    ai_json             TEXT,
    notes               TEXT,
    timestamp           TEXT    NOT NULL
  )
`);

// migration for existing databases
try {
  db.run(`ALTER TABLE meals ADD COLUMN ai_json TEXT`);
} catch {
  // column already exists
}
