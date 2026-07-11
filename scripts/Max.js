const db = require('./db');
const fs = require('fs');
const path = require('path');

class Max {
  constructor() {
    this.name = 'Max';
    this.role = 'AI Tech Support';
    this.outputDir = path.join(__dirname, '../public/clients');
    this.BASE_URL = 'https://57c921b14b31dd4ab771f1d6cdfaa42e.ctonew.app';
  }

  async monitorSupportRequests() {
    console.log(`[MAX] Self-healing maintenance loop active (polling every 15s)...`);
    setInterval(async () => {
      try {
        const requests = await db.allAsync(
          "SELECT * FROM support_requests WHERE status IN ('open', 'processing') ORDER BY created_at ASC"
        );
        for (const req of requests) {
          if (req.status === 'open') {
            await db.runAsync(
              "UPDATE support_requests SET status = 'processing' WHERE id = ? AND status = 'open'",
              [req.id]
            );
          }
          await this.processRequest(req);
        }
      } catch (err) {
        console.error(`[MAX] Monitor error: ${err.message}`);
      }
    }, 15000);
  }

  async processRequest(req) {
    console.log(`[MAX] Processing request #${req.id} (type: ${req.request_type}) for client #${req.client_id}...`);

    try {
      // 1. Load client info
      const client = await db.getAsync("SELECT * FROM clients WHERE id = ?", [req.client_id]);
      if (!client) throw new Error("Client not found");

      // 2. Load lead info for the business name and email
      const lead = await db.getAsync("SELECT business_name, email FROM leads WHERE id = ?", [client.lead_id]);

      // 3. Load the client site file
      const filePath = path.join(this.outputDir, `${client.subdomain}.html`);
      if (!fs.existsSync(filePath)) throw new Error(`Client site file not found: ${client.subdomain}.html`);

      let content = fs.readFileSync(filePath, 'utf8');
      let changeLog = '';

      // 4. Apply changes based on request_type
      if (req.request_type === 'edit_text') {
        // Format: "Change 'Old Text' to 'New Text'"
        changeLog = this._handleEditText(req, content, filePath);
      } else if (req.request_type === 'swap_image') {
        changeLog = this._handleSwapImage(req, content, filePath);
      } else if (req.request_type === 'layout_tweak') {
        changeLog = this._handleLayoutTweak(req, content, filePath);
      } else {
        throw new Error(`Unknown request type: ${req.request_type}`);
      }

      // 5. Mark the request as resolved
      await db.runAsync("UPDATE support_requests SET status = 'resolved' WHERE id = ?", [req.id]);

      console.log(`[MAX] ✅ Request #${req.id} resolved. ${changeLog}`);

      // 6. Log confirmation via interactions table (email-style confirmation)
      const businessName = lead ? lead.business_name : 'Your Business';
      const clientEmail = lead ? lead.email : 'client@example.com';
      const siteUrl = `${this.BASE_URL}/clients/${client.subdomain}.html`;

      db.run(
        "INSERT INTO interactions (lead_id, agent, direction, content) VALUES (?, ?, 'outbound', ?)",
        [client.lead_id, this.name,
          `✅ Support Request #${req.id} Resolved

Hi ${businessName},

Your support request has been completed by Max (AI Tech Support).

📋 Request: ${req.request_type}
📝 Details: ${req.details}
🔄 Change: ${changeLog}

View your updated site: ${siteUrl}

Need further help? Submit another request at: ${this.BASE_URL}/support

Best,
Max
AI Tech Support @ DualLeadGen AI`
        ]
      );

      // 7. Log system-level event
      console.log(`[MAX] Confirmation sent for request #${req.id} to ${clientEmail}`);

    } catch (err) {
      console.error(`[MAX] ❌ Failed to process request #${req.id}: ${err.message}`);
      await db.runAsync(
        "UPDATE support_requests SET status = 'open' WHERE id = ?",
        [req.id]
      );
    }
  }

  /**
   * Handle edit_text: expects "Change 'Old Text' to 'New Text'"
   */
  _handleEditText(req, content, filePath) {
    let newContent = content;
    let changeLog = 'No text changes applied';

    // Try format: Change 'Old Text' to 'New Text'
    const match = req.details.match(/Change\s+'([^']+)'\s+to\s+'([^']+)'/i);
    if (match) {
      const [_, oldText, newText] = match;
      const escapedOld = oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedOld, 'g');
      if (regex.test(newContent)) {
        newContent = content.replace(regex, newText);
        changeLog = `Changed "${oldText}" → "${newText}"`;
      } else {
        changeLog = `Text "${oldText}" not found on page`;
        console.log(`[MAX]  ⚠ edit_text: "${oldText}" not found in content`);
      }
    } else {
      changeLog = `Could not parse edit_text format. Expected: Change 'old' to 'new'. Got: "${req.details}"`;
      console.log(`[MAX]  ⚠ ${changeLog}`);
    }

