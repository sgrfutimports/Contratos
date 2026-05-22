const Database = require('better-sqlite3');
const db = new Database('database/db.sqlite');

['warName', 'rank'].forEach(col => {
  try {
    db.prepare(`ALTER TABLE users ADD COLUMN ${col} TEXT`).run();
    console.log(`Added ${col}`);
  } catch (err) {
    console.log(`Column ${col} already exists or error:`, err.message);
  }
});

db.close();
