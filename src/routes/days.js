const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db/client');
const requireAuth = require('../middleware/auth');

function now() { return new Date().toISOString(); }

function dateRange(start, end) {
  const dates = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

router.use(requireAuth);

// Auto-generate one day per date in trip range
router.post('/generate', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.tripId);
  if (!trip) return res.status(404).send('Not found');
  const existing = db.prepare('SELECT date FROM days WHERE trip_id = ?').all(trip.id).map(d => d.date);
  const dates = dateRange(trip.start_date, trip.end_date);
  const insert = db.prepare('INSERT INTO days (trip_id, date, day_number, created_at) VALUES (?, ?, ?, ?)');
  const insertAll = db.transaction(() => {
    dates.forEach((date, i) => {
      if (!existing.includes(date)) {
        insert.run(trip.id, date, i + 1, now());
      }
    });
  });
  insertAll();
  req.flash('success', 'Days generated!');
  res.redirect(`/trips/${trip.id}`);
});

// Create single day
router.post('/', (req, res) => {
  const { date, title, notes } = req.body;
  const count = db.prepare('SELECT COUNT(*) as c FROM days WHERE trip_id = ?').get(req.params.tripId).c;
  db.prepare('INSERT INTO days (trip_id, date, day_number, title, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.params.tripId, date, count + 1, title || null, notes || null, now());
  res.redirect(`/trips/${req.params.tripId}`);
});

// Show day timeline
router.get('/:dayId', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.tripId);
  const day = db.prepare('SELECT * FROM days WHERE id = ? AND trip_id = ?').get(req.params.dayId, req.params.tripId);
  if (!trip || !day) return res.status(404).render('404');
  const items = db.prepare('SELECT * FROM items WHERE day_id = ? ORDER BY sort_order, start_time').all(day.id);
  const legs = db.prepare('SELECT * FROM legs WHERE day_id = ?').all(day.id);
  const legsMap = {};
  legs.forEach(l => { if (l.from_item_id) legsMap[l.from_item_id] = l; });
  const days = db.prepare('SELECT * FROM days WHERE trip_id = ? ORDER BY day_number').all(trip.id);
  res.render('days/show', { trip, day, items, legsMap, days, messages: req.flash('success') });
});

// Edit day meta
router.get('/:dayId/edit', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.tripId);
  const day = db.prepare('SELECT * FROM days WHERE id = ? AND trip_id = ?').get(req.params.dayId, req.params.tripId);
  if (!trip || !day) return res.status(404).render('404');
  res.render('days/edit', { trip, day });
});

router.post('/:dayId', (req, res) => {
  const { title, notes } = req.body;
  db.prepare('UPDATE days SET title=?, notes=? WHERE id=?').run(title || null, notes || null, req.params.dayId);
  res.redirect(`/trips/${req.params.tripId}/days/${req.params.dayId}`);
});

router.post('/:dayId/delete', (req, res) => {
  db.prepare('DELETE FROM days WHERE id = ?').run(req.params.dayId);
  req.flash('success', 'Day deleted.');
  res.redirect(`/trips/${req.params.tripId}`);
});

module.exports = router;
