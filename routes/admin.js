const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');


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
    if (err) {
      req.session.flash = { type: 'error', message: 'Database error. Please try again.' };
      return res.redirect('/auth/login');
    }
    if (!user) return res.render('auth-login', { error: 'Invalid username or password', title: 'Login' });

    
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
 req.session.destroy(() => res.redirect('/auth/login'));
});

/* --- Genres CRUD --- */
// list
router.get('/genres', requireLogin, (req, res) => {
  const db = req.app.locals.db;
  db.all('SELECT * FROM genres ORDER BY name COLLATE NOCASE', [], (err, genres) => {
    if (err) {
      res.locals.flash = { type: 'error', message: 'Unable to load genres.' };
      return res.render('admin/genres', { title: 'Manage Genres', genres: [] });
    }
    res.render('admin/genres', { title: 'Manage Genres', genres });
  });
});

// create (form and post)
router.get('/genres/new', requireLogin, (req, res) => res.render('admin/genre-form', { genre: {} }));
router.post('/genres/new', requireLogin, (req, res) => {
  const db = req.app.locals.db;
  db.run('INSERT INTO genres (name) VALUES (?)', [req.body.name], (err) => {
    if (err) {
      req.session.flash = { type: 'error', message: 'Unable to add genre.' };
      return res.redirect('/admin/genres');
    }
    req.session.flash = { type: 'success', message: 'Genre added successfully.' };
    res.redirect('/admin/genres');
  });
});

// delete
router.post('/genres/:id/delete', requireLogin, (req, res) => {
  const db = req.app.locals.db;
  db.run('DELETE FROM genres WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      req.session.flash = { type: 'error', message: 'Unable to delete genre.' };
      return res.redirect('/admin/genres');
    }
    req.session.flash = { type: 'success', message: 'Genre deleted.' };
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
    if (err) {
      res.locals.flash = { type: 'error', message: 'Unable to load books.' };
      return res.render('admin/books', { title: 'Manage Books', books: [] });
    }
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
    if (err) {
      req.session.flash = { type: 'error', message: 'Unable to add book.' };
      return res.redirect('/admin/books');
    }
    req.session.flash = { type: 'success', message: 'Book added successfully.' };
    res.redirect('/admin/books');
  });
});

// delete
router.post('/books/:id/delete', requireLogin, (req, res) => {
  const db = req.app.locals.db;
  db.run('DELETE FROM books WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      req.session.flash = { type: 'error', message: 'Unable to delete book.' };
      return res.redirect('/admin/books');
    }
    req.session.flash = { type: 'success', message: 'Book deleted.' };
    res.redirect('/admin/books');
  });
});

/* --- Users CRUD --- */
// list users
router.get('/users', requireLogin, (req, res) => {
  const db = req.app.locals.db;
  db.all('SELECT id, username FROM users ORDER BY username', [], (err, users) => {
    if (err) {
      res.locals.flash = { type: 'error', message: 'Unable to load users.' };
      return res.render('admin/users', { title: 'Manage Users', users: [] });
    }
    res.render('admin/users', { title: 'Manage Users', users });
  });
});

// new user form
router.get('/users/new', requireLogin, (req, res) => {
  res.render('admin/user-form', { user: {}, title: 'Add User' });
});

// create user
router.post('/users/new', requireLogin, async (req, res) => {
  const db = req.app.locals.db;
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('admin/user-form', {
      error: 'All fields are required',
      user: { username }
    });
  }

  const hash = await bcrypt.hash(password, 10);

  db.run(
    'INSERT INTO users (username, password_hash) VALUES (?, ?)',
    [username, hash],
    (err) => {
      if (err) {
        req.session.flash = { type: 'error', message: 'Unable to create user.' };
        return res.redirect('/admin/users');
      }
      req.session.flash = { type: 'success', message: 'User created.' };
      res.redirect('/admin/users');
    }
  );
});

// edit user form
router.get('/users/:id/edit', requireLogin, (req, res) => {
  const db = req.app.locals.db;
  db.get('SELECT id, username FROM users WHERE id = ?', [req.params.id], (err, user) => {
    if (err || !user) {
      req.session.flash = { type: 'error', message: 'Unable to load user.' };
      return res.redirect('/admin/users');
    }
    res.render('admin/user-form', { user, title: 'Edit User' });
  });
});

// update user
router.post('/users/:id/edit', requireLogin, async (req, res) => {
  const db = req.app.locals.db;
  const { username, password } = req.body;

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    db.run(
      'UPDATE users SET username = ?, password_hash = ? WHERE id = ?',
      [username, hash, req.params.id],
      () => {
        req.session.flash = { type: 'success', message: 'User updated.' };
        res.redirect('/admin/users');
      }
    );
  } else {
    db.run(
      'UPDATE users SET username = ? WHERE id = ?',
      [username, req.params.id],
      () => {
        req.session.flash = { type: 'success', message: 'User updated.' };
        res.redirect('/admin/users');
      }
    );
  }
});

// delete user
router.post('/users/:id/delete', requireLogin, (req, res) => {
  const db = req.app.locals.db;
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], () => {
    req.session.flash = { type: 'success', message: 'User deleted.' };
    res.redirect('/admin/users');
  });
});

module.exports = router;

/*
{{!-- Reference: Lectures Week 2, 3, 4, 5, 6 and labs conducted by teacher Jérôme Landré --}}
// Reference from Khan Academy: CRUDS & Login/Logout Routes*/