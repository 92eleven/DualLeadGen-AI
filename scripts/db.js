const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/dual_leadgen.db');
const db = new sqlite3.Database(dbPath);

// Enable WAL mode for better concurrent access
db.run('PRAGMA journal_mode=WAL');

// Schema initialization
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_name TEXT,
    email TEXT UNIQUE,
    website TEXT,
    digital_gaps TEXT,
    status TEXT DEFAULT 'discovered',
    last_contacted_at DATETIME,
    score INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER,
    agent TEXT,
    direction TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(lead_id) REFERENCES leads(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER,
    logo_url TEXT,
    brand_colors TEXT, -- JSON
    bio TEXT,
    industry TEXT,
    subdomain TEXT UNIQUE,
    custom_domain TEXT,
    site_status TEXT DEFAULT 'pending', -- pending, building, live
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_upsell_at DATETIME,
    FOREIGN KEY(lead_id) REFERENCES leads(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS support_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    request_type TEXT, -- edit_text, swap_image, layout_tweak
    details TEXT,
    status TEXT DEFAULT 'open', -- open, processing, resolved
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(client_id) REFERENCES clients(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS knowledge_vault (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    input_pattern TEXT,
    optimized_response TEXT,
    performance_score FLOAT DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS metrics (
    date DATE PRIMARY KEY,
    leads_scanned INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    replies_received INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue FLOAT DEFAULT 0.0
  )`);
});

// Promise-based helpers for cleaner code
db.getAsync = function(sql, params) {
  return new Promise((resolve, reject) => {
    this.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

db.allAsync = function(sql, params) {
  return new Promise((resolve, reject) => {
    this.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

db.runAsync = function(sql, params) {
  return new Promise((resolve, reject) => {
    this.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

// Aggregate metrics: returns totals across all dates
db.getAggregateMetrics = async function() {
  const totals = await this.getAsync(`
    SELECT 
      COALESCE(SUM(leads_scanned), 0) as leads_scanned,
      COALESCE(SUM(emails_sent), 0) as pitches,
      COALESCE(SUM(replies_received), 0) as conversations,
      COALESCE(SUM(revenue), 0) as revenue,
      COALESCE(SUM(conversions), 0) as conversions
    FROM metrics
  `);
  // Also count leads by status
  const leadCounts = await this.getAsync(`
    SELECT 
      COALESCE(SUM(CASE WHEN status IN ('discovered','pitched') THEN 1 ELSE 0 END), 0) as active_leads,
      COALESCE(SUM(CASE WHEN status = 'replying' THEN 1 ELSE 0 END), 0) as replying_leads
    FROM leads
  `);
  return { ...totals, ...leadCounts };
};

// Upsert today's metrics
db.upsertMetrics = async function(field, increment = 1) {
  const validFields = ['leads_scanned', 'emails_sent', 'replies_received', 'conversions', 'revenue'];
  if (!validFields.includes(field)) throw new Error(`Invalid metrics field: ${field}`);
  await this.runAsync(`
    INSERT INTO metrics (date, ${field}) VALUES (date('now'), ?)
    ON CONFLICT(date) DO UPDATE SET ${field} = ${field} + ?
  `, [increment, increment]);
};

module.exports = db;
