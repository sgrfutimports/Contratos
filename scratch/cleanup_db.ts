import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_FILE = path.resolve('./database/db.sqlite');
const db = new Database(DB_FILE);

try {
  console.log("=== DB CLEANUP SYSTEM START ===");

  // 1. Delete all contracts, documents, history, notifications, fiscais
  console.log("Cleaning up contracts, documents, history, notifications, and fiscais...");
  db.prepare("DELETE FROM contracts").run();
  db.prepare("DELETE FROM fiscais").run();
  db.prepare("DELETE FROM contract_documents").run();
  db.prepare("DELETE FROM contract_history").run();
  db.prepare("DELETE FROM notifications").run();
  
  // 2. Clean up users except admin role
  console.log("Cleaning up users (excluding admins)...");
  db.prepare("DELETE FROM users WHERE role != 'admin'").run();

  // 3. Ensure the default 'admin' user exists
  const adminExists = db.prepare("SELECT COUNT(*) as count FROM users WHERE username = 'admin'").get() as { count: number };
  if (adminExists.count === 0) {
    console.log("Inserting default admin user (admin / admin123)...");
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (id, username, name, role, password, active, cpf) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      'user_admin', 'admin', 'Administrador Geral', 'admin', hash, 1, '000.000.000-00'
    );
  }

  // 4. Ensure 'gaudencio' admin user exists (re-inserted or kept)
  const gaudencioExists = db.prepare("SELECT COUNT(*) as count FROM users WHERE username = 'gaudencio'").get() as { count: number };
  if (gaudencioExists.count === 0) {
    console.log("Inserting gaudencio admin user...");
    db.prepare('INSERT INTO users (id, username, name, role, password, active, cpf, precCp, email, phone, identity, warName, rank) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(
        'user_admin_gaudencio', 'gaudencio', 'SIDICLEI GAUDENCIO RICARDO', 'admin',
        '$2b$10$87nvbVLldCrPAdQzNrIiiu4gFBEYHutN2QTlLTZeMX/cIgrMpeC76', 1, '04649321492', '125054549',
        'sidiclei.gaudencio@eb.mil.br', '(87) 99940-2628', '040014985-2', 'GAUDENCIO', '1º Sargento'
      );
  }

  // 5. Clean up logs, leaving only a single startup log
  console.log("Cleaning up logs...");
  db.prepare("DELETE FROM logs").run();
  
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  db.prepare('INSERT INTO logs (id, date, user, role, action, detail) VALUES (?, ?, ?, ?, ?, ?)')
    .run(`log_cleanup_${Date.now()}`, timestamp, 'Sistema', 'admin', 'LIMPEZA_PRODUCAO', 'Banco de dados limpo para produção. Apenas administradores cadastrados.');

  // 6. Checkpoint SQLite WAL
  console.log("Checkpointing SQLite WAL...");
  db.pragma('wal_checkpoint(TRUNCATE)');

  console.log("\n=== DATABASE CLEANED SUCCESSFULLY ===");
  console.log("Active users in the database:");
  const users = db.prepare("SELECT username, name, role FROM users").all();
  console.log(users);
  
} catch (err) {
  console.error("Cleanup failed:", err);
} finally {
  db.close();
}
