const db = require('./db');

class Optimizer {
  constructor() {
    this.name = 'OPTIMIZER';
  }

  async run() {
    console.log(`[OPTIMIZER] Starting daily optimization loop...`);
    const startTime = Date.now();
    const results = [];

    try {
      // 1. Analyze successful conversions
      const converted = await db.allAsync("SELECT * FROM leads WHERE status = 'converted'");
      console.log(`[OPTIMIZER] Found ${converted.length} successful conversions to analyze.`);
      
      if (converted.length > 0) {
        // Analyze common patterns in converted leads
        const gapCounts = {};
        converted.forEach(lead => {
          if (lead.digital_gaps) {
            try {
              const gaps = JSON.parse(lead.digital_gaps);
              gaps.forEach(gap => {
                gapCounts[gap] = (gapCounts[gap] || 0) + 1;
              });
            } catch (e) {}
          }
        });
        
        console.log('[OPTIMIZER] Gap patterns in conversions:', gapCounts);
        results.push({ phase: 'conversion_analysis', detail: gapCounts });
      }

      // 2. Calculate conversion rate
      const totalLeads = await db.getAsync("SELECT COUNT(*) as cnt FROM leads");
      const totalConversions = await db.getAsync("SELECT COUNT(*) as cnt FROM leads WHERE status = 'converted'");
      const conversionRate = totalLeads.cnt > 0 
        ? ((totalConversions.cnt / totalLeads.cnt) * 100).toFixed(2) 
        : '0.00';
      
      console.log(`[OPTIMIZER] Conversion rate: ${conversionRate}% (${totalConversions.cnt}/${totalLeads.cnt})`);
      results.push({ phase: 'conversion_rate', rate: conversionRate + '%' });

      // 3. Analyze recent interactions
      const recentInteractions = await db.allAsync(
        "SELECT agent, COUNT(*) as count FROM interactions WHERE created_at > datetime('now', '-24 hours') GROUP BY agent"
      );
      console.log('[OPTIMIZER] Recent agent activity:', recentInteractions);
      results.push({ phase: 'agent_activity', data: recentInteractions });

      // 4. Check for revenue trends
      const weeklyRevenue = await db.allAsync(
        "SELECT date, revenue FROM metrics WHERE date > date('now', '-7 days') ORDER BY date"
      );
      const totalRevenue = weeklyRevenue.reduce((sum, r) => sum + (r.revenue || 0), 0);
      console.log(`[OPTIMIZER] Last 7 days revenue: $${totalRevenue.toFixed(2)}`);
      results.push({ phase: 'revenue_trend', weekly: weeklyRevenue, total: totalRevenue });

      // 5. Prune stale knowledge base entries
      const staleCount = 0; // No-op for now; would remove low-performance entries
      results.push({ phase: 'knowledge_cleanup', pruned: staleCount });

      const duration = Date.now() - startTime;
      console.log(`[OPTIMIZER] ✅ Optimization loop complete in ${duration}ms`);
      
      // Record the optimization run
      await db.runAsync(
        "INSERT INTO interactions (lead_id, agent, direction, content) VALUES (?, ?, 'system', ?)",
        [0, this.name, `Optimization run complete: ${JSON.stringify(results)}`]
      );

      return results;
    } catch (err) {
      console.error('[OPTIMIZER] Error:', err);
      return { error: err.message };
    }
  }
}

// Run immediately, then schedule daily
const optimizer = new Optimizer();
optimizer.run().then(() => {
  console.log('[OPTIMIZER] Initial run complete. Will repeat every 24 hours.');
}).catch(err => {
  console.error('[OPTIMIZER] Fatal:', err);
});

setInterval(() => {
  optimizer.run().catch(err => console.error('[OPTIMIZER] Scheduled run error:', err));
}, 24 * 60 * 60 * 1000);

module.exports = optimizer;
