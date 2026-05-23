import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_FILE = path.resolve('./database/db.sqlite');
const db = new Database(DB_FILE);

const data: any = {};
const tables = ['users', 'fiscais', 'contracts', 'settings'];

for (const table of tables) {
  try {
    data[table] = db.prepare(`SELECT * FROM ${table}`).all();
  } catch (e) {
    console.error(`Table ${table} failed:`, e);
  }
}

fs.writeFileSync('./scratch/db_dump.json', JSON.stringify(data, null, 2));
console.log("Dumped db.sqlite to scratch/db_dump.json");
db.close();
