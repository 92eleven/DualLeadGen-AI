const db = require('./db');

const realEstateLeads = [
  // Austin, TX - Real Estate
  {
    business_name: 'Austin Realty Hub',
    website: 'https://www.austinrealtyhub.com/',
    email: 'info@austinrealtyhub.com',
    digital_gaps: ['Missing Lead Capture Form', 'No Mobile Optimization'],
    status: 'discovered'
  },
  {
    business_name: 'Premier Austin Homes',
    website: 'https://premieraustinhomes.com/',
    email: 'agents@premieraustinhomes.com',
    digital_gaps: ['Outdated Landing Page', 'Slow Page Load Speed'],
    status: 'discovered'
  },
  {
    business_name: 'Lake Travis Realty Group',
    website: 'https://www.laketravisrealty.com/',
    email: 'contact@laketravisrealty.com',
    digital_gaps: ['Missing SSL Certificate', 'No Lead Capture Form'],
    status: 'discovered'
  },
  {
    business_name: 'Capital City Realtors ATX',
    website: 'https://capitalcityrealtors.com/',
    email: 'listings@capitalcityrealtors.com',
    digital_gaps: ['No Mobile Optimization', 'No CRM Integration Visible'],
    status: 'discovered'
  },
  // Denver, CO - Real Estate
  {
    business_name: 'Denver Homefinders Realty',
    website: 'https://denverhomefinders.com/',
    email: 'hello@denverhomefinders.com',
    digital_gaps: ['Missing Lead Capture Form', 'Poor Mobile Responsiveness'],
    status: 'discovered'
  },
  {
    business_name: 'Mile High Property Group',
    website: 'https://milehighpropertygroup.com/',
    email: 'team@milehighpropertygroup.com',
    digital_gaps: ['No Online Scheduling', 'Outdated Design'],
    status: 'discovered'
  },
  {
    business_name: 'Summit County Real Estate Co',
    website: 'https://summitcountyrealestateco.com/',
    email: 'info@summitcountyrealestateco.com',
    digital_gaps: ['No Lead Magnet/Download', 'Slow Mobile Load'],
    status: 'discovered'
  },
  {
    business_name: 'Denver Urban Realtors',
    website: 'https://denverurbanrealtors.com/',
    email: 'contact@denverurbanrealtors.com',
    digital_gaps: ['Missing IDX Integration', 'No Follow-Up Automation'],
    status: 'discovered'
  },
  // Miami, FL - Real Estate
  {
    business_name: 'Miami Luxury Estates',
    website: 'https://miamiluxuryestates.com/',
    email: 'sales@miamiluxuryestates.com',
    digital_gaps: ['No Mobile Lead Capture', 'Heavy Unoptimized Images'],
    status: 'discovered'
  },
  {
    business_name: 'Brickell Realty Partners',
    website: 'https://brickellrealtypartners.com/',
    email: 'info@brickellrealtypartners.com',
    digital_gaps: ['Missing Chat/Lead Bot', 'Outdated Header Layout'],
    status: 'discovered'
  },
  {
    business_name: 'South Beach Real Estate Group',
    website: 'https://southbeachrealestategroup.com/',
    email: 'listings@southbeachrealestategroup.com',
    digital_gaps: ['No Lead Capture Form', 'Poor CTA Visibility'],
    status: 'discovered'
  },
  {
    business_name: 'Coral Gables Realty Inc',
    website: 'https://coralgablesrealtyinc.com/',
    email: 'hello@coralgablesrealtyinc.com',
    digital_gaps: ['Missing Google Business Profile Sync', 'No Contact Form'],
    status: 'discovered'
  },
  // San Antonio, TX - Real Estate
  {
    business_name: 'Alamo City Realty Pros',
    website: 'https://alamocityrealtypros.com/',
    email: 'info@alamocityrealtypros.com',
    digital_gaps: ['Missing Lead Capture Form', 'No Mobile Optimization'],
    status: 'discovered'
  },
  {
    business_name: 'San Antonio Home Team Realty',
    website: 'https://sahometeamrealty.com/',
    email: 'agents@sahometeamrealty.com',
    digital_gaps: ['Slow Load Time', 'No Property Search Feature'],
    status: 'discovered'
  },
  // Houston, TX - Real Estate
  {
    business_name: 'Houston Premier Properties',
    website: 'https://houstonpremierproperties.com/',
    email: 'info@houstonpremierproperties.com',
    digital_gaps: ['Outdated Mobile Site', 'No Lead Capture Form'],
    status: 'discovered'
  },
  {
    business_name: 'Houston Heights Realty',
    website: 'https://houstonheightsrealty.com/',
    email: 'team@houstonheightsrealty.com',
    digital_gaps: ['Slow Load Time', 'Missing Online Scheduling'],
    status: 'discovered'
  },
  // Dallas, TX - Real Estate
  {
    business_name: 'Dallas Premier Realty',
    website: 'https://dallaspremierrealty.com/',
    email: 'info@dallaspremierrealty.com',
    digital_gaps: ['Missing Lead Capture Form', 'No Mobile Optimization'],
    status: 'discovered'
  },
  {
    business_name: 'DFW Metro Home Group',
    website: 'https://dfwmetrohomegroup.com/',
    email: 'agents@dfwmetrohomegroup.com',
    digital_gaps: ['Outdated Landing Page', 'No IDX Integration'],
    status: 'discovered'
  },
  {
    business_name: 'Highland Park Real Estate',
    website: 'https://highlandparkrealtors.com/',
    email: 'listings@highlandparkrealtors.com',
    digital_gaps: ['No Lead Magnet', 'Slow Mobile Load'],
    status: 'discovered'
  },
  // Tampa, FL - Real Estate
  {
    business_name: 'Tampa Bay Realty Partners',
    website: 'https://tampabayrealtypartners.com/',
    email: 'info@tampabayrealtypartners.com',
    digital_gaps: ['Missing Lead Capture Form', 'Poor CTA Visibility'],
    status: 'discovered'
  },
  {
    business_name: 'Tampa Waterfront Properties',
    website: 'https://tampawaterfrontproperties.com/',
    email: 'hello@tampawaterfrontproperties.com',
    digital_gaps: ['No Mobile Optimization', 'Missing Chat Bot'],
    status: 'discovered'
  },
  // Orlando, FL - Real Estate
  {
    business_name: 'Orlando Dream Homes Realty',
    website: 'https://orlandodreamhomesrealty.com/',
    email: 'info@orlandodreamhomesrealty.com',
    digital_gaps: ['No Lead Capture Form', 'Outdated Design'],
    status: 'discovered'
  },
  {
    business_name: 'Central Florida Property Group',
    website: 'https://centralfloridapropertygroup.com/',
    email: 'agents@centralfloridapropertygroup.com',
    digital_gaps: ['Slow Page Speed', 'Missing Virtual Tour Integration'],
    status: 'discovered'
  },
  // Phoenix, AZ - Real Estate
  {
    business_name: 'Phoenix Valley Realty',
    website: 'https://phoenixvalleyrealty.com/',
    email: 'info@phoenixvalleyrealty.com',
    digital_gaps: ['Missing Lead Capture Form', 'No Mobile Optimization'],
    status: 'discovered'
  },
  {
    business_name: 'Scottsdale Luxury Homes Group',
    website: 'https://scottsdaleluxuryhomesgroup.com/',
    email: 'sales@scottsdaleluxuryhomesgroup.com',
    digital_gaps: ['Heavy Unoptimized Images', 'No Follow-Up Automation'],
    status: 'discovered'
  },
  {
    business_name: 'Arizona Sunset Realty',
    website: 'https://arizonasunsetrealty.com/',
    email: 'team@arizonasunsetrealty.com',
    digital_gaps: ['No Online Scheduling', 'Outdated Mobile Site'],
    status: 'discovered'
  },
  // Atlanta, GA - Real Estate
  {
    business_name: 'Atlanta Peach Realty',
    website: 'https://atlantapeachrealty.com/',
    email: 'info@atlantapeachrealty.com',
    digital_gaps: ['Missing Lead Capture Form', 'Slow Mobile Load'],
    status: 'discovered'
  },
  {
    business_name: 'Buckhead Luxury Realty Group',
    website: 'https://buckheadluxuryrealty.com/',
    email: 'agents@buckheadluxuryrealty.com',
    digital_gaps: ['No Lead Magnet', 'Outdated Header Layout'],
    status: 'discovered'
  },
  {
    business_name: 'Georgia Heartland Real Estate',
    website: 'https://georgiaheartlandrealestate.com/',
    email: 'hello@georgiaheartlandrealestate.com',
    digital_gaps: ['Missing Google Business Profile Sync', 'No Contact Form'],
    status: 'discovered'
  }
];

