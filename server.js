const express = require('express');
const path = require('path');
const { engine }=require ('express-handlebars') // load the handlebars package for express
const sqlite3=require('sqlite3');

const app = express();
const PORT = 4321;

const db = new sqlite3.Database(path.join(__dirname, 'db', 'my-project-db.sqlite3.db'), (err) => {
 if (err) {
  console.error('Error opening database:', err.message);
} else {
  console.log('Connected to the SQLite database.');
}
});

//Tables and insert sample data 

db.serialize(() => {
  // Authors table
  db.run(`
    CREATE TABLE IF NOT EXISTS authors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      bio TEXT
    )
  `);

  // Genres table
  db.run(`
    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    )
  `);

  // Books table
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      author_id INTEGER,
      genre_id INTEGER,
      FOREIGN KEY (author_id) REFERENCES authors(id),
      FOREIGN KEY (genre_id) REFERENCES genres(id)
    )
  `);

  // Insert authors (if table empty)
  db.get("SELECT COUNT(*) as count FROM authors", (err, row) => {
    if (row.count === 0) {
      db.run(`INSERT INTO authors (name,bio) VALUES
        ('J.K. Rowling', 'Author of Harry Potter series'),
        ('Sally Rooney', 'Author of Intermezzo'),
        ('Jane Austen', 'Author of Sense and Sensibility')
      `);
    }
  });

  // Insert genres (if table empty)
  db.get("SELECT COUNT(*) as count FROM genres", (err, row) => {
    if (row.count === 0) {
      db.run(`INSERT INTO genres (name) VALUES
        ('Fantasy'),
        ('Psychological'),
        ('Romance')
      `);
    }
  });

  // Insert books (if table empty)
  db.get("SELECT COUNT(*) as count FROM books", (err, row) => {
    if (row.count === 0) {
      db.run(`INSERT INTO books (title, description, author_id, genre_id) VALUES
        ('Harry Potter and the Sorcerer''s Stone', 'First book in the Harry Potter series', 1, 1),
        ('Harry Potter and the Chamber of Secrets', 'Second book in the series', 1, 1),
        ('Harry Potter and the Prisoner of Azkaban', 'Third book in the series', 1, 1),
        ('Normal People', 'A psychological exploration of young love', 2, 2),
        ('Conversations with Friends', 'A story about friendship and self-discovery', 2, 2),
        ('Intermezzo', 'Another psychological novel by Sally Rooney', 2, 2),
        ('Sense and Sensibility', 'Classic romance novel', 3, 3),
        ('Pride and Prejudice', 'Classic romantic story', 3, 3),
        ('Emma', 'Romantic novel by Jane Austen', 3, 3),
        ('Mansfield Park', 'Another romantic classic', 3, 3)
      `);
    }
  });

});

// Setup Handlebars with helpers
app.engine('handlebars', engine({
  helpers: {
    increment: (value) => parseInt(value) + 1,
    decrement: (value) => parseInt(value) - 1,
    range: (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i),
    ifCond: function (v1, operator, v2, options) {
      switch (operator) {
        case '==': return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===': return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '<': return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '>': return (v1 > v2) ? options.fn(this) : options.inverse(this);
        default: return options.inverse(this);
      }
    }
  }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Redirect homepage to /books
app.get('/', (req, res) => res.redirect('/books'));

// Books with pagination
app.get('/books', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 3;
  const offset = (page - 1) * limit;

  db.all(`
    SELECT books.id, books.title, books.description, authors.name AS author, genres.name AS genre
    FROM books
    LEFT JOIN authors ON books.author_id = authors.id
    LEFT JOIN genres ON books.genre_id = genres.id
    LIMIT ? OFFSET ?
  `, [limit, offset], (err, books) => {
    if (err) return res.status(500).send(err.message);

    db.get("SELECT COUNT(*) AS count FROM books", (err, row) => {
      if (err) return res.status(500).send(err.message);
      const totalPages = Math.ceil(row.count / limit);
      res.render('books', { books, page, totalPages });
    });
  });
});

// Book details
app.get('/books/:id', (req, res) => {
  const bookId = req.params.id;
  db.get(`
    SELECT books.id, books.title, books.description, authors.name AS author, genres.name AS genre
    FROM books
    LEFT JOIN authors ON books.author_id = authors.id
    LEFT JOIN genres ON books.genre_id = genres.id
    WHERE books.id = ?
  `, [bookId], (err, book) => {
    if (err) return res.status(500).send(err.message);
    if (!book) return res.status(404).send("Book not found");
    res.render('book-detail', { book });
  });
});


//Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