    fs.writeFileSync(filePath, newContent);
    return changeLog;
  }

  /**
   * Handle swap_image: expects "Swap 'logo.png' with 'new-logo.png'" or similar
   */
  _handleSwapImage(req, content, filePath) {
    let newContent = content;
    let changeLog = 'No image swaps applied';

    // Format: Swap 'old-image.jpg' with 'new-image.jpg'
    const match = req.details.match(/Swap\s+'([^']+)'\s+with\s+'([^']+)'/i);
    if (match) {
      const [_, oldImage, newImage] = match;
      // Check if old image path exists in content
      if (content.includes(oldImage)) {
        newContent = content.replace(new RegExp(oldImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImage);
        changeLog = `Swapped image "${oldImage}" → "${newImage}"`;
      } else if (content.includes(`/${oldImage}`)) {
        newContent = content.replace(new RegExp(`/${oldImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), newImage);
        changeLog = `Swapped image "/${oldImage}" → "${newImage}"`;
      } else {
        changeLog = `Image "${oldImage}" not found on page`;
        console.log(`[MAX]  ⚠ swap_image: "${oldImage}" not found in content`);
      }
    } else {
      changeLog = `Could not parse swap_image format. Expected: Swap 'old.png' with 'new.png'. Got: "${req.details}"`;
      console.log(`[MAX]  ⚠ ${changeLog}`);
    }

    fs.writeFileSync(filePath, newContent);
    return changeLog;
  }

  /**
   * Handle layout_tweak: supports several layout adjustments
   * Format: "Increase padding" / "Change background to #hex" / "Center align" / etc.
   */
  _handleLayoutTweak(req, content, filePath) {
    let newContent = content;
    let changeLog = 'No layout changes applied';
    const detail = req.details.toLowerCase();

    if (detail.includes('increase padding') || detail.includes('more spacing')) {
      // Increase padding from 4rem to 6rem
      newContent = content.replace(/padding:\s*4rem\s+2rem;/g, 'padding: 6rem 3rem;');
      changeLog = 'Increased hero section padding';
    } else if (detail.includes('decrease padding') || detail.includes('less spacing')) {
      newContent = content.replace(/padding:\s*4rem\s+2rem;/g, 'padding: 2rem 1rem;');
      changeLog = 'Decreased hero section padding';
    } else if (detail.includes('background') || detail.includes('color')) {
      // Change background color: "Change background to #f0f0f0"
      const colorMatch = req.details.match(/(?:to|:)\s*(#[0-9a-fA-F]{3,6}|[a-z]+)/);
      if (colorMatch) {
        const newColor = colorMatch[1];
        newContent = content.replace(/background:\s*#[0-9a-fA-F]{3,6};/g, `background: ${newColor};`);
        newContent = newContent.replace(/background:\s*#[0-9a-fA-F]{6}\s*\n/g, `background: ${newColor};\n`);
        changeLog = `Changed background to ${newColor}`;
      }
    } else if (detail.includes('font') || detail.includes('text')) {
      // Change font size: "Increase font size" or "Change text size to 18px"
      const sizeMatch = req.details.match(/(\d+)px/);
      if (sizeMatch) {
        newContent = content.replace(/font-size:\s*[0-9.]+rem;/g, `font-size: ${parseInt(sizeMatch[1]) / 16}rem;`);
        changeLog = `Changed font size to ${sizeMatch[1]}px`;
      } else if (detail.includes('increase') || detail.includes('larger')) {
        newContent = content.replace(/font-size:\s*([0-9.]+)rem;/g, (match, size) => {
          return `font-size: ${parseFloat(size) * 1.2}rem;`;
        });
        changeLog = 'Increased font sizes by 20%';
      }
    } else if (detail.includes('center')) {
      newContent = content.replace(/text-align:\s*left;/g, 'text-align: center;');
      changeLog = 'Center-aligned text';
    } else {
      changeLog = `Unknown layout tweak: "${req.details}". Supported: padding, background, font, center alignment.`;
      console.log(`[MAX]  ⚠ ${changeLog}`);
    }

    fs.writeFileSync(filePath, newContent);
    return changeLog;
  }
}

const max = new Max();
max.monitorSupportRequests();
module.exports = max;
