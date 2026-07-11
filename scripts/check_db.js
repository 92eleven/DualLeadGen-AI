const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../data/dual_leadgen.db');
const db = new sqlite3.Database(dbPath);

db.all('SELECT * FROM leads', (err, rows) => {
  if (err) console.error(err);
  else console.log('LEADS:', JSON.stringify(rows, null, 2));
});

db.all('SELECT * FROM interactions ORDER BY created_at DESC LIMIT 20', (err, rows) => {
  if (err) console.error(err);
  else console.log('INTERACTIONS:', JSON.stringify(rows, null, 2));
});

db.all('SELECT * FROM clients', (err, rows) => {
  if (err) console.error(err);
  else console.log('CLIENTS:', JSON.stringify(rows, null, 2));
});

db.all('SELECT * FROM metrics ORDER BY date DESC', (err, rows) => {
  if (err) console.error(err);
  else console.log('METRICS:', JSON.stringify(rows, null, 2));
});