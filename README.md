Loom Library

Loom Library is a small library web application built with Node.js, Express, Handlebars and SQLite. The project was created for a web development course and focuses on basic CRUD functionality, authentication, and a simple responsive layout.


Run locally:

1. npm install
2. npm start

Open http://localhost:4321

---

## Admin Login

- Username: `admin`
- Password: `wdf#2025`

---

## Main file and routes

- The project is started from `server.js` using `npm start`.
- The file `app.js` is no longer used and can be ignored.

Main routes:
- Book list: `/books` (with pagination)
- Book details: `/books/:id`
- Login / logout: `/auth/login`, `/auth/logout`
- Admin area: `/admin/*` (requires login)

---

## Database and seeding

The SQLite database file is at `db/my-project-db.sqlite3.db`.

To reset the database (development only):

# backup current DB
cp db/my-project-db.sqlite3.db db/my-project-db.sqlite3.db.bak

# remove old DB
rm db/my-project-db.sqlite3.db

# restart server to recreate DB and run seeds
npm start


---

## Features checklist 

- Built with Node.js, Express, Handlebars and SQLite
- Navigation includes: Home, Books, About and Contact
- Database tables: `books`, `authors`, `genres` and `users`
- Books are connected to authors and genres using joins
- Book list includes pagination (3 items per page)
- Admin interface supports creating, editing and deleting books, genres and users
- Session-based login with hashed passwords (bcryptjs)
- Responsive layout built with CSS Grid and media queries

---

## Troubleshooting test

- Server won’t start → check terminal for errors
- 404 on a route → check confirm URL and that server.js is running

---

## DB check script

node scripts/check_db.js

