import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_FILE = path.resolve('./database/db.sqlite');
const BACKUPS_DIR = path.resolve('./backups');

console.log("Analyzing main database...");
analyzeDb(DB_FILE);

const backups = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.sqlite'));
for (const b of backups) {
  const bPath = path.join(BACKUPS_DIR, b);
  console.log(`\nAnalyzing backup: ${b}...`);
  analyzeDb(bPath);
}

function analyzeDb(dbPath: string) {
  try {
    const db = new Database(dbPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
    console.log("Tables:", tables.map(t => t.name).join(", "));
    for (const t of tables) {
      if (t.name === 'sqlite_sequence') continue;
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${t.name}`).get() as any;
      console.log(`- ${t.name}: ${count.count} rows`);
      if (count.count > 0) {
        const rows = db.prepare(`SELECT * FROM ${t.name} LIMIT 3`).all();
        console.log(`  Sample rows from ${t.name}:`, JSON.stringify(rows, null, 2));
      }
    }
    db.close();
  } catch (err) {
    console.error(`Error reading ${dbPath}:`, err);
  }
}
