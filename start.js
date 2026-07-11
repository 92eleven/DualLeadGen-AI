const { spawn } = require('child_process');
const path = require('path');

console.log('--- Starting DualLeadGen AI 4-Agent Ecosystem ---');

// 1. Start Web Server (Express)
const server = spawn('node', [path.join(__dirname, 'index.js')], { stdio: 'inherit' });

// 2. Start Agent Alex (Growth Specialist)
const alex = spawn('node', [path.join(__dirname, 'scripts/Alex.js')], { stdio: 'inherit' });

// 3. Start Agent Sam (Client Success)
const sam = spawn('node', [path.join(__dirname, 'scripts/Sam.js')], { stdio: 'inherit' });

// 4. Start Agent Max (Tech Support)
const max = spawn('node', [path.join(__dirname, 'scripts/Max.js')], { stdio: 'inherit' });

// Agent Devin is triggered by HTTP/Webhook, so no persistent process needed here
// unless we want it to poll something. Devin is imported in index.js.

console.log('[SYSTEM] 4-Agent Ecosystem Online.');

process.on('SIGINT', () => {
  server.kill();
  alex.kill();
  sam.kill();
  max.kill();
  process.exit();
});
