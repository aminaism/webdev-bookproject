const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

module.exports = (db) => {

  // show login form
  router.get('/login', (req, res) => {
    res.render('auth-login', { title: 'Login' });
  });

  // handle login submission
  router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
      if (err) return res.status(500).send('Database error');
      if (!user) return res.render('auth-login', { error: 'Invalid username or password', title: 'Login' });

      bcrypt.compare(password, user.password_hash, (err, match) => {
        if (match) {
          req.session.user = { id: user.id, username: user.username };
          res.redirect('/books'); // after login, go to book list
        } else {
          res.render('auth-login', { error: 'Invalid username or password', title: 'Login' });
        }
      });
    });
  });

  // handle logout
  router.post('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
  });

  return router;
};