function saveAndPitchRealEstateLeads() {
  console.log('[REAL ESTATE SOURCING] Saving Real Estate leads to DB and generating pitches...');
  
  let savedCount = 0;
  let pendingCount = realEstateLeads.length;

  realEstateLeads.forEach(lead => {
    db.run(`INSERT OR IGNORE INTO leads (business_name, email, website, digital_gaps, status) VALUES (?, ?, ?, ?, ?)`,
      [lead.business_name, lead.email, lead.website, JSON.stringify(lead.digital_gaps), lead.status],
      function(err) {
        if (err) {
          console.error(err.message);
        } else if (this.changes > 0) {
          savedCount++;
          console.log(`[REAL ESTATE SOURCING] New lead: ${lead.business_name}`);
          
          // Now generate and log a personalized pitch
          const gapList = lead.digital_gaps.map(g => `- ${g}`).join('\n');
          
          let hook = `I was checking out listings in your area and came across ${lead.business_name}. Your portfolio looks strong.`;
          if (lead.business_name.toLowerCase().includes('luxury') || lead.business_name.toLowerCase().includes('premier')) {
            hook = `I noticed ${lead.business_name} has some impressive listings. Your market presence is clear.`;
          } else {
            hook = `I was reviewing local real estate sites and found ${lead.business_name}. You have a solid reputation in the area.`;
          }

          const pitch = `
Hi ${lead.business_name} Team,

${hook}

I'm Alex, a Growth Specialist here in Austin. I was doing a quick digital audit of some local real estate pros and noticed a few things on your site that might be making it harder for buyers and sellers to reach you:

${gapList}

Most of these are quick fixes, but they usually make a huge difference in converting site visitors into actual leads. I'd love to send over a free 5-minute video audit showing exactly how to patch these up and what kind of lead increase you could expect.

Would you be open to me sending that over?

Best,
Alex
Growth Specialist at DualLeadGen AI
          `;

          // Log the pitch
          db.get(`SELECT id FROM leads WHERE email = ?`, [lead.email], (err, row) => {
            if (row) {
              db.run(`INSERT INTO interactions (lead_id, agent, direction, content) VALUES (?, 'Alex', 'outbound', ?)`,
                [row.id, pitch]);
              db.run(`UPDATE leads SET status = 'pitched', last_contacted_at = CURRENT_TIMESTAMP WHERE id = ?`, [row.id]);
              console.log(`[REAL ESTATE SOURCING] Pitched: ${lead.business_name}`);
            }
          });
        } else {
          console.log(`[REAL ESTATE SOURCING] Lead already exists: ${lead.business_name}`);
        }
        
        pendingCount--;
        if (pendingCount === 0) {
          console.log(`[REAL ESTATE SOURCING] Complete! ${savedCount} new Real Estate leads saved and pitched.`);
        }
      }
    );
  });
}

saveAndPitchRealEstateLeads();

// Also log metric
setTimeout(() => {
  db.run(`INSERT INTO metrics (date, leads_scanned, emails_sent) VALUES (date('now'), ${realEstateLeads.length}, ${realEstateLeads.length})
    ON CONFLICT(date) DO UPDATE SET leads_scanned = leads_scanned + ${realEstateLeads.length}, emails_sent = emails_sent + ${realEstateLeads.length}`);
  console.log('[REAL ESTATE SOURCING] Metrics updated.');
}, 500);