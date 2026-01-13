/*
Amino Mohamed Farah - moam24cs@student.ju.se

Target grade: 5

Project: Loom Library - Web Dev Fun 2025

Administrator login: admin
Administrator password: "wdf#2025" ---> "$2b$10$T4Fw6L4dG9QWpPblGjTcgOIqnTBXcBGjKWTujo4mOWFeTF37jqCdm"
*/

/* Some code in this project is adapted from lectures and labs conducted by teacher Jerome Landre*/
/* Some codes in the project where generated with the help of ChatGPT */

const express = require('express');
const path = require('path');
const { engine }=require ('express-handlebars') // load the handlebars package for express
const sqlite3=require('sqlite3');
const session = require('express-session');
const bcrypt= require('bcryptjs');

const app = express();
const PORT = 4321;

//Body parsers 
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 } // 1 hour
}));

//Database setup
const db = new sqlite3.Database(path.join(__dirname, 'db', 'my-project-db.sqlite3.db'), (err) => {
 if (err) {
  console.error('Error opening database:', err.message);
} else {
  console.log('Connected to the SQLite database.');
}
});

//Add local db
app.locals.db = db;

//current user to views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// flash messages middleware (simple session-based flash)
app.use((req, res, next) => {
  if (req.session && req.session.flash) {
    res.locals.flash = req.session.flash;
    delete req.session.flash;
  } else {
    res.locals.flash = null;
  }
  next();
});

//Routes
const authRoutes = require('./routes/auth')(db);
app.use('/auth', authRoutes);


// Admin routes (user management)
const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);



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

  // Insert authors 
  db.get("SELECT COUNT(*) as count FROM authors", (err, row) => {
    if (row.count === 0) {
      db.run(`INSERT INTO authors (name,bio) VALUES
        ('J.K. Rowling', 'Author of the Harry Potter series'),
        ('Sally Rooney', 'Author of Normal People and Conversations with Friends'),
        ('Jane Austen', 'Author of Sense and Sensibility'),
        ('George Orwell', 'Author of 1984 and Animal Farm'),
        ('Isabel Allende', 'Chilean novelist, author of The House of the Spirits')
      `);
    }
  });

  // Insert genres 
  db.get("SELECT COUNT(*) as count FROM genres", (err, row) => {
    if (row.count === 0) {
      db.run(`INSERT INTO genres (name) VALUES
        ('Fantasy'),
        ('Psychological'),
        ('Romance'),
        ('Historical'),
        ('Science Fiction')
      `);
    }
  });

  // Insert books 
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

// Users table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT
  )
`);

// insert admin if missing 
db.get("SELECT COUNT(*) AS count FROM users WHERE username = ?", ['admin'], (err, row) => {
  if (err) { console.error('User check error', err); return; }
  if (!row || row.count === 0) {
    const adminPass = 'wdf#2025';
    const hash = bcrypt.hashSync(adminPass, 10);
    db.run("INSERT INTO users (username,password_hash) VALUES (?, ?)", ['admin', hash]);
    console.log('Inserted admin user (username: admin)');
  }
});


// Setup Handlebars 
app.engine('handlebars', engine({
  helpers: {
    increment: (value) => parseInt(value, 10) + 1,
    decrement: (value) => parseInt(value, 10) - 1,
    range: (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i),
   
    ifCond: function (v1, operator, v2, options) {
      switch (operator) {
        case '==': return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===': return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '<': return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '>': return (v1 > v2) ? options.fn(this) : options.inverse(this);
        default: return options.inverse(this);
      }
    },
    
    //simple equality
    ifEquals: function (a, b, options) {
      return String(a) === String(b) ? options.fn(this) : options.inverse(this);
    }
  }
}));


app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Homepage
app.get('/', (req, res) => {
  const db = req.app.locals.db;
  if (!db) return res.status(500).send('Database not initialized');

  //Fetch 3 books 
  const sql = `
    SELECT books.id, books.title, books.description, authors.name AS author, genres.name AS genre
    FROM books
    LEFT JOIN authors ON books.author_id = authors.id
    LEFT JOIN genres ON books.genre_id = genres.id
    ORDER BY books.id DESC
    LIMIT 3
  `;
  db.all(sql, [], (err, featured) => {
    if (err) {
      console.error('Error fetching featured books:', err);
      return res.status(500).send('Database error');
    }
    res.render('home', {
      title: 'Home — Loom Library',
      active: 'home',
      year: new Date().getFullYear(),
      featured
    });
  });
});

//About page
app.get('/about', (req, res) => {
  res.render('about', {
    title: 'About — Loom Library',
    active: 'about',
    year: new Date().getFullYear()
  });
});

// Contact page
app.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contact — Loom Library',
    active: 'contact',
    year: new Date().getFullYear()
  });
});

// Books with pagination
app.get('/books', (req, res) => {
  const limit = 3;
  const rawPage = parseInt(req.query.page, 10) || 1;
  const search = (req.query.search || '').trim();
  const selectedGenre = req.query.genre || '';

  //Base WHERE
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
  const countSql= `SELECT COUNT(*) AS count FROM (${baseSql})`;
  
  db.get(countSql, params, (countErr, countRow) => {
    if (countErr) {
      console.error('Count error:', countErr);
      return res.status(500).send('Database error');
  }

    const totalCount = countRow ? countRow.count : 0;
    const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 0;

//Still send genres 
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
const dataSql = `${baseSql} LIMIT ? OFFSET ?`;
dataParams.push(limit,offset);

db.all(dataSql,dataParams, (dataErr, books) =>{
  if (dataErr) {
    console.error('Data fetch error:', dataErr);
    return res.status(500).send('Database error');

  }

//Fetch genres
db.all('SELECT * FROM genres ORDER BY name COLLATE NOCASE', [],(gErr, genres) => {
if(gErr) {
  console.error('Genres fetch error:', gErr);
  return res.status(500).send('Database error');
}

//Build URLs query params
const makeUrl = (p) => {
  const parts = [`page=${p}`];
  if (search) parts.push(`search=${encodeURIComponent(search)}`);
  if(selectedGenre) parts.push(`genre=${encodeURIComponent(selectedGenre)}`);
  return `/books?${parts.join('&')}`;
};

//Array for template
const pages = Array.from({ length: totalPages }, (_, i) => {
const num = i + 1;
return { num, url: makeUrl(num), active: num === page };
});

const prevPage = page > 1 ? { num: page - 1, url: makeUrl(page - 1) } : null;
const nextPage = page < totalPages ? { num: page + 1, url: makeUrl(page + 1) } : null;

return res.render('books', {
  books,
  page,
  totalPages,
  pages,
  prevPage,
  nextPage,
  search,
  selectedGenre,
  genres  
   });
  });
});
});
});

// Book details
app.get('/books/:id', (req, res) => {
  const bookId = parseInt(req.params.id, 10);
  if(Number.isNaN(bookId)) {
    return res.status(400).send('Invalid book id');
  }

  const sql = `
   SELECT books.id, books.title, books.description, authors.name AS author, genres.name AS genre
    FROM books
    LEFT JOIN authors ON books.author_id = authors.id
    LEFT JOIN genres ON books.genre_id = genres.id
    WHERE books.id = ?
  `;

  db.get(sql, [bookId], (err, book) => {
    if (err) {
      console.error('Error fetching book by id:', err);
      return res.status(500).send('Database error');
    }
    
//If not found, return a 404 page
if (!book) {
  //If there is a 404 template, render it
  return res.status(404).send('Book not found');
}
//Render book details
return res.render('book-detail', { book });
});
});


//Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Reference: Lectures from week 3,4,5,6