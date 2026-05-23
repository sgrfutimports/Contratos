import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_FILE = path.resolve('./database/db.sqlite');
const BACKUPS_DIR = path.resolve('./backups');

async function runTests() {
  console.log("=== STARTING BACKEND API VERIFICATION ===");

  // 1. Generate a backup
  console.log("\n1. Testing backup generation...");
  const genResponse = await fetch('http://localhost:5000/api/backups/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!genResponse.ok) {
    throw new Error(`Failed to generate backup: ${genResponse.status} ${await genResponse.text()}`);
  }
  
  const genResult = await genResponse.json() as any;
  console.log("Backup generation response:", genResult);

  // Find the latest backup file in backups/
  const files = fs.readdirSync(BACKUPS_DIR)
    .filter(f => f.endsWith('.sqlite'))
    .map(f => ({ name: f, time: fs.statSync(path.join(BACKUPS_DIR, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    throw new Error("No backup files found in backups/ directory.");
  }

  const latestBackup = files[0].name;
  const backupSize = fs.statSync(path.join(BACKUPS_DIR, latestBackup)).size;
  console.log(`Latest backup file: ${latestBackup} (${backupSize} bytes)`);

  // Verify tables in the latest backup
  const backupDb = new Database(path.join(BACKUPS_DIR, latestBackup));
  const tables = backupDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
  backupDb.close();
  console.log("Tables in the generated backup:", tables.map(t => t.name).join(", "));
  if (tables.length === 0) {
    throw new Error("Generated backup database has NO tables (WAL checkpoint failed)!");
  }
  console.log("WAL checkpoint verification passed: Backup contains database tables!");

  // Get current contract count before reset
  const dbBefore = new Database(DB_FILE);
  const contractsBefore = dbBefore.prepare("SELECT COUNT(*) as count FROM contracts").get() as any;
  dbBefore.close();
  console.log(`Contracts count before reset: ${contractsBefore.count}`);

  // 2. Reset the database
  console.log("\n2. Testing database reset...");
  const resetResponse = await fetch('http://localhost:5000/api/admin/reset-database', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auditorUser: 'admin', auditorRole: 'admin' })
  });

  if (!resetResponse.ok) {
    throw new Error(`Failed to reset database: ${resetResponse.status} ${await resetResponse.text()}`);
  }

  const resetResult = await resetResponse.json() as any;
  console.log("Database reset response:", resetResult);

  // Check state after reset
  const dbAfterReset = new Database(DB_FILE);
  const contractsAfterReset = dbAfterReset.prepare("SELECT COUNT(*) as count FROM contracts").get() as any;
  dbAfterReset.close();
  console.log(`Contracts count after reset: ${contractsAfterReset.count}`);
  if (contractsAfterReset.count !== 5) {
    throw new Error(`Seeding failed: Expected 5 contracts in the initial seed state, but found ${contractsAfterReset.count}`);
  }
  console.log("Database reset verification passed: Seeding successfully restablished the 5 initial contracts!");

  // 3. Restore the backup
  console.log("\n3. Testing backup restore...");
  const restoreResponse = await fetch('http://localhost:5000/api/backups/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: latestBackup, auditorUser: 'admin', auditorRole: 'admin' })
  });

  if (!restoreResponse.ok) {
    throw new Error(`Failed to restore backup: ${restoreResponse.status} ${await restoreResponse.text()}`);
  }

  const restoreResult = await restoreResponse.json() as any;
  console.log("Database restore response:", restoreResult);

  // Check state after restore
  const dbAfterRestore = new Database(DB_FILE);
  const contractsAfterRestore = dbAfterRestore.prepare("SELECT COUNT(*) as count FROM contracts").get() as any;
  dbAfterRestore.close();
  console.log(`Contracts count after restore: ${contractsAfterRestore.count}`);
  if (contractsAfterRestore.count !== contractsBefore.count) {
    throw new Error(`Restore failed: Expected ${contractsBefore.count} contracts, but found ${contractsAfterRestore.count}`);
  }
  console.log("Database restore verification passed: Backup successfully restored!");

  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch(err => {
  console.error("\nVerification failed:", err);
  process.exit(1);
});
