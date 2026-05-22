import Database from 'better-sqlite3';
const db = new Database('database/db.sqlite');

function checkAndUpdateContractStatuses() {
  try {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    const todayStr = localDate.toISOString().split('T')[0];
    console.log('todayStr is:', todayStr);

    const contracts = db.prepare("SELECT * FROM contracts WHERE status IN ('ativo', 'em_vencimento', 'vencido')").all() as any[];
    console.log('Loaded contracts count:', contracts.length);

    for (const contract of contracts) {
      let targetStatus = 'ativo';
      let diffDays = 0;

      if (contract.endDate < todayStr) {
        targetStatus = 'vencido';
      } else {
        const eDate = new Date(contract.endDate);
        const tDate = new Date(todayStr);
        const diffTime = eDate.getTime() - tDate.getTime();
        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 30) {
          targetStatus = 'em_vencimento';
        }
      }

      console.log(`Contract: ${contract.number}, status: ${contract.status}, target: ${targetStatus}, endDate: ${contract.endDate}`);

      if (contract.status !== targetStatus) {
        console.log(`  Updating ${contract.number} from ${contract.status} to ${targetStatus}`);
        const result = db.prepare('UPDATE contracts SET status = ? WHERE id = ?').run(targetStatus, contract.id);
        console.log('  Update result:', result);
      }
    }
  } catch (err) {
    console.error('Error checking contract statuses:', err);
  }
}

checkAndUpdateContractStatuses();
