import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const PORT = 5000;
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Disable caching for all API routes to ensure real-time synchronization
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.post('/api/error-log', (req, res) => {
  console.error('FRONTEND ERROR:', req.body);
  res.json({received: true});
});

const DB_DIR = path.resolve('./database');
const UPLOADS_DIR = path.resolve('./uploads');
const BACKUPS_DIR = path.resolve('./backups');
const LOGS_DIR = path.resolve('./logs');
const DB_FILE = path.join(DB_DIR, 'db.sqlite');

[DB_DIR, UPLOADS_DIR, BACKUPS_DIR, LOGS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

let db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

function createSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      name TEXT,
      role TEXT,
      password TEXT,
      active INTEGER,
      cpf TEXT,
      precCp TEXT,
      email TEXT,
      phone TEXT,
      identity TEXT,
      warName TEXT,
      rank TEXT
    );

    CREATE TABLE IF NOT EXISTS fiscais (
      id TEXT PRIMARY KEY,
      name TEXT,
      postoGraduacao TEXT,
      cpf TEXT,
      email TEXT,
      phone TEXT,
      role TEXT,
      status TEXT,
      warName TEXT
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      number TEXT,
      object TEXT,
      contractorName TEXT,
      cnpj TEXT,
      value REAL,
      startDate TEXT,
      endDate TEXT,
      termMonths INTEGER,
      status TEXT,
      fiscalTitularId TEXT,
      fiscalSubstitutoId TEXT,
      observations TEXT
    );

    CREATE TABLE IF NOT EXISTS contract_documents (
      id TEXT PRIMARY KEY,
      contractId TEXT,
      name TEXT,
      filename TEXT,
      uploadDate TEXT,
      size TEXT,
      FOREIGN KEY(contractId) REFERENCES contracts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contract_history (
      id TEXT PRIMARY KEY,
      contractId TEXT,
      date TEXT,
      user TEXT,
      action TEXT,
      detail TEXT,
      FOREIGN KEY(contractId) REFERENCES contracts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT,
      message TEXT,
      date TEXT,
      contractId TEXT,
      isRead INTEGER
    );

    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      date TEXT,
      user TEXT,
      role TEXT,
      action TEXT,
      detail TEXT
    );
  `);
}

function addLog(user: string, role: string, action: string, detail: string) {
  const stmt = db.prepare('INSERT INTO logs (id, date, user, role, action, detail) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(`log_${Date.now()}_${Math.floor(Math.random()*1000)}`, new Date().toISOString().replace('T', ' ').substring(0, 19), user, role, action, detail);
}

function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    // 1. Seed default admin user
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (id, username, name, role, password, active, cpf) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      'user_admin', 'admin', 'Administrador Geral', 'admin', hash, 1, '000.000.000-00'
    );

    // 2. Seed gaudencio admin user
    db.prepare('INSERT INTO users (id, username, name, role, password, active, cpf, precCp, email, phone, identity, warName, rank) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(
        'user_admin_gaudencio', 'gaudencio', 'SIDICLEI GAUDENCIO RICARDO', 'admin',
        '$2b$10$87nvbVLldCrPAdQzNrIiiu4gFBEYHutN2QTlLTZeMX/cIgrMpeC76', 1, '04649321492', '125054549',
        'sidiclei.gaudencio@eb.mil.br', '(87) 99940-2628', '040014985-2', 'GAUDENCIO', '1º Sargento'
      );

    // 3. Seed fiscais
    const fiscaisData = [
      {
        id: 'f_1779465840692',
        name: 'SIDICLEI GAUDENCIO RICARDO',
        postoGraduacao: '1º Sgt',
        cpf: '046.493.214-92',
        email: 'sidiclei.gaudencio@eb.mil.br',
        phone: '(87) 99940-2628',
        role: 'titular',
        status: 'ativo',
        warName: 'gaudencio',
        username: 'gaudencio1',
        passwordHash: '$2b$10$i12eP/Hj9dfIHrUhp4fO5eMv6nDhjXPe0uSb5GaTZ4YcQFM5D7Wl6'
      },
      {
        id: 'f_1779466076522',
        name: 'JOÃO VITOR DE ARAUJO RICARDO',
        postoGraduacao: '3º Sgt',
        cpf: '130.552.294-01',
        email: 'joaovitor@eb.mil.br',
        phone: '(87) 99933-4728',
        role: 'substituto',
        status: 'ativo',
        warName: 'JOÃO VITOR',
        username: 'joão vitor',
        passwordHash: '$2b$10$1IsPFBIreQDwkHFCLpU1uuGkoUMDk9OedKOnuLgI.LCKOsOY5zdS2'
      }
    ];

    for (const f of fiscaisData) {
      db.prepare('INSERT INTO fiscais (id, name, postoGraduacao, cpf, email, phone, role, status, warName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(f.id, f.name, f.postoGraduacao, f.cpf, f.email, f.phone, f.role, f.status, f.warName);

      db.prepare('INSERT INTO users (id, username, name, role, password, active, cpf, email, phone, warName, rank) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(`user_${f.id}`, f.username, `${f.postoGraduacao} ${f.warName}`, 'fiscal', f.passwordHash, 1, f.cpf, f.email, f.phone, f.warName, f.postoGraduacao);
    }

    // 4. Seed contracts
    const contractsData = [
      {
        id: "c_1779465679543",
        number: "00002/2021",
        object: "SERVIÇOS DE TELEFONIA MÓVEL PESSOAL (SMP- SERVIÇO MÓVEL PESSOAL), INTERNET 4G/3G, LOCAL E LONGA DISTÂNCIA NACIONAL - LDN, NA MODALIDADE PLANO CORPORATIVO, HABILITADOS NO PLANO PÓS-PAGO, COM TARIFAS INTRA - GRUPO ZERO NACIONAL COM FORNECIMENTO DE SIM - CARDS, PARA ATENDER ÀS NECESSIDADES DA OPERAÇÃO CARRO-PIPA DO 71° BATALHÃO DE INFANTARIA MOTORIZADO",
        contractorName: "TELEFONICA BRASIL S.A",
        cnpj: "02.558.157/0001-62",
        value: 1098,
        startDate: "2021-05-19",
        endDate: "2026-05-28",
        termMonths: 12,
        status: "em_vencimento",
        fiscalTitularId: "f_1779465840692",
        fiscalSubstitutoId: "f_1779466076522",
        observations: ""
      },
      {
        id: "c_1779474285988",
        number: "00213/2023",
        object: "Prestação de serviço de Saúde Autônomo Conveniado - FUSEx\n",
        contractorName: "MARCIA CRISTINA FERREIRA SILVA",
        cnpj: "058.710.614-00",
        value: 40000,
        startDate: "2023-03-01",
        endDate: "2026-12-31",
        termMonths: 12,
        status: "ativo",
        fiscalTitularId: "",
        fiscalSubstitutoId: "",
        observations: ""
      },
      {
        id: "c_1779474350212",
        number: "00003/2024",
        object: "Fornecimento de Energia Elétrica\n",
        contractorName: "COMPANHIA ENERGETICA DE PERNAMBUCO",
        cnpj: "10.835.932/0001-08",
        value: 600000,
        startDate: "2024-05-18",
        endDate: "2029-05-17",
        termMonths: 12,
        status: "ativo",
        fiscalTitularId: "",
        fiscalSubstitutoId: "",
        observations: ""
      },
      {
        id: "c_1779474447167",
        number: "00013/2025",
        object: "Prestação de Serviço",
        contractorName: "AUTO SUTURE DO BRASIL LTDA",
        cnpj: "01.645.409/0003-90",
        value: 71315,
        startDate: "2025-07-31",
        endDate: "2026-07-30",
        termMonths: 12,
        status: "ativo",
        fiscalTitularId: "",
        fiscalSubstitutoId: "",
        observations: ""
      },
      {
        id: "c_1779475563136",
        number: "00014/2025",
        object: "Fornecimento de Energia Elétrica\n",
        contractorName: "CEMIG GERACAO E TRANSMISSAO S",
        cnpj: "06.981.176/0001-58",
        value: 513285.18,
        startDate: "2026-01-01",
        endDate: "2030-12-31",
        termMonths: 12,
        status: "ativo",
        fiscalTitularId: "",
        fiscalSubstitutoId: "",
        observations: ""
      }
    ];

    for (const c of contractsData) {
      db.prepare('INSERT INTO contracts (id, number, object, contractorName, cnpj, value, startDate, endDate, termMonths, status, fiscalTitularId, fiscalSubstitutoId, observations) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(c.id, c.number, c.object, c.contractorName, c.cnpj, c.value, c.startDate, c.endDate, c.termMonths, c.status, c.fiscalTitularId, c.fiscalSubstitutoId, c.observations);

      db.prepare('INSERT INTO contract_history (id, contractId, date, user, action, detail) VALUES (?, ?, ?, ?, ?, ?)')
        .run(`h_seed_${Date.now()}_${Math.floor(Math.random()*1000)}`, c.id, new Date().toISOString().replace('T', ' ').substring(0, 19), 'Sistema', 'Cadastro', 'Contrato cadastrado administrativamente no acervo inicial de semeadura.');
    }

    addLog('Sistema', 'admin', 'INICIALIZACAO', 'Banco SQLite inicializado e acervo de semeadura restabelecido.');
  }
}

// Initialize on startup
createSchema();
seedDatabase();



// Ensure old API calls that look for JSON objects are satisfied
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

  if (user && bcrypt.compareSync(password, user.password)) {
    if (!user.active) {
      return res.status(403).json({ error: 'Usuário inativo.' });
    }
    const { password: _, ...userWithoutPassword } = user;
    addLog(user.name, user.role, 'LOGIN_SUCESSO', 'Acesso autorizado.');
    return res.json({ success: true, user: { ...userWithoutPassword, active: Boolean(userWithoutPassword.active) } });
  }

  addLog(username || 'Desconhecido', 'visitante', 'LOGIN_FALHA', 'Tentativa de acesso com credenciais inválidas.');
  return res.status(401).json({ error: 'Credenciais inválidas.' });
});

// Recover password locally (Administrative only)
app.post('/api/auth/recover', (req, res) => {
  const { username, cpf } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND cpf = ?').get(username, cpf) as any;
  if (!user) {
    return res.status(404).json({ error: 'Usuário e CPF não correspondem aos registros offline.' });
  }
  
  // Since we use bcrypt, we can't show the password. We will reset it to standard and return it.
  const tempPassword = user.role === 'admin' ? 'admin123' : 'fiscal123';
  const hash = bcrypt.hashSync(tempPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, user.id);
  
  addLog(user.name, user.role, 'RECUPERACAO_SENHA', 'Senha física redefinida com validação de CPF.');
  
  return res.json({ success: true, message: `Autenticação física confirmada. Sua senha de acesso foi temporariamente redefinida para: ${tempPassword}` });
});

function checkAndUpdateContractStatuses(specificContractId?: string) {
  try {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    const todayStr = localDate.toISOString().split('T')[0];

    let query = "SELECT * FROM contracts WHERE status IN ('ativo', 'em_vencimento', 'vencido')";
    let params: any[] = [];
    if (specificContractId) {
      query = "SELECT * FROM contracts WHERE id = ?";
      params = [specificContractId];
    }
    const contracts = db.prepare(query).all(...params) as any[];

    for (const contract of contracts) {
      if (contract.status === 'suspenso' || contract.status === 'encerrado') {
        db.prepare('UPDATE notifications SET isRead = 1 WHERE contractId = ?').run(contract.id);
        continue;
      }

      let targetStatus = 'ativo';
      let diffDays = 0;

      if (contract.endDate < todayStr) {
        targetStatus = 'vencido';
      } else {
        const eDate = new Date(contract.endDate + 'T00:00:00Z');
        const tDate = new Date(todayStr + 'T00:00:00Z');
        const diffTime = eDate.getTime() - tDate.getTime();
        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 30) {
          targetStatus = 'em_vencimento';
        }
      }

      if (contract.status !== targetStatus) {
        db.prepare('UPDATE contracts SET status = ? WHERE id = ?').run(targetStatus, contract.id);

        const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

        let action = '';
        let detail = '';
        if (targetStatus === 'vencido') {
          action = 'Vigência Expirada';
          detail = 'O contrato atingiu sua data limite e foi marcado automaticamente como Vencido.';
        } else if (targetStatus === 'em_vencimento') {
          action = 'Alerta de Prazo';
          detail = `Status alterado automaticamente para "Em Vencimento" devido à análise de cronograma (Vigência: ${diffDays} dias restantes).`;
        } else if (targetStatus === 'ativo') {
          action = 'Reativação';
          detail = 'O contrato retornou ao status Ativo devido à renovação ou alteração do prazo de vigência.';
        }

        db.prepare('INSERT INTO contract_history (id, contractId, date, user, action, detail) VALUES (?, ?, ?, ?, ?, ?)')
          .run(`h_auto_${Date.now()}_${Math.floor(Math.random()*1000)}`, contract.id, nowTimestamp, 'Sistema Automático', action, detail);

        const logStmt = db.prepare('INSERT INTO logs (id, date, user, role, action, detail) VALUES (?, ?, ?, ?, ?, ?)');
        logStmt.run(`log_auto_${Date.now()}_${Math.floor(Math.random()*1000)}`, nowTimestamp, 'Sistema', 'admin', 'ATUALIZACAO_STATUS', `Contrato ${contract.number} alterado de "${contract.status}" para "${targetStatus}".`);
      }

      // Handle notifications based on targetStatus (whether status changed or not)
      const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

      if (targetStatus === 'vencido') {
        // Mark yellow notifications as read
        db.prepare("UPDATE notifications SET isRead = 1 WHERE contractId = ? AND type = 'yellow'").run(contract.id);

        // Manage red notification
        const expectedMessage = `O contrato administrativo nº ${contract.number} venceu em ${contract.endDate.split('-').reverse().join('/')}! Providenciar encerramento ou aditivos imediatos.`;
        const exists = db.prepare("SELECT id, message FROM notifications WHERE contractId = ? AND type = 'red' AND isRead = 0").get(contract.id) as any;

        if (!exists) {
          db.prepare('INSERT INTO notifications (id, type, message, date, contractId, isRead) VALUES (?, ?, ?, ?, ?, 0)')
            .run(
              `notif_${Date.now()}_${Math.floor(Math.random()*1000)}`,
              'red',
              expectedMessage,
              nowTimestamp,
              contract.id
            );
        } else if (exists.message !== expectedMessage) {
          db.prepare('UPDATE notifications SET message = ?, date = ? WHERE id = ?').run(expectedMessage, nowTimestamp, exists.id);
        }
      } else if (targetStatus === 'em_vencimento') {
        // Mark red notifications as read
        db.prepare("UPDATE notifications SET isRead = 1 WHERE contractId = ? AND type = 'red'").run(contract.id);

        // Manage yellow notification
        const expectedMessage = `Aviso: Contrato nº ${contract.number} vence nos próximos 30 dias (Término em ${contract.endDate.split('-').reverse().join('/')}).`;
        const exists = db.prepare("SELECT id, message FROM notifications WHERE contractId = ? AND type = 'yellow' AND isRead = 0").get(contract.id) as any;

        if (!exists) {
          db.prepare('INSERT INTO notifications (id, type, message, date, contractId, isRead) VALUES (?, ?, ?, ?, ?, 0)')
            .run(
              `notif_${Date.now()}_${Math.floor(Math.random()*1000)}`,
              'yellow',
              expectedMessage,
              nowTimestamp,
              contract.id
            );
        } else if (exists.message !== expectedMessage) {
          db.prepare('UPDATE notifications SET message = ?, date = ? WHERE id = ?').run(expectedMessage, nowTimestamp, exists.id);
        }
      } else {
        // 'ativo' (or any other status) - mark all notifications as read
        db.prepare('UPDATE notifications SET isRead = 1 WHERE contractId = ?').run(contract.id);
      }
    }
  } catch (err) {
    console.error('Error checking contract statuses:', err);
  }
}

// GET Dashboard
app.get('/api/dashboard', (req, res) => {
  checkAndUpdateContractStatuses();
  const contracts = db.prepare('SELECT status, endDate FROM contracts').all() as any[];
  const logs = db.prepare('SELECT * FROM logs ORDER BY date DESC LIMIT 5').all();

  const rawAlerts = db.prepare(`
    SELECT n.*, c.number as contractNumber, c.endDate 
    FROM notifications n 
    JOIN contracts c ON n.contractId = c.id 
    WHERE n.isRead = 0 
    ORDER BY n.date DESC 
    LIMIT 5
  `).all() as any[];

  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  const todayStr = localDate.toISOString().split('T')[0];
  const tDate = new Date(todayStr);

  const alerts = rawAlerts.map(a => {
    const eDate = new Date(a.endDate);
    const diffTime = eDate.getTime() - tDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      id: a.id,
      contractId: a.contractId,
      contractNumber: a.contractNumber,
      message: a.message,
      severity: a.type,
      daysRemaining: diffDays,
      read: Boolean(a.isRead),
      date: a.date
    };
  });
  
  const activeCount = contracts.filter(c => c.status === 'ativo').length;
  const expiredCount = contracts.filter(c => c.status === 'vencido').length;
  let expiringSoonCount = 0;
  
  contracts.forEach(c => {
    if (c.status === 'ativo' || c.status === 'em_vencimento') {
      const eDate = new Date(c.endDate);
      const diffTime = eDate.getTime() - tDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 90) expiringSoonCount++;
    }
  });

  const unreadAlerts = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE isRead = 0').get() as any;

  res.json({
    activeContracts: activeCount,
    expiringSoon: expiringSoonCount,
    expiredContracts: expiredCount,
    unreadAlerts: unreadAlerts.count,
    recentActivity: logs,
    alerts: alerts
  });
});


// GET Contracts
app.get('/api/contracts', (req, res) => {
  checkAndUpdateContractStatuses();
  const contracts = db.prepare('SELECT * FROM contracts ORDER BY endDate ASC').all() as any[];
  
  contracts.forEach(c => {
    c.documents = db.prepare('SELECT * FROM contract_documents WHERE contractId = ?').all(c.id);
    c.history = db.prepare('SELECT * FROM contract_history WHERE contractId = ? ORDER BY date DESC').all(c.id);
  });

  res.json(contracts);
});

// CREATE Contract
app.post('/api/contracts', (req, res) => {
  const { number, object, contractorName, cnpj, value, startDate, endDate, termMonths, fiscalTitularId, fiscalSubstitutoId, observations, status, auditorUser, auditorRole, selectedFiles } = req.body;
  
  const id = `c_${Date.now()}`;
  db.prepare('INSERT INTO contracts (id, number, object, contractorName, cnpj, value, startDate, endDate, termMonths, status, fiscalTitularId, fiscalSubstitutoId, observations) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, number, object, contractorName, cnpj, value, startDate, endDate, termMonths, status || 'ativo', fiscalTitularId, fiscalSubstitutoId, observations);

  db.prepare('INSERT INTO contract_history (id, contractId, date, user, action, detail) VALUES (?, ?, ?, ?, ?, ?)')
    .run(`h_${Date.now()}`, id, new Date().toISOString().replace('T', ' ').substring(0, 19), auditorUser || 'admin', 'Cadastro', 'Contrato cadastrado administrativamente.');

  if (selectedFiles && Array.isArray(selectedFiles)) {
    selectedFiles.forEach((file: any, idx: number) => {
      const ext = file.name.split('.').pop();
      const filename = `contrato_${id}_doc_${idx}.${ext}`;
      const filepath = path.join(UPLOADS_DIR, filename);
      const base64Data = file.content.split(';base64,').pop();
      fs.writeFileSync(filepath, base64Data, { encoding: 'base64' });

      db.prepare('INSERT INTO contract_documents (id, contractId, name, filename, uploadDate, size) VALUES (?, ?, ?, ?, ?, ?)')
        .run(`doc_${Date.now()}_${idx}`, id, file.name, filename, new Date().toISOString().split('T')[0], file.size);
    });
  }

  addLog(auditorUser || 'admin', auditorRole || 'admin', 'CONTRATO_CADASTRADO', `Cadastrou o contrato ${number} (${contractorName}).`);
  
  checkAndUpdateContractStatuses(id);
  
  const newContract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id) as any;
  newContract.documents = db.prepare('SELECT * FROM contract_documents WHERE contractId = ?').all(id);
  newContract.history = db.prepare('SELECT * FROM contract_history WHERE contractId = ? ORDER BY date DESC').all(id);
  
  res.status(201).json(newContract);
});

// UPDATE Contract
app.put('/api/contracts/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { auditorUser, auditorRole, selectedFiles, _newHistoryAction } = updates;

  const current = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id) as any;
  if (!current) return res.status(404).json({ error: 'Contrato não encontrado.' });

  db.prepare(`UPDATE contracts SET 
    number = ?, object = ?, contractorName = ?, cnpj = ?, value = ?, startDate = ?, endDate = ?, termMonths = ?, status = ?, fiscalTitularId = ?, fiscalSubstitutoId = ?, observations = ?
    WHERE id = ?`).run(
    updates.number || current.number, updates.object || current.object, updates.contractorName || current.contractorName, updates.cnpj || current.cnpj, updates.value || current.value, updates.startDate || current.startDate, updates.endDate || current.endDate, updates.termMonths || current.termMonths, updates.status || current.status, updates.fiscalTitularId || current.fiscalTitularId, updates.fiscalSubstitutoId !== undefined ? updates.fiscalSubstitutoId : current.fiscalSubstitutoId, updates.observations !== undefined ? updates.observations : current.observations, id
  );

  if (_newHistoryAction) {
    db.prepare('INSERT INTO contract_history (id, contractId, date, user, action, detail) VALUES (?, ?, ?, ?, ?, ?)')
      .run(`h_${Date.now()}`, id, new Date().toISOString().replace('T', ' ').substring(0, 19), auditorUser || 'admin', _newHistoryAction.action, _newHistoryAction.detail);
  }

  addLog(auditorUser || 'admin', auditorRole || 'admin', 'CONTRATO_ATUALIZADO', `Contrato ${current.number} atualizado.`);
  
  checkAndUpdateContractStatuses(id);

  const updatedContract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id) as any;
  updatedContract.documents = db.prepare('SELECT * FROM contract_documents WHERE contractId = ?').all(id);
  updatedContract.history = db.prepare('SELECT * FROM contract_history WHERE contractId = ? ORDER BY date DESC').all(id);

  res.json(updatedContract);
});

// DELETE Contract
app.delete('/api/contracts/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM contracts WHERE id = ?').run(id);
  db.prepare('DELETE FROM notifications WHERE contractId = ?').run(id);
  addLog('admin', 'admin', 'CONTRATO_EXCLUIDO', `Contrato ${id} excluído.`);
  res.json({ success: true });
});

// GET Fiscais
app.get('/api/fiscais', (req, res) => {
  res.json(db.prepare('SELECT * FROM fiscais').all());
});

// CREATE Fiscal
app.post('/api/fiscais', (req, res) => {
  const { name, postoGraduacao, cpf, email, phone, role, status, auditorUser, auditorRole, warName } = req.body;
  const id = `f_${Date.now()}`;
  
  db.prepare('INSERT INTO fiscais (id, name, postoGraduacao, cpf, email, phone, role, status, warName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, name, postoGraduacao, cpf, email, phone || '', role || 'titular', status || 'ativo', warName || '');

  const actualWarName = warName || name.split(' ').slice(-1)[0];
  const generatedUsername = actualWarName.toLowerCase();
  const generatedPassword = actualWarName.toLowerCase() + '123';
  const hash = bcrypt.hashSync(generatedPassword, 10);
  
  db.prepare('INSERT INTO users (id, username, name, role, password, active, cpf, email, phone, warName, rank) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(`user_${id}`, generatedUsername, `${postoGraduacao} ${actualWarName}`, 'fiscal', hash, 1, cpf, email || '', phone || '', actualWarName, postoGraduacao);

  addLog(auditorUser || 'admin', auditorRole || 'admin', 'FISCAL_CADASTRADO', `Cadastrou fiscal ${postoGraduacao} ${name}`);
  res.status(201).json({ success: true, generatedCredentials: { username: generatedUsername, password: generatedPassword } });
});

// UPDATE Fiscal
app.put('/api/fiscais/:id', (req, res) => {
  const { id } = req.params;
  const { name, postoGraduacao, cpf, email, phone, role, status, warName } = req.body;
  
  const current = db.prepare('SELECT * FROM fiscais WHERE id = ?').get(id) as any;
  if (!current) return res.status(404).json({ error: 'Fiscal não encontrado' });
  
  db.prepare('UPDATE fiscais SET name=?, postoGraduacao=?, cpf=?, email=?, phone=?, role=?, status=?, warName=? WHERE id=?')
    .run(name || current.name, postoGraduacao || current.postoGraduacao, cpf || current.cpf, email || current.email, phone !== undefined ? phone : current.phone, role || current.role, status || current.status, warName || current.warName, id);
    
  // Sync the updated data with the users table
  const newPosto = postoGraduacao || current.postoGraduacao;
  const newWarName = warName || current.warName || (name || current.name).split(' ').slice(-1)[0];
  db.prepare('UPDATE users SET name=?, cpf=?, email=?, phone=?, warName=?, rank=? WHERE id=?')
    .run(`${newPosto} ${newWarName}`, cpf || current.cpf, email || current.email, phone !== undefined ? phone : current.phone, newWarName, newPosto, `user_${id}`);
    
  res.json({ success: true });
});

// DELETE Fiscal
app.delete('/api/fiscais/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM fiscais WHERE id = ?').run(id);
  db.prepare('DELETE FROM users WHERE id = ?').run(`user_${id}`);
  res.json({ success: true });
});

// GET Users
app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, active, cpf, precCp, email, phone, identity, warName, rank FROM users').all() as any[];
  res.json(users.map(u => ({ ...u, active: Boolean(u.active) })));
});

// CREATE User
app.post('/api/users', (req, res) => {
  const { username, name, role, password, active, cpf, precCp, email, phone, identity, warName, rank } = req.body;
  const exists = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (exists) return res.status(400).json({ error: 'Usuário já existe' });
  
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, username, name, role, password, active, cpf, precCp, email, phone, identity, warName, rank) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(`user_${Date.now()}`, username, name, role, hash, active !== undefined ? (active ? 1 : 0) : 1, cpf || '', precCp || '', email || '', phone || '', identity || '', warName || '', rank || '');
    
  res.status(201).json({ success: true });
});

// UPDATE User
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, name, role, password, active, cpf, precCp, email, phone, identity, warName, rank } = req.body;
  
  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!current) return res.status(404).json({ error: 'Usuário não encontrado' });
  
  let newPassword = current.password;
  if (password && password.trim() !== '') {
    newPassword = bcrypt.hashSync(password, 10);
  }
  
  db.prepare('UPDATE users SET username=?, name=?, role=?, password=?, active=?, cpf=?, precCp=?, email=?, phone=?, identity=?, warName=?, rank=? WHERE id=?')
    .run(
      username || current.username,
      name || current.name,
      role || current.role,
      newPassword,
      active !== undefined ? (active ? 1 : 0) : current.active,
      cpf || current.cpf,
      precCp !== undefined ? precCp : current.precCp,
      email || current.email,
      phone || current.phone,
      identity !== undefined ? identity : current.identity,
      warName || current.warName,
      rank || current.rank,
      id
    );
    
  res.json({ success: true });
});

// DELETE User
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ success: true });
});

// GET Logs
app.get('/api/logs', (req, res) => {
  res.json(db.prepare('SELECT * FROM logs ORDER BY date DESC').all());
});

// POST Log
app.post('/api/logs', (req, res) => {
  const { user, role, action, detail } = req.body;
  addLog(user || 'Sistema', role || 'visitante', action || 'ACAO', detail || '');
  res.json({ success: true });
});



// BACKUP Operations
app.get('/api/backups', (req, res) => {
  try {
    const files = fs.readdirSync(BACKUPS_DIR);
    const backups = files.filter(f => f.endsWith('.sqlite')).map(file => {
      const stats = fs.statSync(path.join(BACKUPS_DIR, file));
      let fileDate = new Date(stats.mtime);
      const match = file.match(/backup_contratos_(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z\.sqlite/);
      if (match) {
        fileDate = new Date(`${match[1]}T${match[2]}:${match[3]}:${match[4]}.${match[5]}Z`);
      }
      return {
        filename: file,
        date: fileDate.toISOString().replace('T', ' ').substring(0, 19),
        size: `${(stats.size / 1024).toFixed(2)} KB`,
        type: 'manual'
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(backups);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/backups/generate', (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_contratos_${timestamp}.sqlite`;
  try {
    // Flush WAL changes to main db file before copying
    db.pragma('wal_checkpoint(TRUNCATE)');
    fs.copyFileSync(DB_FILE, path.join(BACKUPS_DIR, filename));
    res.json({ success: true, message: 'Backup SQLite gerado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar backup SQLite' });
  }
});

