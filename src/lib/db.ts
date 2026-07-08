import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'aurelia.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchema(db);
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS artists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      bio TEXT DEFAULT '',
      image_url TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
      cover_url TEXT DEFAULT '',
      year INTEGER DEFAULT 0,
      UNIQUE(title, artist_id)
    );

    CREATE TABLE IF NOT EXISTS tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
      album_id INTEGER REFERENCES albums(id) ON DELETE SET NULL,
      duration INTEGER DEFAULT 0,
      audio_url TEXT DEFAULT '',
      genre TEXT DEFAULT '',
      bpm INTEGER DEFAULT 0,
      plays INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist_id);
    CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album_id);
    CREATE INDEX IF NOT EXISTS idx_tracks_title ON tracks(title);
    CREATE INDEX IF NOT EXISTS idx_albums_artist ON albums(artist_id);
  `);
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
