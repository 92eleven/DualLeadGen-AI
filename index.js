const express = require('express');
const path = require('path');
const db = require('./scripts/db');
const devin = require('./scripts/Devin');
const app = express();
const port = 3000;

app.use(express.json());

// Subdomain/Custom Domain Mapping Middleware
app.use(async (req, res, next) => {
  // Ignore API, webhook, support, admin, or onboarding endpoints
  if (req.path.startsWith('/api/') || req.path.startsWith('/webhook/') || req.path.startsWith('/admin') || req.path.startsWith('/support') || req.path.startsWith('/onboarding')) {
    return next();
  }

  const host = req.headers.host || '';
  const cleanHost = host.split(':')[0]; // remove port
  const baseDomain = '57c921b14b31dd4ab771f1d6cdfaa42e.ctonew.app';

  let client = null;

  try {
    // 1. Check if the host matches a custom domain directly in the database
    client = await db.getAsync("SELECT * FROM clients WHERE custom_domain = ?", [cleanHost]);

    // 2. If not found, check if it's a subdomain of our base domain
    if (!client && host.endsWith(baseDomain) && host !== baseDomain) {
      const subdomain = host.replace(`.${baseDomain}`, '').split(':')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'admin') {
        client = await db.getAsync("SELECT * FROM clients WHERE subdomain = ?", [subdomain]);
      }
    }

    // 3. If we found a matching client, serve their site at "/" or "/index.html"
    if (client) {
      if (req.path === '/' || req.path === '/index.html') {
        return res.sendFile(path.join(__dirname, 'public/clients', `${client.subdomain}.html`));
      }
    }
  } catch (err) {
    console.error('[ROUTING] Domain lookup error:', err);
  }

  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Serve Dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'internal/index.html'));
});

// Step 3-Step Onboarding Form
app.get('/onboarding', (req, res) => {
  res.send(`
    <html>
      <body style="font-family: sans-serif; padding: 2rem; background: #0f0f1e; color: white;">
        <h1>Welcome to DualLeadGen AI Onboarding</h1>
        <form action="/api/onboarding" method="POST">
          <input type="hidden" name="lead_id" value="${req.query.lead_id || 1}">
          <label>Business Bio:</label><br>
          <textarea name="bio" style="width: 100%; height: 100px;"></textarea><br><br>
          <label>Brand Colors (Hex):</label><br>
          <input type="text" name="brand_colors" value="#2c3e50"><br><br>
          <label>Industry:</label><br>
          <input type="text" name="industry" placeholder="e.g. Electrician"><br><br>
          <label>Desired Subdomain:</label><br>
          <input type="text" name="subdomain" placeholder="mybusiness"><br><br>
          <button type="submit" style="padding: 1rem 2rem; background: #e05c1a; color: white; border: none;">Build My Site</button>
        </form>
      </body>
    </html>
  `);
});

