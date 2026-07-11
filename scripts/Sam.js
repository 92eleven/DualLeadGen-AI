const db = require('./db');
const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');

class Sam {
  constructor() {
    this.name = 'Sam';
    this.role = 'Client Success';
    this.knowledgeBase = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/knowledge_base.json')));
    this.fuse = new Fuse(this.knowledgeBase, { keys: ['input_pattern'], threshold: 0.4 });
  }

  async monitorInbox() {
    console.log(`[SAM] Monitoring Inbox for replies...`);
    setInterval(async () => {
      db.all("SELECT * FROM leads WHERE status = 'replying'", (err, rows) => {
        if (err) return console.error(err.message);
        rows.forEach(lead => this.handleConversation(lead));
      });
    }, 10000);
  }

  async handleConversation(lead) {
    console.log(`[SAM] Processing reply from ${lead.business_name}...`);
    
    // Simulate getting the last inbound message
    db.get("SELECT content FROM interactions WHERE lead_id = ? AND direction = 'inbound' ORDER BY created_at DESC LIMIT 1", [lead.id], (err, interaction) => {
      if (err || !interaction) return;

      const userMessage = interaction.content;
      const result = this.fuse.search(userMessage);
      
      let response = "I'm not sure I understood perfectly. Let me check with the team and get back to you, or you can check our $50/mo plan here: https://buy.stripe.com/test_dual_leadgen_50";
      
      if (result.length > 0) {
        const bestMatch = result[0].item.optimized_response;
        if (bestMatch === 'OPT_OUT') {
          console.log(`[SAM] Lead ${lead.email} requested opt-out. Marking as cold.`);
          db.run("UPDATE leads SET status = 'cold' WHERE id = ?", [lead.id]);
          return;
        }
        response = bestMatch;
      }

      console.log(`[SAM] Sending response to ${lead.email}: "${response.substring(0, 50)}..."`);
      db.run("INSERT INTO interactions (lead_id, agent, direction, content) VALUES (?, ?, 'outbound', ?)", 
        [lead.id, this.name, response]);
      
      db.run("UPDATE leads SET status = 'pitched' WHERE id = ?", [lead.id]);
    });
  }
}

const sam = new Sam();
sam.monitorInbox();
module.exports = sam;
