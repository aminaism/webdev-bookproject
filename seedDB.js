import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcryptjs";

async function seedDb() {
  const db = await open({
    filename: "./my-project-db.sqlite3.db", // your DB file
    driver: sqlite3.Database,
  });

  console.log("Seeding database...");

  // --- Create tables ---
  await db.exec(`
    CREATE TABLE IF NOT EXISTS authors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      genre_id INTEGER NOT NULL,
      description TEXT,
      image TEXT,
      FOREIGN KEY(author_id) REFERENCES authors(id),
      FOREIGN KEY(genre_id) REFERENCES genres(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
  `);

  // --- Insert authors ---
  await db.exec(`
    DELETE FROM authors;
    INSERT INTO authors (name) VALUES 
      ('Author 1'), ('Author 2'), ('Author 3'), ('Author 4'), ('Author 5');
  `);

  // --- Insert genres ---
  await db.exec(`
    DELETE FROM genres;
    INSERT INTO genres (name) VALUES 
      ('Fiction'), ('Non-fiction'), ('Sci-Fi'), ('Romance'), ('Mystery');
  `);

  // --- Insert books ---
  await db.exec(`
    DELETE FROM books;
    INSERT INTO books (title, author_id, genre_id, description) VALUES
      ('Book 1', 1, 1, 'Description 1'),
      ('Book 2', 2, 2, 'Description 2'),
      ('Book 3', 3, 3, 'Description 3'),
      ('Book 4', 4, 4, 'Description 4'),
      ('Book 5', 5, 5, 'Description 5'),
      ('Book 6', 1, 2, 'Description 6'),
      ('Book 7', 2, 3, 'Description 7'),
      ('Book 8', 3, 4, 'Description 8'),
      ('Book 9', 4, 5, 'Description 9');
  `);

  // --- Insert admin user ---
  const hash = await bcrypt.hash("wdf#2025", 10);
  await db.exec(`
    DELETE FROM users;
    INSERT INTO users (username, password_hash) VALUES ('admin', '${hash}');
  `);

  console.log("Database seeded successfully!");
  await db.close();
}

seedDb();
