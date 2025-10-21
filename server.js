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
  const limit = 3;
  const rawPage = parseInt(req.query.page, 10) || 1;
  const search = (req.query.search || '').trim();
  const selectedGenre = req.query.genre || '';

  // Build the base WHERE
  let where = 'WHERE (books.title LIKE ? OR authors.name LIKE ?)';
  const params = [`%${search}%`, `%${search}%`];

  if (selectedGenre) {
    where += ' AND genres.id = ?';
    params.push(selectedGenre);
  }

  //Base SQL 
  const baseSql= `
    SELECT books.id, books.title, books.description, authors.name AS author, genres.name AS genre
    FROM books
    LEFT JOIN authors ON books.author_id = authors.id
    LEFT JOIN genres ON books.genre_id = genres.id
    ${where}
    ORDER BY books.title COLLATE NOCASE
  `;

  //Total count rows
  const countSql= `SELECT COUNT(*)AS count FROM (${baseSql})`;
  db.get(countSql, params, (countErr, countRow) => {
    if (countErr) {
      console.error('Count error:', countErr);
      return res.status(500).send('Database error');
    }

    const totalCount = countRow ? countRow.count : 0;
    const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 0;

//If no rows, still send genres 
if (totalCount === 0) {
  return db.all('SELECT * FROM genres ORDER BY name COLLATE NOCASE', [], (gErr, genres) => {
  if (gErr) {
    console.error('Genres fetch error:', gErr);
    return res.status(500).send('Database error');
}
return res.render('books', {
    books: [],
    page: 1,
    totalPages: 0,
    pages: [],
    prevPage: null,
    nextPage: null,
    search,
    selectedGenre,
    genres
  });
});
}

//Clamp page in valid range
const page = Math.max(1,Math.min(rawPage, totalPages));
const offset = (page - 1) * limit;

// Prepare data SQL
const dataParams = params.slice();
const dataSql = `${baseSql} LIMIT? OFFSET? `;
dataParams.push(limit,offset);

db.all(dataSql,dataParams, (dataErr, books) =>{
  if (dataErr) {
    console.error('Data fetch error:', dataErr);
    return res.status(500).send('Database error');

  }

//Fetch genres
db.all('SELECT * FROM genres ORDER BY name COLLATE NOCASE', [],(gErr, genres) => {
if(gErr) {
  console.error('Genres fetch error:',gErr);
  return res.status(500).send('Database error');
}





}
 )






}

)







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
