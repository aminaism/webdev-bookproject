Loom Library

Small, handcrafted library app built with Node, Express, Handlebars and SQLite.

Run locally:

1. npm install
2. npm start

Open http://localhost:4321

Seeded admin: admin / wdf#2025

Key routes: /books, /books/:id, /auth/login, /admin/

That's it — focused on a simple, responsive UI and basic CRUD for grading.
# Loom Library — Web Dev Project

This repository is a small library web app built with Node.js, Express, Handlebars and SQLite3.

This README explains how to run the project, where to find the important files, and the seeded credentials used for grading.

---

## Quick start (development)

1. Install dependencies

```bash
npm install
```

2. Start the server (default entrypoint)

```bash
npm start
```

The app listens on http://localhost:4321 by default.

3. (Optional) Start in dev mode with auto-reload

```bash
npm run dev
```

---

## Seeded admin account

- Username: `admin`
- Password: `wdf#2025`

The server seeds this user on first run. If you reset the DB (see below) seeding will re-run.

---

## Canonical entrypoint

- The canonical entrypoint for the app is `server.js` (CommonJS). Use `npm start`.
- An older ESM file `app.js` existed; it has been deprecated in this repo. Use `server.js` for grading and development.

Routes of interest:
- Public list: `/books` (list with pagination)
- Book detail: `/books/:id`
- Auth: `/auth/login`, `/auth/logout`
- Admin: `/admin/*` (user management, genres, books) — requires login

---

## Database and seeding

The SQLite database file is at `db/my-project-db.sqlite3.db`.

If you want to reset the DB to re-run seeds (development only):

```bash
# (optional) back up current DB
cp db/my-project-db.sqlite3.db db/my-project-db.sqlite3.db.bak

# remove DB file
rm db/my-project-db.sqlite3.db

# restart server to recreate DB and run seeds
npm start
```

Alternatively, you can insert records manually with the `sqlite3` CLI if you want to preserve other data.

---

## Grading checklist (helpful notes)

- Node, Express, Handlebars and SQLite3: implemented.
- Menu contains: Home, Books (List), About, Contact.
- Database tables: `books`, `authors`, `genres`, `users`. `books` joins with `authors` and `genres`.
- Pagination: `/books` uses dynamic pagination (3 items per page).
- CRUD: Admin pages implement create/read/update/delete for users, genres and books.
- Auth: session-based login with hashed passwords (bcryptjs). Default admin is seeded.
- UI: responsive CSS using Grid and media queries.

---

## Common troubleshooting

- If the server doesn't start, check the terminal logs for syntax errors.
- If a route returns 404, confirm you're using the canonical URL path and that the server was started with `server.js`.

---

## Notes for reviewers

- `server.js` is the main file to run. `app.js` is deprecated and should be ignored for grading.
- I replaced one ESM `routes/books.js` with a deprecation stub to avoid module-system conflicts; all active routes are served from `server.js` and `routes/*`.

---

## Health check / DB check script

I added a small Node script at `scripts/check_db.js` that inspects the SQLite DB and prints counts for key tables and whether the `admin` user exists. The script exits with code 0 when the basic grading expectations are met (>=5 authors, >=5 genres, >=9 books, >=1 user and admin exists).

Run:

```bash
node scripts/check_db.js
```

If the script returns a non-zero exit code, the output will include an error message to help debug.

If you want, I can:
- Add a short developer guide for editing and re-seeding the DB,
- Or continue with the remaining small fixes (safe file deletion, UX hint, standardizing any remaining redirects).

## Capturing visual screenshots (optional)

I added a small script `scripts/screenshot.js` that uses Puppeteer to capture the homepage at three viewports (desktop/tablet/phone) and saves the images to `./screenshots/`.

Run the script locally like this:

```bash
# install puppeteer (this downloads a headless Chromium binary)
npm install puppeteer

# ensure your server is running on http://localhost:4321
node scripts/screenshot.js
```

The script will create `screenshots/home-desktop.png`, `home-tablet.png`, and `home-phone.png`.

If you prefer to use a different URL (for example a deployed preview), set the `APP_URL` env var before running:

```bash
APP_URL="https://my-preview.example" node scripts/screenshot.js
```

If you can't install Puppeteer, you can also use Chrome's headless mode directly (macOS example):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --screenshot=desktop.png --window-size=1200,900 http://localhost:4321/
```


