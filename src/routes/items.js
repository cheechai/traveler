const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db/client');
const requireAuth = require('../middleware/auth');

function now() { return new Date().toISOString(); }

router.use(requireAuth);

router.post('/', (req, res) => {
  const { type, title, start_time, end_time, location_name, maps_url, link, notes } = req.body;
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM items WHERE day_id = ?').get(req.params.dayId);
  const sortOrder = (maxOrder.m || 0) + 1;
  db.prepare(`
    INSERT INTO items (day_id, type, title, start_time, end_time, location_name, maps_url, link, notes, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.dayId, type || 'activity', title,
    start_time || null, end_time || null,
    location_name || null, maps_url || null,
    link || null, notes || null,
    sortOrder, now(), now()
  );
  // Find the day to redirect back
  const day = db.prepare('SELECT * FROM days WHERE id = ?').get(req.params.dayId);
  res.redirect(`/trips/${day.trip_id}/days/${day.id}`);
});

router.post('/reorder', (req, res) => {
  const ids = JSON.parse(req.body.ids || '[]');
  const update = db.prepare('UPDATE items SET sort_order = ? WHERE id = ?');
  const updateAll = db.transaction(() => {
    ids.forEach((id, i) => update.run(i, id));
  });
  updateAll();
  res.json({ ok: true });
});

router.post('/:itemId', (req, res) => {
  const { type, title, start_time, end_time, location_name, maps_url, link, notes } = req.body;
  db.prepare(`
    UPDATE items SET type=?, title=?, start_time=?, end_time=?, location_name=?, maps_url=?, link=?, notes=?, updated_at=?
    WHERE id=?
  `).run(
    type || 'activity', title,
    start_time || null, end_time || null,
    location_name || null, maps_url || null,
    link || null, notes || null,
    now(), req.params.itemId
  );
  const day = db.prepare('SELECT * FROM days WHERE id = ?').get(req.params.dayId);
  res.redirect(`/trips/${day.trip_id}/days/${day.id}`);
});

router.post('/:itemId/delete', (req, res) => {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.itemId);
  const day = item ? db.prepare('SELECT * FROM days WHERE id = ?').get(item.day_id) : null;
  db.prepare('DELETE FROM items WHERE id = ?').run(req.params.itemId);
  if (day) return res.redirect(`/trips/${day.trip_id}/days/${day.id}`);
  res.redirect('/trips');
});

module.exports = router;
