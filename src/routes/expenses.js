const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db/client');
const requireAuth = require('../middleware/auth');

function now() { return new Date().toISOString(); }

router.use(requireAuth);

router.get('/', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.tripId);
  if (!trip) return res.status(404).render('404');

  const expenses = db.prepare(`
    SELECT e.*, d.date, d.day_number FROM expenses e
    LEFT JOIN days d ON e.day_id = d.id
    WHERE e.trip_id = ?
    ORDER BY d.day_number, e.created_at
  `).all(trip.id);

  const summary = db.prepare(`
    SELECT
      SUM(amount) as total,
      SUM(CASE WHEN paid_by = 'me' THEN amount ELSE 0 END) as paid_me,
      SUM(CASE WHEN paid_by = 'partner' THEN amount ELSE 0 END) as paid_partner,
      SUM(CASE WHEN paid_by = 'shared' THEN amount ELSE 0 END) as paid_shared
    FROM expenses WHERE trip_id = ?
  `).get(trip.id);

  const byCategory = db.prepare(`
    SELECT category, SUM(amount) as total FROM expenses WHERE trip_id = ? GROUP BY category ORDER BY total DESC
  `).all(trip.id);

  const days = db.prepare('SELECT * FROM days WHERE trip_id = ? ORDER BY day_number').all(trip.id);

  res.render('expenses/index', { trip, expenses, summary, byCategory, days, messages: req.flash('success') });
});

router.post('/', (req, res) => {
  const { label, amount, currency, category, paid_by, day_id } = req.body;
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.tripId);
  db.prepare(`
    INSERT INTO expenses (trip_id, day_id, label, amount, currency, category, paid_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.tripId, day_id || null, label,
    parseFloat(amount), currency || (trip && trip.currency) || 'USD', category || 'other',
    paid_by || 'shared', now(), now()
  );
  req.flash('success', 'Expense added!');
  res.redirect(`/trips/${req.params.tripId}/expenses`);
});

router.post('/:expId', (req, res) => {
  const { label, amount, currency, category, paid_by, day_id } = req.body;
  db.prepare(`
    UPDATE expenses SET label=?, amount=?, currency=?, category=?, paid_by=?, day_id=?, updated_at=?
    WHERE id=?
  `).run(label, parseFloat(amount), currency || 'USD', category || 'other', paid_by || 'shared', day_id || null, now(), req.params.expId);
  req.flash('success', 'Expense updated!');
  res.redirect(`/trips/${req.params.tripId}/expenses`);
});

router.post('/:expId/delete', (req, res) => {
  db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.expId);
  req.flash('success', 'Expense deleted.');
  res.redirect(`/trips/${req.params.tripId}/expenses`);
});

router.get('/export', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.tripId);
  const expenses = db.prepare(`
    SELECT e.*, d.date FROM expenses e LEFT JOIN days d ON e.day_id = d.id WHERE e.trip_id = ? ORDER BY d.date, e.created_at
  `).all(req.params.tripId);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${trip.title}-expenses.csv"`);
  res.write('Date,Label,Amount,Currency,Category,Paid By\n');
  expenses.forEach(e => {
    res.write(`"${e.date || ''}","${e.label}",${e.amount},"${e.currency}","${e.category}","${e.paid_by}"\n`);
  });
  res.end();
});

module.exports = router;
