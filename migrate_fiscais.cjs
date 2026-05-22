const Database = require('better-sqlite3');
const db = new Database('database/db.sqlite');

try {
  db.prepare(`ALTER TABLE fiscais ADD COLUMN warName TEXT`).run();
  console.log(`Added warName to fiscais`);
} catch (err) {
  console.log(`Column warName already exists or error:`, err.message);
}

db.close();
