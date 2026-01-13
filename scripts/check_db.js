#!/usr/bin/env node
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db', 'my-project-db.sqlite3.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('ERROR: Unable to open DB at', dbPath, err.message);
    process.exit(2);
  }
});

function checkCount(table, cb) {
  db.get(`SELECT COUNT(*) AS count FROM ${table}`, (err, row) => {
    if (err) return cb(err);
    cb(null, row.count);
  });
}

async function runChecks() {
  try {
    const tables = ['authors', 'genres', 'books', 'users'];
    const results = {};
    for (const t of tables) {
      // eslint-disable-next-line no-await-in-loop
      results[t] = await new Promise((res, rej) => checkCount(t, (e, c) => e ? rej(e) : res(c)));
    }

    const adminExists = await new Promise((res, rej) => {
      db.get("SELECT COUNT(*) AS c FROM users WHERE username = ?", ['admin'], (e, r) => e ? rej(e) : res(r.c > 0));
    });

    const out = { dbPath, counts: results, adminExists };
    console.log(JSON.stringify(out, null, 2));
    db.close();
    // exit code 0 when basic expectations met
    const ok = results.authors >= 5 && results.genres >= 5 && results.books >= 9 && results.users >= 1 && adminExists;
    process.exit(ok ? 0 : 3);
  } catch (err) {
    console.error('ERROR during checks:', err.message || err);
    db.close();
    process.exit(4);
  }
}

runChecks();
