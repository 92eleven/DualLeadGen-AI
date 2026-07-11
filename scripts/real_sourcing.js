const db = require('./db');

const realLeads = [
  { 
    business_name: 'TruTec Electric', 
    website: 'https://www.trutecelectric.com/', 
    email: 'info@trutecelectric.com', 
    digital_gaps: ['Missing Interactive Audit', 'Low Social Integration'],
    status: 'discovered'
  },
  { 
    business_name: 'DC Electric', 
    website: 'https://www.calldcelectrical.com/', 
    email: 'service@calldcelectrical.com', 
    digital_gaps: ['Performance Issues', 'Old Landing Page'],
    status: 'discovered'
  },
  { 
    business_name: 'Eskew Electric', 
    website: 'https://www.eskewelectric.com/', 
    email: 'electrician@eskewelectric.com', 
    digital_gaps: ['Basic Static Site', 'No Modern Booking Flow'],
    status: 'discovered'
  },
  { 
    business_name: 'U.S. Electric Contractors', 
    website: 'http://uselectriccontractors.com/', 
    email: 'contact@uselectriccontractors.com', 
    digital_gaps: ['Missing SSL (Security Risk)', 'Outdated UI/UX'],
    status: 'discovered'
  },
  { 
    business_name: 'Terrapin Electric', 
    website: 'https://terrapinelectric.com/', 
    email: 'hello@terrapinelectric.com', 
    digital_gaps: ['Missing Social Proof', 'Minimalist Content'],
    status: 'discovered'
  }
];

function saveLeads() {
  console.log('[REAL SOURCING] Saving real-world leads to DB...');
  realLeads.forEach(lead => {
    db.run(`INSERT OR IGNORE INTO leads (business_name, email, website, digital_gaps, status) VALUES (?, ?, ?, ?, ?)`, 
      [lead.business_name, lead.email, lead.website, JSON.stringify(lead.digital_gaps), lead.status], 
      function(err) {
        if (err) return console.error(err.message);
        if (this.changes > 0) {
          console.log(`[REAL SOURCING] New real lead saved: ${lead.business_name}`);
        } else {
          console.log(`[REAL SOURCING] Lead already exists: ${lead.business_name}`);
        }
      }
    );
  });
}

saveLeads();
