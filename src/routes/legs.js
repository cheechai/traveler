const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db/client');
const requireAuth = require('../middleware/auth');

function now() { return new Date().toISOString(); }

router.use(requireAuth);

router.post('/', (req, res) => {
  const { from_item_id, to_item_id, maps_url, transport_mode, duration_min } = req.body;
  // Upsert: replace any existing leg with same from_item_id
  const existing = db.prepare('SELECT id FROM legs WHERE day_id = ? AND from_item_id = ?').get(req.params.dayId, from_item_id);
  if (existing) {
    db.prepare('UPDATE legs SET to_item_id=?, maps_url=?, transport_mode=?, duration_min=? WHERE id=?')
      .run(to_item_id || null, maps_url, transport_mode || 'driving', duration_min ? parseInt(duration_min) : null, existing.id);
  } else {
    db.prepare('INSERT INTO legs (day_id, from_item_id, to_item_id, maps_url, transport_mode, duration_min, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(req.params.dayId, from_item_id || null, to_item_id || null, maps_url, transport_mode || 'driving', duration_min ? parseInt(duration_min) : null, now());
  }
  const day = db.prepare('SELECT * FROM days WHERE id = ?').get(req.params.dayId);
  res.redirect(`/trips/${day.trip_id}/days/${day.id}`);
});

router.post('/:legId/delete', (req, res) => {
  const leg = db.prepare('SELECT * FROM legs WHERE id = ?').get(req.params.legId);
  db.prepare('DELETE FROM legs WHERE id = ?').run(req.params.legId);
  if (leg) {
    const day = db.prepare('SELECT * FROM days WHERE id = ?').get(leg.day_id);
    if (day) return res.redirect(`/trips/${day.trip_id}/days/${day.id}`);
  }
  res.redirect('/trips');
});

module.exports = router;