app.post('/api/backups/restore', (req, res) => {
  const { filename, auditorUser, auditorRole } = req.body;
  if (!filename) {
    return res.status(400).json({ error: 'Nome do arquivo de backup não fornecido.' });
  }

  const backupPath = path.join(BACKUPS_DIR, filename);
  if (!fs.existsSync(backupPath)) {
    return res.status(404).json({ error: 'Arquivo de backup não encontrado.' });
  }

  try {
    // 1. Force checkpoint and close database
    db.pragma('wal_checkpoint(TRUNCATE)');
    db.close();

    // 2. Remove main database and WAL files
    const shmFile = `${DB_FILE}-shm`;
    const walFile = `${DB_FILE}-wal`;
    if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
    if (fs.existsSync(shmFile)) fs.unlinkSync(shmFile);
    if (fs.existsSync(walFile)) fs.unlinkSync(walFile);

    // 3. Copy the backup in place
    fs.copyFileSync(backupPath, DB_FILE);

    // 4. Reopen connection
    db = new Database(DB_FILE);
    db.pragma('journal_mode = WAL');

    // 5. Add audit log entry
    addLog(auditorUser || 'admin', auditorRole || 'admin', 'RESTAURACAO_BACKUP', `Backup restaurado do arquivo: ${filename}`);

    res.json({ success: true, message: `Backup "${filename}" restaurado com sucesso no sistema local.` });
  } catch (err: any) {
    console.error('Error during backup restoration:', err);
    try {
      db = new Database(DB_FILE);
      db.pragma('journal_mode = WAL');
    } catch (_) {}
    res.status(500).json({ error: 'Erro ao restaurar backup: ' + err.message });
  }
});

