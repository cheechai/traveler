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
      end_day_id INTEGER REFERENCES days(id) ON DELETE SET NULL,
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
  // add end_day_id to items if it doesn't exist yet
  const itemCols = db.prepare("PRAGMA table_info(items)").all().map(c => c.name);
  if (!itemCols.includes('end_day_id')) {
    db.exec("ALTER TABLE items ADD COLUMN end_day_id INTEGER REFERENCES days(id) ON DELETE SET NULL");
  }

  // add home_currency to trips if it doesn't exist yet
  const tripCols = db.prepare("PRAGMA table_info(trips)").all().map(c => c.name);
  if (!tripCols.includes('home_currency')) {
    db.exec("ALTER TABLE trips ADD COLUMN home_currency TEXT NOT NULL DEFAULT 'USD'");
  }

  // add flight fields to items if they don't exist yet
  const itemCols2 = db.prepare("PRAGMA table_info(items)").all().map(c => c.name);
  const flightCols = { flight_number: 'TEXT', airline: 'TEXT', departure_airport: 'TEXT', arrival_airport: 'TEXT' };
  for (const [col, type] of Object.entries(flightCols)) {
    if (!itemCols2.includes(col)) {
      db.exec(`ALTER TABLE items ADD COLUMN ${col} ${type}`);
    }
  }
}

module.exports = migrate;
