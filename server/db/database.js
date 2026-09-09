import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'striker.db');
export const db = new DatabaseSync(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      pin TEXT NOT NULL DEFAULT '1234',
      favorite_club TEXT NOT NULL DEFAULT 'SCP',
      avatar TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clubs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      primary_color TEXT NOT NULL,
      secondary_color TEXT NOT NULL,
      accent_color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leagues (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      creator_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS league_members (
      league_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0.00,
      joined_at TEXT NOT NULL,
      PRIMARY KEY (league_id, user_id),
      FOREIGN KEY (league_id) REFERENCES leagues(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      round INTEGER NOT NULL,
      home_club_id TEXT NOT NULL,
      away_club_id TEXT NOT NULL,
      kickoff_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'UPCOMING',
      home_score INTEGER,
      away_score INTEGER,
      result TEXT,
      FOREIGN KEY (home_club_id) REFERENCES clubs(id),
      FOREIGN KEY (away_club_id) REFERENCES clubs(id)
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      league_id TEXT NOT NULL,
      choice TEXT NOT NULL,
      created_at TEXT NOT NULL,
      points_won REAL NOT NULL DEFAULT 0.00,
      net_points REAL NOT NULL DEFAULT 0.00,
      UNIQUE(user_id, game_id, league_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (game_id) REFERENCES games(id),
      FOREIGN KEY (league_id) REFERENCES leagues(id)
    );
  `);
}
