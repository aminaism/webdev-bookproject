import express from "express";
const router = express.Router();

router.get("/", (req,res) => {
   const db = req.app.locals.db; //SQlite db
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


export default router;