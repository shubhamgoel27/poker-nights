import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
    const dbPath = path.join(dataDir, "poker.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      emoji      TEXT    NOT NULL DEFAULT '🃏',
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      date       TEXT    NOT NULL,
      notes      TEXT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS session_players (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      player_id  INTEGER NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
      buy_in     REAL    NOT NULL CHECK (buy_in >= 0),
      cash_out   REAL    NOT NULL CHECK (cash_out >= 0),
      UNIQUE(session_id, player_id)
    );

    CREATE INDEX IF NOT EXISTS idx_session_players_session ON session_players(session_id);
    CREATE INDEX IF NOT EXISTS idx_session_players_player ON session_players(player_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date DESC);
  `);
}
