const Database = require('better-sqlite3');
const db = new Database('database/db.sqlite');

const rows = db.prepare('SELECT contractId FROM contract_history WHERE action = ?').all('Importação');
const ids = rows.map(r => r.contractId);

if (ids.length > 0) {
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM contract_history WHERE contractId IN (${placeholders})`).run(...ids);
  db.prepare(`DELETE FROM contracts WHERE id IN (${placeholders})`).run(...ids);
  console.log(`Deleted ${ids.length} imported contracts.`);
} else {
  console.log('No imported contracts found.');
}

db.close();
