const express = require('express');
const router = express.Router();
const db = require('../db/client');
const requireAuth = require('../middleware/auth');

function now() { return new Date().toISOString(); }

router.use(requireAuth);

router.get('/', (req, res) => {
  const trips = db.prepare('SELECT * FROM trips ORDER BY start_date DESC').all();
  res.render('trips/index', { trips, messages: req.flash('success') });
});

router.get('/new', (req, res) => {
  res.render('trips/new', { error: req.flash('error')[0] || null });
});

router.post('/', (req, res) => {
  const { title, destination, start_date, end_date, cover_emoji, cover_color, budget, currency, home_currency, notes } = req.body;
  const stmt = db.prepare(`
    INSERT INTO trips (title, destination, start_date, end_date, cover_emoji, cover_color, budget, currency, home_currency, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    title, destination, start_date, end_date,
    cover_emoji || '✈️', cover_color || '#fde68a',
    parseFloat(budget) || 0, currency || 'USD', home_currency || 'USD', notes || '',
    now(), now()
  );
  req.flash('success', 'Trip created!');
  res.redirect(`/trips/${result.lastInsertRowid}`);
});

router.get('/:id', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!trip) return res.status(404).render('404');
  const allDays = db.prepare('SELECT * FROM days WHERE trip_id = ? ORDER BY day_number').all(trip.id);

  // Split into upcoming (today + future) and past, keep each group in day_number order
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = allDays.filter(d => d.date >= today);
  const past     = allDays.filter(d => d.date <  today);
  const days = [...upcoming, ...past];

  const itemsByDay = {};
  allDays.forEach(day => {
    itemsByDay[day.id] = db.prepare('SELECT * FROM items WHERE day_id = ? ORDER BY sort_order, start_time').all(day.id);
  });
  // Flat list for overview section, joined with day info
  const overviewItems = db.prepare(`
    SELECT i.*, d.day_number, d.date as day_date
    FROM items i JOIN days d ON i.day_id = d.id
    WHERE d.trip_id = ?
    ORDER BY d.day_number, i.sort_order, i.start_time
  `).all(trip.id);
  const expenseSummary = db.prepare(`
    SELECT SUM(amount) as total FROM expenses WHERE trip_id = ?
  `).get(trip.id);
  res.render('trips/show', { trip, days, itemsByDay, overviewItems, totalSpent: expenseSummary.total || 0, today, messages: req.flash('success') });
});

router.get('/:id/edit', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!trip) return res.status(404).render('404');
  res.render('trips/edit', { trip, error: req.flash('error')[0] || null });
});

router.post('/:id', (req, res) => {
  const { title, destination, start_date, end_date, cover_emoji, cover_color, budget, currency, home_currency, notes } = req.body;
  db.prepare(`
    UPDATE trips SET title=?, destination=?, start_date=?, end_date=?, cover_emoji=?, cover_color=?, budget=?, currency=?, home_currency=?, notes=?, updated_at=?
    WHERE id=?
  `).run(title, destination, start_date, end_date, cover_emoji || '✈️', cover_color || '#fde68a',
    parseFloat(budget) || 0, currency || 'USD', home_currency || 'USD', notes || '', now(), req.params.id);
  req.flash('success', 'Trip updated!');
  res.redirect(`/trips/${req.params.id}`);
});

router.post('/:id/delete', (req, res) => {
  db.prepare('DELETE FROM trips WHERE id = ?').run(req.params.id);
  req.flash('success', 'Trip deleted.');
  res.redirect('/trips');
});

module.exports = router;
