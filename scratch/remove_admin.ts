import Database from 'better-sqlite3';
import path from 'path';

const DB_FILE = path.resolve('./database/db.sqlite');
const db = new Database(DB_FILE);

try {
  console.log("Removing 'admin' user from users table...");
  const result = db.prepare("DELETE FROM users WHERE username = 'admin'").run();
  console.log(`Rows deleted: ${result.changes}`);

  console.log("Checkpointing SQLite WAL...");
  db.pragma('wal_checkpoint(TRUNCATE)');

  console.log("Active users in the database:");
  const users = db.prepare("SELECT username, name, role FROM users").all();
  console.log(users);
} catch (err) {
  console.error("Failed to remove admin user:", err);
} finally {
  db.close();
}
