//init.js
import { openDb } from "./database.js";

async function setup() {
    const db = await openDb();

//Authors Table 
await db.exec(`
    CREATE TABLE IF NOT EXISTS authors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      bio TEXT
    );
  `);

//Genres Table
   await db.exec(`
    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    );
  `);

//Books Table 
    await db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      author_id INTEGER,
      genre_id INTEGER,
      FOREIGN KEY (author_id) REFERENCES authors(id),
      FOREIGN KEY (genre_id) REFERENCES genres(id)
    );
  `);

//Sample authors
await db.exec (`
  INSERT INTO authors (name,bio) VALUES
  ('J.K. Rowling', 'Author of Harry Potter series'),
  ('Sally Rooney', 'Author of Intermezzo'),
  ('Jane Austen', 'Author of Sense and Sensibility');
`);

//Sample genres
await db.exec (`
  INSERT INTO genres (name) VALUES
  ('Fantasy')
  ('Psychological')
  ('Romance')
`);

//Sample books
await db.exec (`
  INSERT INTO books (title, description, author_id, genre_id) VALUES
  ('Harry Potter and the Sorcerer''s Stone', 'First book in the Harry Potter series', 1, 1),
  ('Harry Potter and the Chamber of Secrets', 'Second book in the series', 1, 1),
  ('Harry Potter and the Prisoner of Azkaban', 'Third book in the series', 1, 1),
  ('Normal People', 'A psychological exploration of young love', 2, 2),
  ('Conversations with Friends', 'A story about friendship and self-discovery', 2, 2),
  ('Intermezzo', 'Another psychological novel by Sally Rooney', 2, 2),
  ('Sense and Sensibility', 'Classic romance novel', 3, 3),
  ('Pride and Prejudice', 'Classic romantic story', 3, 3),
  ('Emma', 'Romantic novel by Jane Austen', 3, 3),
  ('Mansfield Park', 'Another romantic classic', 3, 3);
`);

console.log("Library database tables created successfully.");
}

setup(); 
