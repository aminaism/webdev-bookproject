const express = require('express');
const router = express.Router();

// requireLogin 
function requireLogin(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/auth/login');
}

/* --- LOGIN / LOGOUT ROUTES --- */

// show login form
router.get('/login', (req, res) => {
  res.render('auth-login', { title: 'Login' });
});

// handle login form submission
router.post('/login', (req, res) => {
  const db = req.app.locals.db;
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).send('Database error');
    if (!user) return res.render('auth-login', { error: 'Invalid username or password', title: 'Login' });

    const bcrypt = require('bcrypt');
    bcrypt.compare(password, user.password_hash, (err, match) => {
      if (match) {
        req.session.user = { id: user.id, username: user.username };
        res.redirect('/admin/books'); // redirect to admin page after login
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

/* --- Genres CRUD --- */
// list
router.get('/genres', requireLogin, (req, res) => {
  const db = req.app.locals.db;
  db.all('SELECT * FROM genres ORDER BY name COLLATE NOCASE', [], (err, genres) => {
    if (err) return res.status(500).send(err.message);
    res.render('admin/genres', { title: 'Manage Genres', genres });
  });
});

// create (form and post)
router.get('/genres/new', requireLogin, (req, res) => res.render('admin/genre-form', { genre: {} }));
router.post('/genres/new', requireLogin, (req, res) => {
  const db = req.app.locals.db;
  db.run('INSERT INTO genres (name) VALUES (?)', [req.body.name], (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect('/admin/genres');
  });
});

// delete
router.post('/genres/:id/delete', requireLogin, (req, res) => {
  const db = req.app.locals.db;
  db.run('DELETE FROM genres WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect('/admin/genres');
  });
});

/* --- Books CRUD (simplified) --- */
// list
router.get('/books', requireLogin, (req, res) => {
  const db = req.app.locals.db;
  db.all(`SELECT b.id, b.title, a.name AS author, g.name AS genre
          FROM books b
          LEFT JOIN authors a ON b.author_id = a.id
          LEFT JOIN genres g ON b.genre_id = g.id
          ORDER BY b.title COLLATE NOCASE`, [], (err, books) => {
    if (err) return res.status(500).send(err.message);
    res.render('admin/books', { title: 'Manage Books', books });
  });
});

// new form
router.get('/books/new', requireLogin, (req, res) => {
  const db = req.app.locals.db;
  db.all('SELECT * FROM authors', [], (ae, authors) => {
    db.all('SELECT * FROM genres', [], (ge, genres) => {
      res.render('admin/book-form', { book: {}, authors, genres });
    });
  });
});
router.post('/books/new', requireLogin, (req, res) => {
  const db = req.app.locals.db;
  const { title, description, author_id, genre_id } = req.body;
  db.run('INSERT INTO books (title, description, author_id, genre_id) VALUES (?,?,?,?)',
         [title, description, author_id || null, genre_id || null], (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect('/admin/books');
  });
});

// delete
router.post('/books/:id/delete', requireLogin, (req, res) => {
  const db = req.app.locals.db;
  db.run('DELETE FROM books WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect('/admin/books');
  });
});

module.exports = router;