// API: Onboarding Submission
app.post('/api/onboarding', async (req, res) => {
  const { lead_id, bio, brand_colors, industry, subdomain } = req.body;
  try {
    const result = await db.runAsync(
      "INSERT INTO clients (lead_id, bio, brand_colors, industry, subdomain, site_status) VALUES (?, ?, ?, ?, ?, 'building')",
      [lead_id, bio, brand_colors, industry, subdomain]
    );
    const clientId = result.lastID;
    
    // Trigger Devin immediately
    devin.buildSite(clientId);
    
    res.send("Onboarding complete! Your site is being built. We will email you shortly.");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API: Lead Capture Submission (from client pages)
app.post('/api/leads/capture', async (req, res) => {
  const { lead_id, name, email, phone, message } = req.body;
  console.log(`[LEAD CAPTURE] Received contact from client-site for lead_id ${lead_id}: ${name} (${email})`);
  
  if (!lead_id || !name || !email) {
    return res.status(400).json({ error: 'Missing required fields: lead_id, name, email' });
  }

  try {
    // Save to interactions table as a client lead capture notification
    await db.runAsync(
      "INSERT INTO interactions (lead_id, agent, direction, content) VALUES (?, 'SYSTEM', 'inbound', ?)",
      [lead_id, `📩 Captured New Client Lead:
Name: ${name}
Email: ${email}
Phone: ${phone || 'N/A'}
Message: ${message || 'N/A'}`]
    );
    
    res.json({ success: true, message: 'Lead captured successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Aggregate Metrics
app.get('/api/metrics', async (req, res) => {
  try {
    const metrics = await db.getAggregateMetrics();
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Recent Leads
app.get('/api/leads/recent', (req, res) => {
  db.all("SELECT * FROM leads ORDER BY last_contacted_at DESC NULLS LAST, id DESC LIMIT 10", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API: Agent Logs
app.get('/api/logs', (req, res) => {
  db.all("SELECT * FROM interactions ORDER BY created_at DESC LIMIT 20", (err, rows) => {
    if (err) return res.json([]);
    res.json(rows.map(r => ({
      agent: r.agent,
      message: r.content,
      created_at: r.created_at
    })));
  });
});

// Stripe Webhook (Simulation)
app.post('/webhook/stripe', async (req, res) => {
  const { lead_id, amount } = req.body;
  console.log(`[STRIPE] Payment received for lead ${lead_id}: $${amount}`);
  
  await db.runAsync("UPDATE leads SET status = 'converted' WHERE id = ?", [lead_id]);
  await db.upsertMetrics('revenue', amount);
  await db.upsertMetrics('conversions', 1);

  // Send onboarding link
  db.run("INSERT INTO interactions (lead_id, agent, direction, content) VALUES (?, 'Sam', 'outbound', ?)",
    [lead_id, `Payment received! Please complete your onboarding here: https://57c921b14b31dd4ab771f1d6cdfaa42e.ctonew.app/onboarding?lead_id=${lead_id}`]);

  res.sendStatus(200);
});

// API: Submit Support Request (public-facing for clients)
app.post('/api/support', async (req, res) => {
  const { client_id, request_type, details, email } = req.body;
  if (!client_id || !request_type || !details) {
    return res.status(400).json({ error: 'Missing required fields: client_id, request_type, details' });
  }
  const validTypes = ['edit_text', 'swap_image', 'layout_tweak'];
  if (!validTypes.includes(request_type)) {
    return res.status(400).json({ error: `Invalid request_type. Must be one of: ${validTypes.join(', ')}` });
  }
  try {
    const client = await db.getAsync("SELECT * FROM clients WHERE id = ?", [client_id]);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const result = await db.runAsync(
      "INSERT INTO support_requests (client_id, request_type, details, status) VALUES (?, ?, ?, 'open')",
      [client_id, request_type, details]
    );

    db.run("INSERT INTO interactions (lead_id, agent, direction, content) VALUES (?, ?, 'inbound', ?)",
      [client.lead_id, 'Max', `New support request #${result.lastID}: [${request_type}] ${details}`]);

    console.log(`[SUPPORT] Request #${result.lastID} submitted by client #${client_id} (${request_type})`);
    res.json({ success: true, request_id: result.lastID, message: 'Support request received. Max will process it shortly.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: List support requests for a client
app.get('/api/support/:client_id', async (req, res) => {
  try {
    const rows = await db.allAsync(
      "SELECT * FROM support_requests WHERE client_id = ? ORDER BY created_at DESC",
      [req.params.client_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: List all open support requests (admin)
app.get('/api/support', async (req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT sr.*, c.subdomain, l.business_name 
       FROM support_requests sr 
       JOIN clients c ON sr.client_id = c.id 
       JOIN leads l ON c.lead_id = l.id 
       ORDER BY sr.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Page: Support Request Form (public)
app.get('/support', (req, res) => {
  const clientId = req.query.client_id || '';
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Request Support | DualLeadGen AI</title>
    <style>
        :root {
            --dark-navy: #0F0F1E;
            --burnt-orange: #E05C1A;
            --light-gray: #B0B0C8;
            --gold: #C9A84C;
        }
        body {
            font-family: 'Segoe UI', sans-serif;
            background-color: var(--dark-navy);
            color: white;
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            max-width: 600px;
            width: 100%;
            padding: 2rem;
        }
        .card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(176, 176, 200, 0.15);
            border-radius: 12px;
            padding: 2.5rem;
        }
        h1 {
            color: var(--gold);
            margin-top: 0;
            font-size: 1.8rem;
        }
        .subtitle {
            color: var(--light-gray);
            margin-bottom: 2rem;
            font-size: 0.95rem;
        }
        label {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--light-gray);
            font-size: 0.9rem;
        }
        input, select, textarea {
            width: 100%;
            padding: 0.8rem;
            margin-bottom: 1.5rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(176, 176, 200, 0.2);
            border-radius: 6px;
            color: white;
            font-size: 1rem;
            box-sizing: border-box;
        }
        select option {
            background: #1a1a2e;
            color: white;
        }
        textarea {
            min-height: 100px;
            resize: vertical;
        }
        .help-text {
            font-size: 0.8rem;
            color: var(--light-gray);
            margin-top: -1.2rem;
            margin-bottom: 1.5rem;
        }
        .btn {
            background: var(--burnt-orange);
            color: white;
            padding: 1rem 2rem;
            border: none;
            border-radius: 6px;
            font-size: 1.1rem;
            cursor: pointer;
            width: 100%;
            font-weight: bold;
        }
        .btn:hover {
            background: #f06a2a;
        }
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .status-msg {
            margin-top: 1.5rem;
            padding: 1rem;
            border-radius: 6px;
            display: none;
        }
        .status-msg.success {
            display: block;
            background: rgba(46, 204, 113, 0.15);
            border: 1px solid #2ecc71;
            color: #2ecc71;
        }
        .status-msg.error {
            display: block;
            background: rgba(231, 76, 60, 0.15);
            border: 1px solid #e74c3c;
            color: #e74c3c;
        }
        .back-link {
            display: block;
            margin-top: 1.5rem;
            text-align: center;
            color: var(--light-gray);
            text-decoration: none;
            font-size: 0.9rem;
        }
        .back-link:hover { color: var(--gold); }
        .examples {
            background: rgba(255,255,255,0.03);
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1.5rem;
            font-size: 0.85rem;
            color: var(--light-gray);
        }
        .examples strong { color: var(--gold); }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>🔧 Request Support</h1>
            <p class="subtitle">Submit a change request and Max (AI Tech Support) will process it automatically within seconds.</p>

            <div class="examples">
                <strong>Examples by type:</strong><br>
                • <strong>Edit Text:</strong> Change 'Expert Solutions' to 'Best Electricians'<br>
                • <strong>Swap Image:</strong> Swap 'logo.png' with 'new-logo.png'<br>
                • <strong>Layout Tweak:</strong> Increase padding / Change background to #f0f0f0 / Increase font size
            </div>

            <form id="supportForm">
                <label for="client_id">Client ID</label>
                <input type="number" id="client_id" name="client_id" value="${clientId}" placeholder="e.g. 1" required>

                <label for="request_type">Request Type</label>
                <select id="request_type" name="request_type" required>
                    <option value="">-- Select --</option>
                    <option value="edit_text">Edit Text</option>
                    <option value="swap_image">Swap Image</option>
                    <option value="layout_tweak">Layout Tweak</option>
                </select>

                <label for="details">Details</label>
                <textarea id="details" name="details" placeholder="Describe the change you want..." required></textarea>
                <div class="help-text">Be specific: "Change 'Old Text' to 'New Text'"</div>

                <label for="email">Your Email (for confirmation)</label>
                <input type="email" id="email" name="email" placeholder="owner@example.com">

                <button type="submit" class="btn" id="submitBtn">Submit Request</button>
            </form>

            <div id="statusMsg" class="status-msg"></div>
            <a href="/" class="back-link">← Back to Home</a>
        </div>
    </div>

    <script>
        document.getElementById('supportForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('submitBtn');
            const status = document.getElementById('statusMsg');
            btn.disabled = true;
            btn.textContent = 'Submitting...';

            try {
                const res = await fetch('/api/support', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        client_id: parseInt(document.getElementById('client_id').value),
                        request_type: document.getElementById('request_type').value,
                        details: document.getElementById('details').value,
                        email: document.getElementById('email').value
                    })
                });
                const data = await res.json();
                if (res.ok) {
                    status.className = 'status-msg success';
                    status.textContent = '✅ ' + data.message + ' (Request #' + data.request_id + ')';
                    document.getElementById('supportForm').reset();
                } else {
                    status.className = 'status-msg error';
                    status.textContent = '❌ Error: ' + data.error;
                }
            } catch (err) {
                status.className = 'status-msg error';
                status.textContent = '❌ Network error: ' + err.message;
            }

            btn.disabled = false;
            btn.textContent = 'Submit Request';
        });

        // Auto-fill type hints
        document.getElementById('request_type').addEventListener('change', function() {
            const hints = {
                'edit_text': "Change 'Old Heading' to 'New Heading'",
                'swap_image': "Swap 'logo.png' with 'new-logo.png'",
                'layout_tweak': "Increase padding, Change background to #f0f0f0, Center align, Increase font size"
            };
            if (this.value && hints[this.value]) {
                document.getElementById('details').placeholder = hints[this.value];
            }
        });
    </script>
</body>
</html>
  `);
});

// Cron: Automated Text-Back Upsell (30 days after live)
setInterval(async () => {
  try {
    const clients = await db.allAsync("SELECT * FROM clients WHERE site_status = 'live' AND last_upsell_at IS NULL AND created_at < date('now', '-30 days')");
    for (const client of clients) {
      const upsellMsg = "Your site has been live for 30 days! Ready to capture more leads? Activate our 'Missed-Call Text-Back Engine' for just $49/mo. Reactivate here: https://buy.stripe.com/test_upsell";
      db.run("INSERT INTO interactions (lead_id, agent, direction, content) VALUES (?, 'Sam', 'outbound', ?)",
        [client.lead_id, upsellMsg]);
      db.run("UPDATE clients SET last_upsell_at = CURRENT_TIMESTAMP WHERE id = ?", [client.id]);
    }
  } catch (err) {
    console.error('[CRON] Upsell error:', err.message);
  }
}, 3600000); // Every hour

app.listen(port, '0.0.0.0', () => {
  console.log(`DualLeadGen AI Server running at http://0.0.0.0:${port}`);
});
