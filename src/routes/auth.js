const express = require('express');
const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session && req.session.authenticated) return res.redirect('/trips');
  res.render('login', { error: req.flash('error')[0] || null });
});

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.APP_PASSWORD) {
    req.session.authenticated = true;
    return res.redirect('/trips');
  }
  req.flash('error', 'Wrong password, try again.');
  res.redirect('/login');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
