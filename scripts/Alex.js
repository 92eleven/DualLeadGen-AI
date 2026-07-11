const db = require('./db');

class Alex {
  constructor() {
    this.name = 'Alex';
    this.role = 'Growth Specialist';
  }

  async runDiscoveryLoop() {
    console.log(`[ALEX] Starting Discovery Loop...`);
    const niches = ['Plumbing', 'HVAC', 'Electrician', 'Roofing', 'Landscaping', 'Real Estate'];
    const locations = [
      'New York, NY',
      'Los Angeles, CA',
      'Chicago, IL',
      'Houston, TX',
      'Philadelphia, PA',
      'Phoenix, AZ',
      'San Antonio, TX',
      'San Diego, CA',
      'Dallas, TX',
      'San Jose, CA',
      'Austin, TX',
      'Jacksonville, FL',
      'San Francisco, CA',
      'Indianapolis, IN',
      'Columbus, OH',
      'Fort Worth, TX',
      'Charlotte, NC',
      'Seattle, WA',
      'Denver, CO',
      'El Paso, TX',
      'Detroit, MI',
      'Washington, DC',
      'Boston, MA',
      'Memphis, TN',
      'Nashville, TN',
      'Portland, OR',
      'Oklahoma City, OK',
      'Las Vegas, NV',
      'Baltimore, MD',
      'Louisville, KY',
      'Milwaukee, WI',
      'Albuquerque, NM',
      'Tucson, AZ',
      'Fresno, CA',
      'Sacramento, CA',
      'Kansas City, MO',
      'Long Beach, CA',
      'Mesa, AZ',
      'Atlanta, GA',
      'Colorado Springs, CO',
      'Virginia Beach, VA',
      'Raleigh, NC',
      'Omaha, NE',
      'Miami, FL',
      'Oakland, CA',
      'Minneapolis, MN',
      'Tulsa, OK',
      'Wichita, KS',
      'New Orleans, LA',
      'Arlington, TX'
    ];

    for (const niche of niches) {
      for (const location of locations) {
        console.log(`[ALEX] Scanning for ${niche} in ${location}...`);
        const leads = await this.findLeads(niche, location);
        for (const lead of leads) {
          await this.analyzeAndPitch(lead);
        }
      }
    }
  }

  async findLeads(niche, location) {
    const slug = `${location.toLowerCase().replace(/[^a-z]/g, '')}-${niche.toLowerCase()}`;
    return [
      { 
        business_name: `${location} ${niche} Experts`, 
        website: `http://www.${slug}-pro.com`, 
        email: `contact@${slug}-pro.com` 
      }
    ];
  }

  async analyzeAndPitch(lead) {
    const gaps = ['Slow Mobile Speed', 'Missing Lead Capture Form'];
    const pitch = `
Hi ${lead.business_name} Team,

I noticed your website is missing a high-conversion lead funnel, which might be costing you calls every day.

We're Alex from DualLeadGen AI. We build custom lead funnels for local pros with $0 upfront and just $50/mo. It pays for itself with the first new customer.

Would you be open to seeing a preview of what we can build for you?

Best,
Alex
Growth Specialist at DualLeadGen AI
    `;

    db.run(`INSERT OR IGNORE INTO leads (business_name, email, website, digital_gaps, status) VALUES (?, ?, ?, ?, ?)`, 
      [lead.business_name, lead.email, lead.website, JSON.stringify(gaps), 'discovered'], 
      function(err) {
        if (err) return console.error(err.message);
        if (this.changes > 0) {
          console.log(`[ALEX] New lead: ${lead.business_name}. Logging pitch.`);
          db.get(`SELECT id FROM leads WHERE email = ?`, [lead.email], (err, row) => {
            if (row) {
              db.run(`INSERT INTO interactions (lead_id, agent, direction, content) VALUES (?, ?, 'outbound', ?)`,
                [row.id, 'Alex', pitch]);
              db.run(`UPDATE leads SET status = 'pitched' WHERE id = ?`, [row.id]);
            }
          });
        }
      }
    );
  }
}

// Run immediately, then every 6 hours
const alex = new Alex();
alex.runDiscoveryLoop();
setInterval(() => alex.runDiscoveryLoop(), 6 * 60 * 60 * 1000);

module.exports = alex;
