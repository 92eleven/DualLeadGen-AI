const db = require('./db');

console.log('=== LEAD DATABASE VERIFICATION ===');
console.log('');

db.all("SELECT COUNT(*) as total FROM leads", (err, rows) => {
  if (err) { console.error(err); return; }
  console.log(`Total leads in DB: ${rows[0].total}`);
  
  db.all("SELECT status, COUNT(*) as count FROM leads GROUP BY status ORDER BY status", (err, rows) => {
    if (err) { console.error(err); return; }
    console.log('By status:');
    rows.forEach(r => console.log(`  ${r.status}: ${r.count}`));
    
    db.all("SELECT id, business_name, status FROM leads WHERE business_name LIKE '%Real%' OR business_name LIKE '%Realt%' OR business_name LIKE '%Home%' OR business_name LIKE '%Property%' OR business_name LIKE '%Estates%' OR business_name LIKE '%Realty%' OR business_name LIKE '%Capital%' OR business_name LIKE '%Alamo%' OR business_name LIKE '%Brickell%' OR business_name LIKE '%Coral%' OR business_name LIKE '%Miami Luxury%' OR business_name LIKE '%South Beach%' OR business_name LIKE '%Summit%' OR business_name LIKE '%Denver Urban%' OR business_name LIKE '%Lake Travis%'", (err, rows) => {
      if (err) { console.error(err); return; }
      console.log('\nReal Estate leads:');
      rows.forEach(r => console.log(`  [${r.id}] ${r.business_name} (${r.status})`));
      
      db.all("SELECT COUNT(*) as total FROM interactions WHERE agent = 'Alex'", (err, rows) => {
        if (err) { console.error(err); return; }
        console.log(`\nAlex interactions logged: ${rows[0].total}`);
        
        db.all("SELECT agent, COUNT(*) as count FROM interactions GROUP BY agent", (err, rows) => {
          if (err) { console.error(err); return; }
          console.log('\nInteractions by agent:');
          rows.forEach(r => console.log(`  ${r.agent}: ${r.count}`));
          
          console.log('\n=== VERIFICATION COMPLETE ===');
        });
      });
    });
  });
});