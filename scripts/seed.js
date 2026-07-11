const db = require('./db');

async function seed() {
  console.log('🌱 Seeding database with demo data...\n');

  // Clear existing data
  await db.runAsync("DELETE FROM interactions");
  await db.runAsync("DELETE FROM leads");
  await db.runAsync("DELETE FROM metrics");
  await db.runAsync("DELETE FROM fulfillments");

  // 1. Seed leads
  const leadData = [
    { name: 'Austin Plumbing Pros', email: 'contact@austinplumbing.com', website: 'http://austinplumbing.com', gaps: JSON.stringify(['Missing Google Business Profile', 'No Mobile Optimization']), status: 'converted' },
    { name: 'Denver HVAC Experts', email: 'info@denverhvac.com', website: 'http://denverhvac.com', gaps: JSON.stringify(['No Mobile Optimization']), status: 'pitched' },
    { name: 'Miami Dental Care', email: 'hello@miamidental.com', website: 'http://miamidental.com', gaps: JSON.stringify(['Missing Google Business Profile', 'Outdated Website']), status: 'replying' },
    { name: 'Austin Roofing Co', email: 'quotes@austinroofing.com', website: 'http://austinroofing.com', gaps: JSON.stringify(['No Google Business Profile']), status: 'pitched' },
    { name: 'Denver Bakery', email: 'order@denverbakery.com', website: 'http://denverbakery.com', gaps: JSON.stringify(['Missing Google Business Profile', 'No Mobile Optimization']), status: 'discovered' },
    { name: 'Miami HVAC Solutions', email: 'service@miamihvac.com', website: 'http://miamihvac.com', gaps: JSON.stringify(['No Mobile Optimization']), status: 'discovered' },
    { name: 'Austin Dental Group', email: 'appts@austindental.com', website: 'http://austindental.com', gaps: JSON.stringify(['Missing Google Business Profile', 'No Mobile Optimization', 'Slow Loading Speed']), status: 'converted' },
    { name: 'Denver Roofing Pros', email: 'roofing@denverroofing.com', website: 'http://denverroofing.com', gaps: JSON.stringify(['Missing Google Business Profile']), status: 'pitched' },
    { name: 'Miami Bakery Shop', email: 'cake@miamibakery.com', website: 'http://miamibakery.com', gaps: JSON.stringify(['No Mobile Optimization', 'Outdated Website']), status: 'replying' },
    { name: 'Austin Electric Co', email: 'service@austinelectric.com', website: 'http://austinelectric.com', gaps: JSON.stringify(['Missing Google Business Profile']), status: 'discovered' },
  ];

  for (const lead of leadData) {
    const result = await db.runAsync(
      "INSERT INTO leads (business_name, email, website, digital_gaps, status, last_contacted_at) VALUES (?, ?, ?, ?, ?, datetime('now', '-' || CAST(ABS(RANDOM() % 72) AS TEXT) || ' hours'))",
      [lead.name, lead.email, lead.website, lead.gaps, lead.status]
    );
    console.log(`  ✓ Lead: ${lead.name} (${lead.status})`);
  }

  // 2. Seed metrics (last 7 days)
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const scanned = Math.floor(Math.random() * 15) + 5;
    const sent = Math.floor(Math.random() * 10) + 3;
    const replies = Math.floor(Math.random() * 5);
    const conversions = Math.floor(Math.random() * 2);
    const revenue = conversions * (Math.random() > 0.5 ? 199 : 499);
    
    await db.runAsync(
      "INSERT OR REPLACE INTO metrics (date, leads_scanned, emails_sent, replies_received, conversions, revenue) VALUES (?, ?, ?, ?, ?, ?)",
      [dateStr, scanned, sent, replies, conversions, revenue]
    );
    console.log(`  ✓ Metrics: ${dateStr} (${scanned} scanned, ${sent} sent, $${revenue} rev)`);
  }

  // 3. Seed interactions
  const allLeads = await db.allAsync("SELECT id, business_name FROM leads");
  const interactionTemplates = [
    { agent: 'COLE', direction: 'outbound', content: 'Drafted personalized pitch highlighting missing GBP profile.' },
    { agent: 'ARIA', direction: 'inbound', content: 'Lead replied: "How much does it cost?"' },
    { agent: 'ARIA', direction: 'outbound', content: 'I completely understand that price is a factor. Our $199 optimization pays for itself within weeks.' },
    { agent: 'COLE', direction: 'outbound', content: 'Sent follow-up email with case studies of similar businesses.' },
    { agent: 'SYSTEM', direction: 'system', content: 'Lead converted. Fulfillment triggered.' },
    { agent: 'ARIA', direction: 'inbound', content: 'Lead replied: "Okay, let me think about it."' },
    { agent: 'ARIA', direction: 'outbound', content: 'No rush! Here is a free audit report so you can see the value.' },
    { agent: 'SYSTEM', direction: 'system', content: 'Payment received: $199. Fulfillment delivered.' },
  ];

  for (const lead of allLeads.slice(0, 5)) {
    const template = interactionTemplates[Math.floor(Math.random() * interactionTemplates.length)];
    const hoursAgo = Math.floor(Math.random() * 48);
    await db.runAsync(
      "INSERT INTO interactions (lead_id, agent, direction, content, created_at) VALUES (?, ?, ?, ?, datetime('now', '-' || ? || ' hours'))",
      [lead.id, template.agent, template.direction, template.content, hoursAgo]
    );
  }
  console.log(`  ✓ Interactions: 5 sample records`);

  // 4. Seed knowledge vault
  const knowledgeEntries = [
    { category: 'objection', input_pattern: 'too expensive', response: 'Our $199 optimization pays for itself within weeks by capturing lost traffic.' },
    { category: 'objection', input_pattern: 'who are you', response: 'I am Aria, Client Success at DualLeadGen AI. We help local businesses compete with automated digital presence fixes.' },
    { category: 'objection', input_pattern: 'not interested', response: 'I understand. Would you be open to a free 2-minute audit so you can see what opportunities exist?' },
    { category: 'objection', input_pattern: 'already have a website', response: 'That is great! Our audit checks mobile responsiveness, Google Business Profile optimization, and load speed — many websites miss these.' },
    { category: 'niche_pitch', input_pattern: 'plumbing', response: 'Plumbing businesses with optimized profiles see 40% more calls. Let me show you what your current profile is missing.' },
    { category: 'success_story', input_pattern: 'case study', response: 'One client went from 2 calls/week to 15+ after we optimized their GBP and mobile site. Total investment: $199.' },
  ];

  for (const entry of knowledgeEntries) {
    await db.runAsync(
      "INSERT INTO knowledge_vault (category, input_pattern, optimized_response, performance_score) VALUES (?, ?, ?, ?)",
      [entry.category, entry.input_pattern, entry.response, Math.random() * 0.8 + 0.2]
    );
  }
  console.log(`  ✓ Knowledge Vault: ${knowledgeEntries.length} entries`);

  // 5. Seed a fulfillment record
  await db.runAsync(`CREATE TABLE IF NOT EXISTS fulfillments (
    id TEXT PRIMARY KEY,
    lead_id INTEGER,
    package TEXT,
    assets TEXT,
    amount REAL,
    status TEXT DEFAULT 'delivered',
    fulfilled_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.runAsync(
    "INSERT INTO fulfillments (id, lead_id, package, assets, amount, status, fulfilled_at) VALUES (?, ?, ?, ?, ?, 'delivered', datetime('now', '-2 days'))",
    ['ful-demo-001', 1, 'standard', 'google_business_profile_guide.pdf, mobile_optimization_report.html', 199, 'delivered']
  );
  console.log('  ✓ Fulfillments: 1 sample record');

  // Summary
  const leadCount = (await db.getAsync("SELECT COUNT(*) as cnt FROM leads")).cnt;
  const metricDays = (await db.getAsync("SELECT COUNT(*) as cnt FROM metrics")).cnt;
  const totalRevenue = (await db.getAsync("SELECT COALESCE(SUM(revenue), 0) as total FROM metrics")).total;

  console.log(`\n✅ Seeding complete!`);
  console.log(`   📊 ${leadCount} leads`);
  console.log(`   📅 ${metricDays} days of metrics`);
  console.log(`   💰 $${totalRevenue.toFixed(2)} total revenue`);
  console.log(`\n   Dashboard will show real data at /admin\n`);

  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
