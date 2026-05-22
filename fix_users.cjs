const Database = require('better-sqlite3');
const db = new Database('database/db.sqlite');

const fiscais = db.prepare('SELECT * FROM fiscais').all();

for (const fiscal of fiscais) {
  const warName = fiscal.warName || fiscal.name.split(' ').slice(-1)[0];
  const newName = `${fiscal.postoGraduacao} ${warName}`;
  const userId = `user_${fiscal.id}`;
  
  db.prepare('UPDATE users SET name = ?, warName = ?, rank = ? WHERE id = ?')
    .run(newName, warName, fiscal.postoGraduacao, userId);
    
  console.log(`Updated user ${userId} to name ${newName}`);
}

db.close();
