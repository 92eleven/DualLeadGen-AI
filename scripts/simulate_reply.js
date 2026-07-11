const db = require('./db');

async function simulateReply() {
  console.log("Simulating a lead reply...");
  
  // 1. Find a lead to simulate a reply from
  db.get("SELECT id, business_name FROM leads LIMIT 1", [], (err, lead) => {
    if (err) return console.error(err.message);
    if (!lead) return console.log("No leads found to simulate reply.");

    console.log(`Lead found: ${lead.business_name} (ID: ${lead.id})`);

    // 2. Insert an inbound interaction (objection)
    const objection = "too expensive";
    db.run("INSERT INTO interactions (lead_id, agent, direction, content) VALUES (?, ?, ?, ?)", 
      [lead.id, 'Prospect', 'inbound', objection], (err) => {
        if (err) return console.error(err.message);
        console.log(`Inserted inbound message: "${objection}"`);

        // 3. Set lead status to 'replying'
        db.run("UPDATE leads SET status = 'replying' WHERE id = ?", [lead.id], (err) => {
          if (err) return console.error(err.message);
          console.log(`Lead status updated to 'replying'. Aria should pick this up.`);
          
          // Close DB connection after simulation
          // db.close();
        });
      });
  });
}

simulateReply();
