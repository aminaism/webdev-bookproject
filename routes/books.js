import express from "express";
const router = express.Router();


//Require login to see books
function requireLogin(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/auth/login');
}

// To all routes
router.use(requireLogin);

router.get("/", (req,res) => {
   const db = req.app.locals.db; //SQlite db
   if (!db) {
    return res.status(500).send('Database not initialized');
   }
   const page = parseInt (req.query.page) || 1;
   const limit = 3;
   const offset = (page - 1) * limit;

   const search = req.query.search || '';
   const selectedGenre = req.query.genre || '';

   let sql = `
        SELECT books.id, books.title, books.description, authors.name AS author, genres.name AS genre
        FROM books
        LEFT JOIN authors ON books.author_id = authors.id
        LEFT JOIN genres ON books.genre_id = genres.id
        WHERE (books.title LIKE ? OR authors.name LIKE ?)
    `;

    const params = [`%${search}%`, `%${search}%`];
    if (selectedGenre) {
        sql += ` AND genres.id = ?`;
        params.push(selectedGenre);
    }

    const countSql = `SELECT COUNT (*) AS count FROM (${sql})`;

    db.get(countSql, params, (err, row) => {
        if (err) return res.status(500).send(err.message);
        const totalPages = Math.ceil(row.count / limit);

        sql += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        db.all(sql, params, (err, books) => {
            if (err) return res.status(500).send(err.message);

            db.all(`SELECT * FROM genres`, [], (err, genres) => {
                if (err) return res.status(500).send(err.message);

                res.render('books', {
                    books,
                    page,
                    totalPages,
                    search,
                    selectedGenre,
                    genres
                });
            });
        });
    });
});

// Book detail page
router.get("/:id", requireLogin, (req, res) => {
  const db = req.app.locals.db;
  db.get(`
    SELECT books.*, authors.name AS author, genres.name AS genre
    FROM books
    LEFT JOIN authors ON books.author_id = authors.id
    LEFT JOIN genres ON books.genre_id = genres.id
    WHERE books.id = ?
  `, [req.params.id], (err, book) => {
    if (err || !book) return res.status(404).send('Not found');
    res.render('book-detail', { title: book.title, book });
  });
});



export default router;