app.post('/api/admin/reset-database', (req, res) => {
  const { auditorUser, auditorRole } = req.body;
  try {
    // 1. Drop existing tables
    db.exec(`
      DROP TABLE IF EXISTS contract_documents;
      DROP TABLE IF EXISTS contract_history;
      DROP TABLE IF EXISTS contracts;
      DROP TABLE IF EXISTS fiscais;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS notifications;
      DROP TABLE IF EXISTS logs;
    `);

    // 2. Recreate schema
    createSchema();

    // 3. Seed database
    seedDatabase();

    // 4. Add audit log entry
    addLog(auditorUser || 'admin', auditorRole || 'admin', 'RESET_BANCO', 'Banco de dados reinicializado para o acervo padrão.');

    res.json({ success: true, message: 'Banco de dados reinicializado com sucesso.' });
  } catch (err: any) {
    console.error('Error resetting database:', err);
    res.status(500).json({ error: 'Erro ao reiniciar o banco de dados: ' + err.message });
  }
});

app.get('/api/database/export', (req, res) => {
  try {
    const contracts = db.prepare('SELECT * FROM contracts').all();
    const fiscais = db.prepare('SELECT * FROM fiscais').all();
    const users = db.prepare('SELECT * FROM users').all();
    const logs = db.prepare('SELECT * FROM logs').all();
    const dbDump = {
      timestamp: new Date().toISOString(),
      contracts,
      fiscais,
      users,
      logs
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="exportacao_banco_${new Date().toISOString().replace(/[:.]/g, '-')}.json"`);
    res.send(JSON.stringify(dbDump, null, 2));
  } catch (err) {
    res.status(500).send('Erro ao exportar banco de dados');
  }
});

app.use('/api/static-uploads', express.static(UPLOADS_DIR));

async function startServer() {
  checkAndUpdateContractStatuses();
  // Sincronização periódica a cada 1 hora (3600000 ms)
  setInterval(checkAndUpdateContractStatuses, 3600000);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Middleware do Vite acoplado com sucesso!');
  } else {
    const distPath = path.resolve('./dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[71º BATALHÃO DE INFANTARIA MOTORIZADO COMPASS] Servidor offline rodando em http://localhost:${PORT}`);
  });
}

startServer();
