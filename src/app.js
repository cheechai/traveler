require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const path = require('path');
const SQLiteStore = require('connect-sqlite3')(session);

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: process.env.DATABASE_PATH ? path.dirname(process.env.DATABASE_PATH) : './data' }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.use(flash());

// Make flash messages and helpers available in all views
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// formatDate('2025-04-03') → 'Thu, 03 Apr'
app.locals.formatDate = function(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dd = String(d).padStart(2, '0');
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1];
  const weekday = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getUTCDay()];
  return weekday + ', ' + dd + ' ' + month;
};

app.get('/health', (req, res) => res.send('OK'));
app.get('/', (req, res) => res.redirect('/trips'));

app.use(require('./routes/auth'));
app.use('/trips', require('./routes/trips'));
app.use('/trips/:tripId/days', require('./routes/days'));
app.use('/trips/:tripId/expenses', require('./routes/expenses'));
app.use('/days/:dayId/items', require('./routes/items'));
app.use('/days/:dayId/legs', require('./routes/legs'));

app.use((req, res) => res.status(404).render('404'));

module.exports = app;
