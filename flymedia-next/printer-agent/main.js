const { app, BrowserWindow, Menu, Tray, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');
const https = require('https');
const { io } = require('socket.io-client');
const Store = require('electron-store');

const store = new Store();
let mainWindow;
let tray;
let socket;
let isQuitting = false;
let heartbeatInterval;

// 1. Electron app lifecycle
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 600,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'icon.png'),
  });

  mainWindow.loadFile('index.html');

  // Handle window close by hiding instead of closing (tray minimization)
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Config Wizard',
      click: () => {
        mainWindow.show();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit Agent',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Fly-POS Printer Agent');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

app.whenReady().then(() => {
  // Create dummy icon file if not present for tray/taskbar validation
  const iconPath = path.join(__dirname, 'icon.png');
  if (!fs.existsSync(iconPath)) {
    fs.writeFileSync(iconPath, ''); // Empty file just as placeholder
  }

  createWindow();
  createTray();

  // Auto-import local config.json file if placed in the app directory
  try {
    const localConfigPath = path.join(process.cwd(), 'config.json');
    if (fs.existsSync(localConfigPath)) {
      console.log('[Agent] Found local config.json. Auto-importing details...');
      const fileData = fs.readFileSync(localConfigPath, 'utf8');
      const parsed = JSON.parse(fileData);
      if (parsed.apiKey) {
        const serverUrl = parsed.serverUrl || 'http://localhost:3000';
        store.set('printerConfig', {
          serverUrl,
          apiKey: parsed.apiKey
        });
        console.log('[Agent] Auto-imported configuration successfully.');
        // Delete the file to prevent token exposure
        fs.unlinkSync(localConfigPath);
      }
    }
  } catch (err) {
    console.error('[Agent] Failed to auto-import config.json:', err.message);
  }

  // Load configured keys on boot and initialize sockets
  const config = store.get('printerConfig');
  if (config && config.apiKey) {
    connectToCloudServer(config);
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

// Cache for active printer configuration sent by server database
let activePrinterConfig = null;

// 2. Cloud Server & Socket.IO client handlers
function connectToCloudServer(config) {
  if (socket) {
    socket.disconnect();
  }

  const serverUrl = config.serverUrl || 'http://localhost:3000';
  console.log(`[Agent] Connecting to Socket.IO server: ${serverUrl}`);

  socket = io(serverUrl, {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
  });

  socket.on('connect', () => {
    console.log('[Agent] WebSocket Connected. Registering printer station...');
    socket.emit('printer:register', {
      apiKey: config.apiKey,
      name: config.printerName || 'FlyPOS Terminal Agent',
    });
  });

  socket.on('printer:registered', (data) => {
    if (data.success) {
      console.log('[Agent] Printer agent registered and verified by server. ID:', data.printerId);
      mainWindow.webContents.send('connection-status', { status: 'online', msg: 'Online & Connected to Cloud' });
      
      // Store dynamic config from database
      activePrinterConfig = data.config;
      console.log('[Agent] Received printer configuration from server:', activePrinterConfig);

      // Start 30s heartbeat checks
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      heartbeatInterval = setInterval(() => {
        socket.emit('printer:heartbeat');
      }, 30000);
    } else {
      console.error('[Agent] Registration rejected by server:', data.error);
      mainWindow.webContents.send('connection-status', { status: 'offline', msg: `Rejected: ${data.error}` });
    }
  });

  // 3. New Print Job Event
  socket.on('print:new-order', async (data) => {
    console.log('[Agent] Received print ticket event payload:', data);
    const { jobId, orderId } = data;

    mainWindow.webContents.send('new-job-log', { jobId, orderId, timestamp: new Date().toLocaleTimeString() });

    try {
      if (!activePrinterConfig) {
        throw new Error('Printer configuration not received from server yet.');
      }

      // Fetch details from REST API
      const receiptData = await fetchReceiptData(serverUrl, orderId, config.apiKey);
      console.log('[Agent] Receipt details fetched successfully:', receiptData.orderNumber);

      // Compile raw ESC/POS formatting using the server configuration
      const escPosData = compileEscPosCommands(receiptData, activePrinterConfig);

      // Print output using the server configuration
      await printToHardware(escPosData, activePrinterConfig);

      // Acknowledge print success back to server
      socket.emit('printer:acknowledge', { printJobId: jobId, status: 'success' });
      console.log('[Agent] Job acknowledged successfully.');
    } catch (err) {
      console.error('[Agent] Printing failed:', err.message);
      socket.emit('printer:acknowledge', { printJobId: jobId, status: 'failed', error: err.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('[Agent] WebSocket Disconnected.');
    mainWindow.webContents.send('connection-status', { status: 'offline', msg: 'Offline - Attempting reconnect...' });
    if (heartbeatInterval) clearInterval(heartbeatInterval);
  });

  socket.on('connect_error', (error) => {
    console.error('[Agent] WebSocket Connection error:', error.message);
    mainWindow.webContents.send('connection-status', { status: 'offline', msg: 'Connection Error' });
  });
}

// 4. REST Fetch Helper
function fetchReceiptData(serverUrl, orderId, apiKey) {
  return new Promise((resolve, reject) => {
    const url = `${serverUrl}/api/printing/orders/${orderId}`;
    const options = {
      headers: {
        'x-printer-token': apiKey,
        'Accept': 'application/json',
      }
    };

    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch receipt. Status: ${res.statusCode}`));
      }

      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.success) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error || 'Server returned failure'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// 5. ESC/POS Ticket Layout Compiler
function compileEscPosCommands(receipt, config) {
  const ESC = '\x1b';
  const GS = '\x1d';
  const Initialize = ESC + '@';
  const BoldOn = ESC + 'E\x01';
  const BoldOff = ESC + 'E\x00';
  const CenterAlign = ESC + 'a\x01';
  const LeftAlign = ESC + 'a\x00';
  const RightAlign = ESC + 'a\x02';

  let bin = Initialize;

  // Drawer kick
  if (config.openDrawer) {
    bin += ESC + 'p\x00\x19\xfa'; // standard drawer kick sequence
  }

  // Header Title
  bin += CenterAlign + BoldOn + `${receipt.restaurantName}\n` + BoldOff;
  bin += `${receipt.restaurantAddress}\n`;
  bin += `Ph: ${receipt.restaurantPhone}\n\n`;

  // Order Info
  bin += LeftAlign + BoldOn + `ORDER: ${receipt.orderNumber}\n` + BoldOff;
  bin += `Date: ${new Date(receipt.date).toLocaleString()}\n`;
  bin += `Type: ${receipt.orderType.toUpperCase()}\n`;
  if (receipt.tableNumber) {
    bin += `Table assignment: ${receipt.tableNumber}\n`;
  }
  bin += `Customer: ${receipt.customerName}\n`;
  bin += '--------------------------------\n';

  // Items List
  (receipt.items || []).forEach((item) => {
    const qty = item.quantity;
    const name = item.name;
    const priceStr = `$${parseFloat(item.price * qty).toFixed(2)}`;
    
    bin += `${qty}x ${name.padEnd(20)} ${priceStr}\n`;
    if (item.variant) {
      bin += `   Variant: ${item.variant}\n`;
    }
    if (item.addons && item.addons.length > 0) {
      bin += `   + Addons: ${item.addons.join(', ')}\n`;
    }
    if (item.notes) {
      bin += `   Note: ${item.notes}\n`;
    }
  });

  bin += '--------------------------------\n';

  // Totals
  bin += RightAlign;
  bin += `Subtotal: $${parseFloat(receipt.subtotal).toFixed(2)}\n`;
  bin += `Tax: $${parseFloat(receipt.tax).toFixed(2)}\n`;
  bin += BoldOn + `GRAND TOTAL: $${parseFloat(receipt.total).toFixed(2)}\n` + BoldOff;
  bin += `Paid via: ${receipt.paymentMethod.toUpperCase()}\n\n`;

  // Footer
  bin += CenterAlign + 'THANK YOU FOR DINING WITH US!\n';
  bin += 'Powered by Fly-POS\n\n\n\n';

  // Auto Cut
  if (config.autoCut !== false) {
    bin += GS + 'V\x41\x03'; // paper cut feed command
  }

  return bin;
}

// 6. Print Job Dispatcher
function printToHardware(escPosData, config) {
  return new Promise((resolve, reject) => {
    const connectionType = config.connectionType || 'network';
    const connectionValue = config.connectionValue;

    if (connectionType === 'network') {
      console.log(`[Agent] Directing print raw payload to network printer: ${connectionValue}:9100`);
      const client = new net.Socket();
      client.setTimeout(5000);

      client.connect(9100, connectionValue, () => {
        client.write(escPosData, 'utf-8', () => {
          client.end();
          resolve();
        });
      });

      client.on('error', (err) => {
        client.destroy();
        reject(new Error(`Network printer unreachable: ${err.message}`));
      });

      client.on('timeout', () => {
        client.destroy();
        reject(new Error('Connection to network printer timed out'));
      });
    } else {
      // USB / Local Driver fallback: Write formatting to local spooler files
      console.log(`[Agent] Spooling to USB Connected local printer: ${connectionValue}`);
      try {
        const tempPath = path.join(app.getPath('temp'), `print_${Date.now()}.txt`);
        fs.writeFileSync(tempPath, escPosData, 'utf-8');

        // Spawn OS native print spooler pipelines
        const { exec } = require('child_process');
        let cmd = '';

        if (process.platform === 'win32') {
          // Send to standard Windows spool print
          cmd = `print /D:"${connectionValue}" "${tempPath}"`;
        } else if (process.platform === 'darwin' || process.platform === 'linux') {
          // Send to standard macOS/Linux CUPS printer queue
          cmd = `lpr -P "${connectionValue}" "${tempPath}"`;
        }

        exec(cmd, (err) => {
          // clean file asynchronously
          fs.unlink(tempPath, () => {});
          if (err) {
            return reject(new Error(`OS Spooler command failed: ${err.message}`));
          }
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    }
  });
}

// 7. IPC Messages from Setup Wizard Page
ipcMain.handle('save-config', async (event, config) => {
  store.set('printerConfig', config);
  connectToCloudServer(config);
  return { success: true };
});

ipcMain.handle('get-config', async () => {
  return store.get('printerConfig') || null;
});

ipcMain.handle('trigger-test-print', async (event) => {
  if (!activePrinterConfig) {
    throw new Error('Printer is offline or not registered by server. Please connect first.');
  }

  const testPayload = {
    restaurantName: 'TEST TERMINAL STAMP',
    restaurantAddress: '100 Silicon Loop, Sector 4',
    restaurantPhone: '+1 555-0199',
    orderNumber: 'TEST-9999',
    date: new Date().toISOString(),
    tableNumber: 'Table 9',
    customerName: 'Local Agent Test',
    orderType: 'dine_in',
    items: [
      { name: 'Margherita Pizza Test', quantity: 1, price: 15.00, addons: [], variant: '' }
    ],
    subtotal: 15.00,
    tax: 0.75,
    total: 15.75,
    paymentMethod: 'cash',
  };

  const escPosData = compileEscPosCommands(testPayload, activePrinterConfig);
  await printToHardware(escPosData, activePrinterConfig);
  return { success: true };
});
