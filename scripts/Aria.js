const db = require('./db');
const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');

class Aria {
  constructor() {
    this.name = 'ARIA';
    this.role = 'Client Success';
    
    // Load knowledge base
    let kb = [];
    try {
      kb = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/knowledge_base.json'), 'utf8'));
    } catch (e) {
      console.error('[ARIA] Could not load knowledge base:', e.message);
      kb = [];
    }
    
    this.knowledgeBase = kb;
    this.fuse = new Fuse(this.knowledgeBase, { 
      keys: ['input_pattern'], 
      threshold: 0.4,
      includeScore: true
    });
  }

  async monitorInbox() {
    console.log(`[ARIA] Monitoring inbox for replies...`);
    
    // Poll DB for 'replying' status leads every 10 seconds
    setInterval(async () => {
      try {
        const rows = await db.allAsync("SELECT * FROM leads WHERE status = 'replying'");
        for (const lead of rows) {
          await this.handleConversation(lead);
        }
      } catch (err) {
        console.error('[ARIA] Poll error:', err.message);
      }
    }, 10000);
  }

  async handleConversation(lead) {
    console.log(`[ARIA] 💬 Intercepting reply from ${lead.business_name}...`);
    
    // Simulate an inbound message from the lead
    const userMessage = "This seems expensive, I'm not sure if it's worth it.";
    
    // RAG Search for best response
    const results = this.fuse.search(userMessage);
    let response = "I hear you. Let me look into how we can make this work for your specific needs.";
    
    if (results.length > 0) {
      const bestMatch = results[0];
      response = bestMatch.item.optimized_response;
      console.log(`[ARIA] 📚 Knowledge match found (score: ${(1 - bestMatch.score).toFixed(2)}) for: "${bestMatch.item.input_pattern}"`);
      
      // Update performance score for this knowledge entry
      await db.runAsync(
        "UPDATE knowledge_vault SET performance_score = (performance_score + 0.1) WHERE id = ?",
        [bestMatch.item.id]
      );
    } else {
      console.log(`[ARIA] No direct knowledge match. Using fallback response.`);
    }

    console.log(`[ARIA] Sending response to ${lead.email}: "${response.substring(0, 80)}..."`);
    
    // Record outbound response
    await db.runAsync(
      "INSERT INTO interactions (lead_id, agent, direction, content) VALUES (?, ?, 'outbound', ?)",
      [lead.id, this.name, response]
    );
    
    // Update lead status back to pitched to avoid re-processing
    await db.runAsync("UPDATE leads SET status = 'pitched', last_contacted_at = datetime('now') WHERE id = ?", [lead.id]);
    
    // Track reply in metrics
    await db.upsertMetrics('replies_received', 1);
    
    console.log(`[ARIA] ✅ Conversation handled for ${lead.business_name}`);
  }

  // Simulate a lead replying (useful for demo)
  async simulateReply(leadId, message = "How much does it cost?") {
    const lead = await db.getAsync("SELECT * FROM leads WHERE id = ?", [leadId]);
    if (!lead) {
      console.error(`[ARIA] Lead ${leadId} not found`);
      return;
    }
    
    // Record inbound message
    await db.runAsync(
      "INSERT INTO interactions (lead_id, agent, direction, content) VALUES (?, ?, 'inbound', ?)",
      [leadId, this.name, message]
    );
    
    // Set status to replying so the monitor picks it up
    await db.runAsync("UPDATE leads SET status = 'replying', last_contacted_at = datetime('now') WHERE id = ?", [leadId]);
    
    console.log(`[ARIA] 📥 Simulated reply from ${lead.business_name}: "${message.substring(0, 80)}..."`);
    console.log(`[ARIA] Lead #${leadId} is now in 'replying' state — monitor will handle it.`);
  }
}

const aria = new Aria();
aria.monitorInbox();

// Allow running `node Aria.js simulate <leadId> <message>` for testing
if (process.argv[2] === 'simulate') {
  const leadId = parseInt(process.argv[3]) || 1;
  const message = process.argv[4] || "This seems expensive, I'm not sure if it's worth it.";
  
  // Give the monitor a moment to start, then simulate
  setTimeout(() => {
    aria.simulateReply(leadId, message).then(() => {
      console.log('[ARIA] Simulation complete. Monitor will handle the response shortly.');
    });
  }, 2000);
}

module.exports = aria;
