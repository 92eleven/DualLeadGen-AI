const db = require('./db');
const axios = require('axios');
const nodemailer = require('nodemailer');

// Expanded niches and locations
const NICHES = ['Plumbing', 'HVAC', 'Dentist', 'Roofing', 'Bakery', 'Handyman', 'Electrician', 'Landscaping', 'Pest Control', 'House Cleaning'];
const LOCATIONS = ['Austin, TX', 'Denver, CO', 'Miami, FL', 'San Antonio, TX', 'Houston, TX'];

class Cole {
  constructor() {
    this.name = 'Cole';
    this.role = 'Growth Specialist';
  }

  async runDiscoveryLoop() {
    console.log(`[COLE] Starting Discovery Loop...`);
    
    // Add some real leads first to ensure high quality
    const realLeads = [
      { business_name: 'Mr. Done Right Handyman Contractor Austin', website: 'http://www.handyman-austin.com/', email: 'contact@handyman-austin.com', gaps: ['Missing SSL (HTTP only)', 'Old Design'] },
      { business_name: 'Monty\'s Handyman & Remodeling Services', website: 'https://getmontys.com/', email: 'info@getmontys.com', gaps: ['No Mobile Optimization', 'Slow Page Load'] },
      { business_name: 'Callfasthandyman', website: 'https://www.callfasthandyman.com/', email: 'service@callfasthandyman.com', gaps: ['Missing Google Business Profile', 'No Social Links'] },
      { business_name: 'Ace Roofing Company', website: 'https://aceroofingtexas.com/', email: 'office@aceroofingtexas.com', gaps: ['No Mobile Optimization'] },
      { business_name: 'Altair Austin Roofing Company', website: 'https://austinroofingcompany.com/', email: 'hello@austinroofingcompany.com', gaps: ['Missing GBP Verification'] }
    ];

    for (const lead of realLeads) {
       await this.analyzeAndPitch(lead, true);
    }

    for (const niche of NICHES) {
      for (const location of LOCATIONS) {
        console.log(`[COLE] Scanning for ${niche} in ${location}...`);
        const leads = await this.findLeads(niche, location);
        for (const lead of leads) {
          await this.analyzeAndPitch(lead);
        }
      }
    }
  }

  async findLeads(niche, location) {
    // Simulated discovery
    // Fixed email to be unique per niche and location
    const slug = `${location.toLowerCase().replace(/[^a-z]/g, '')}-${niche.toLowerCase()}`;
    return [
      { 
        business_name: `${location} ${niche} Pros`, 
        website: `http://www.${slug}.com`, 
        email: `owner@${slug}.com` 
      }
    ];
  }

  async analyzeAndPitch(lead, isReal = false) {
    console.log(`[COLE] Analyzing ${lead.business_name}...`);
    
    // Mock Gap Analysis if not provided
    const gaps = lead.gaps || ['Missing Google Business Profile', 'No Mobile Optimization'];
    const leadData = {
      business_name: lead.business_name,
      email: lead.email,
      website: lead.website,
      digital_gaps: JSON.stringify(gaps),
      status: 'discovered'
    };

    const self = this;
    db.run(`INSERT OR IGNORE INTO leads (business_name, email, website, digital_gaps, status) VALUES (?, ?, ?, ?, ?)`, 
      [leadData.business_name, leadData.email, leadData.website, leadData.digital_gaps, leadData.status], 
      function(err) {
        if (err) return console.error(err.message);
        if (this.changes > 0) {
          console.log(`[COLE] New lead saved: ${lead.business_name}`);
          self.draftPitch(lead, gaps);
        } else {
          console.log(`[COLE] Lead already exists: ${lead.business_name}`);
        }
      }
    );
  }

  draftPitch(lead, gaps) {
    console.log(`[COLE] Drafting highly personalized pitch for ${lead.business_name}...`);
    const gapList = gaps.map(g => `- ${g}`).join('\n');
    
    // Personalized hook based on business name or niche
    let hook = `I was checking out ${lead.business_name} and really liked what you guys are doing.`;
    if (lead.business_name.toLowerCase().includes('roof')) {
      hook = `I saw ${lead.business_name} while looking for top-rated roofers in the area. Your portfolio looks solid.`;
    } else if (lead.business_name.toLowerCase().includes('electric')) {
      hook = `I came across ${lead.business_name} and noticed you have some great reviews from local clients.`;
    }

    const pitch = `
Hi ${lead.business_name} Team,

${hook} 

I'm Cole, a Growth Specialist here in Austin. I was doing a quick digital audit of some local businesses and noticed a few things on your site that might be making it harder for new customers to find or trust you:

${gapList}

Most of these are quick fixes, but they usually make a huge difference in conversion. I'd love to send over a 5-minute video audit (totally free) showing exactly how to patch these up and what kind of traffic boost you could expect.

Would you be against me sending that over?

Cheers,
Cole
Growth Specialist at DualLeadGen AI
    `;
    
    // Log the interaction and update status
    db.get(`SELECT id FROM leads WHERE email = ?`, [lead.email], (err, row) => {
      if (row) {
        db.run(`INSERT INTO interactions (lead_id, agent, direction, content) VALUES (?, ?, ?, ?)`,
          [row.id, 'Cole', 'outbound', pitch]);
        db.run(`UPDATE leads SET status = 'pitched' WHERE id = ?`, [row.id]);
      }
    });
  }
}

const cole = new Cole();
cole.runDiscoveryLoop();
