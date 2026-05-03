const db = require('./client');

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      destination TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      cover_emoji TEXT NOT NULL DEFAULT '✈️',
      cover_color TEXT NOT NULL DEFAULT '#fde68a',
      notes TEXT,
      budget REAL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      day_number INTEGER NOT NULL,
      title TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'activity',
      title TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      location_name TEXT,
      maps_url TEXT,
      link TEXT,
      notes TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS legs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
      from_item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
      to_item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
      maps_url TEXT NOT NULL,
      transport_mode TEXT NOT NULL DEFAULT 'driving',
      duration_min INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      day_id INTEGER REFERENCES days(id) ON DELETE SET NULL,
      item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
      label TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      paid_by TEXT NOT NULL DEFAULT 'shared',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

module.exports = migrate;
