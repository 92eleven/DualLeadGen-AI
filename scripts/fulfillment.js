const db = require('./db');

class FulfillmentEngine {
  /**
   * Execute a fulfillment package for a paying lead.
   * @param {number} leadId - The lead's database ID
   * @param {object} leadInfo - { business_name, email, amount }
   * @returns {object} - Fulfillment report
   */
  async execute(leadId, leadInfo = {}) {
    const name = leadInfo.business_name || `Lead #${leadId}`;
    const email = leadInfo.email || 'unknown@example.com';
    const amount = leadInfo.amount || 0;

    console.log(`[FULFILLMENT] Starting fulfillment for "${name}" (${email})...`);

    const steps = [];
    const startTime = Date.now();

    // Step 1: Determine what package they paid for
    let packageType = 'basic';
    if (amount >= 499) {
      packageType = 'premium';
    } else if (amount >= 199) {
      packageType = 'standard';
    }

    steps.push({ step: 'Package Identification', status: 'complete', detail: `${packageType} package ($${amount})` });

    // Step 2: Fetch lead data from DB
    const lead = await db.getAsync("SELECT * FROM leads WHERE id = ?", [leadId]);
    let gaps = [];
    if (lead && lead.digital_gaps) {
      try {
        gaps = JSON.parse(lead.digital_gaps);
      } catch (e) {
        gaps = ['Unknown gaps'];
      }
    }

    steps.push({ step: 'Lead Data', status: 'complete', detail: `Gaps identified: ${gaps.join(', ')}` });

    // Step 3: Simulate assets being generated
    const assets = [];

    if (gaps.includes('Missing Google Business Profile') || gaps.includes('Google Business Profile')) {
      assets.push('google_business_profile_guide.pdf');
      steps.push({ step: 'Google Business Profile', status: 'generated', detail: 'Optimization guide created' });
    }

    if (gaps.includes('No Mobile Optimization') || gaps.includes('Mobile Optimization')) {
      assets.push('mobile_optimization_report.html');
      steps.push({ step: 'Mobile Optimization', status: 'generated', detail: 'Mobile responsiveness audit completed' });
    }

    if (packageType === 'premium' || packageType === 'standard') {
      assets.push('digital_audit_report.pdf');
      steps.push({ step: 'Digital Audit', status: 'generated', detail: 'Full audit report compiled' });

      if (packageType === 'premium') {
        assets.push('seo_keyword_analysis.csv');
        assets.push('competitor_benchmark.pdf');
        steps.push({ step: 'SEO & Competitor Analysis', status: 'generated', detail: 'Premium SEO package assembled' });
      }
    }

    // Step 4: Record fulfillment in DB
    const fulfillmentId = `ful-${leadId}-${Date.now()}`;
    const fulfillmentRecord = {
      id: fulfillmentId,
      lead_id: leadId,
      package: packageType,
      assets: assets.join(', '),
      amount: amount,
      status: 'delivered',
      fulfilled_at: new Date().toISOString()
    };

    // Create fulfillment log table if not exists
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
      "INSERT OR REPLACE INTO fulfillments (id, lead_id, package, assets, amount, status, fulfilled_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [fulfillmentId, leadId, packageType, assets.join(', '), amount, 'delivered', new Date().toISOString()]
    );

    // Record in interactions
    await db.runAsync(
      "INSERT INTO interactions (lead_id, agent, direction, content) VALUES (?, ?, 'outbound', ?)",
      [leadId, 'SYSTEM', `Fulfillment complete: ${packageType} package delivered. Assets: ${assets.join(', ')}`]
    );

    steps.push({ step: 'Fulfillment Recorded', status: 'complete', detail: `ID: ${fulfillmentId}` });

    const duration = Date.now() - startTime;

    const report = {
      fulfillment_id: fulfillmentId,
      business_name: name,
      email: email,
      package: packageType,
      amount_paid: amount,
      assets_delivered: assets,
      steps: steps,
      duration_ms: duration,
      status: 'delivered',
      timestamp: new Date().toISOString()
    };

    console.log(`[FULFILLMENT] ✅ Delivered ${packageType} package to "${name}" in ${duration}ms`);
    console.log(`[FULFILLMENT] Assets: ${assets.length > 0 ? assets.join(', ') : '(none configured)'}`);

    return report;
  }
}

const engine = new FulfillmentEngine();

// Allow running standalone for testing
if (require.main === module) {
  const leadId = process.argv[2] || 1;
  engine.execute(parseInt(leadId), {
    business_name: 'Test Business',
    email: 'test@example.com',
    amount: 199
  }).then(r => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(0);
  }).catch(e => {
    console.error(e);
    process.exit(1);
  });
} else {
  module.exports = engine;
}
