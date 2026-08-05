import { io } from 'socket.io-client';
import fs from 'fs';
import path from 'path';

// Load config.json if present, or parse command line arguments
let apiKey = '';
let serverUrl = 'http://localhost:3000';

const configPath = path.join(process.cwd(), 'config.json');
if (fs.existsSync(configPath)) {
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed.apiKey) apiKey = parsed.apiKey;
    if (parsed.serverUrl) serverUrl = parsed.serverUrl;
  } catch (err) {
    console.warn('Failed to parse config.json');
  }
}

// Check CLI flags --key=prn_... --url=http://localhost:3000
process.argv.forEach((arg) => {
  if (arg.startsWith('--key=')) {
    apiKey = arg.replace('--key=', '');
  }
  if (arg.startsWith('--url=')) {
    serverUrl = arg.replace('--url=', '');
  }
});

if (!apiKey) {
  console.error('Error: API Key is required!');
  console.log('Usage: npx tsx scripts/printer-agent.ts --key=YOUR_PRINTER_API_KEY');
  process.exit(1);
}

console.log(`Connecting Printer Agent to ${serverUrl} with API Key: ${apiKey}...`);
const socket = io(serverUrl);

socket.on('connect', () => {
  console.log(` Connected to FlyMedia POS Server (Socket ID: ${socket.id})`);
  socket.emit('printer:register', { apiKey, name: 'Local Desktop Agent' });
});

socket.on('printer:registered', (res: any) => {
  if (res.success) {
    console.log(` Printer registered successfully! Station ID: ${res.printerId}`);
    console.log(' Station Config:', res.config);
    console.log(' Waiting for print jobs...');
  } else {
    console.error(` Registration failed: ${res.error}`);
  }
});

socket.on('print:new-order', (data: any) => {
  console.log(` Received new print job! Job ID: ${data.jobId}, Order ID: ${data.orderId}`);
  
  // Simulate physical thermal receipt printing delay
  setTimeout(() => {
    console.log(` Receipt printed & cut successfully for job: ${data.jobId}`);
    socket.emit('printer:acknowledge', {
      printJobId: data.jobId,
      status: 'success',
    });
  }, 1000);
});

socket.on('disconnect', () => {
  console.warn(' Disconnected from server. Reconnecting...');
});
