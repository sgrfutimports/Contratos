const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database('./database/db.sqlite');

const fiscais = db.prepare("SELECT * FROM fiscais").all();

let report = "# Credenciais Atualizadas dos Fiscais\n\n";
report += "| Fiscal | Posto/Grad | Nome de Guerra | Usuário (Login) | Senha |\n";
report += "|--------|------------|----------------|-----------------|-------|\n";

for (const fiscal of fiscais) {
  const actualWarName = fiscal.warName || fiscal.name.split(' ').slice(-1)[0];
  let generatedUsername = actualWarName.toLowerCase();
  const generatedPassword = actualWarName.toLowerCase() + '123';
  const hash = bcrypt.hashSync(generatedPassword, 10);

  const userId = `user_${fiscal.id}`;

  // Find existing user by ID or CPF/Name
  let userToUpdate = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!userToUpdate) {
    userToUpdate = db.prepare("SELECT * FROM users WHERE cpf = ? OR name LIKE ?").get(fiscal.cpf, `%${fiscal.name}%`);
  }

  if (userToUpdate) {
    let counter = 1;
    while (true) {
      const u = db.prepare("SELECT id FROM users WHERE username = ?").get(generatedUsername);
      if (!u || u.id === userToUpdate.id) {
        break;
      }
      generatedUsername = `${actualWarName.toLowerCase()}${counter}`;
      counter++;
    }

    db.prepare("UPDATE users SET username = ?, password = ? WHERE id = ?").run(generatedUsername, hash, userToUpdate.id);
    report += `| ${fiscal.name} | ${fiscal.postoGraduacao} | ${actualWarName} | **${generatedUsername}** | **${generatedPassword}** |\n`;
  } else {
    report += `| ${fiscal.name} | ${fiscal.postoGraduacao} | ${actualWarName} | (Usuário não encontrado) | (Usuário não encontrado) |\n`;
  }
}

console.log(report);
