// renderer.js - setup wizard actions binding

const form = document.getElementById('config-form');
const serverUrlInput = document.getElementById('serverUrl');
const apiKeyInput = document.getElementById('apiKey');

const statusLabel = document.getElementById('status-label');
const statusDot = document.getElementById('status-dot');
const successBanner = document.getElementById('success-banner');
const jobLog = document.getElementById('job-log');
const btnTest = document.getElementById('btn-test');

// 2. Load Config on startup
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const config = await window.api.getConfig();
    if (config) {
      serverUrlInput.value = config.serverUrl || 'http://localhost:3000';
      apiKeyInput.value = config.apiKey || '';
    }
  } catch (err) {
    console.error('Failed to load local config:', err);
  }
});

// 3. Save Config
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const config = {
    serverUrl: serverUrlInput.value,
    apiKey: apiKeyInput.value,
  };

  try {
    await window.api.saveConfig(config);
    successBanner.style.display = 'block';
    setTimeout(() => {
      successBanner.style.display = 'none';
    }, 3000);
  } catch (err) {
    alert('Failed to save settings: ' + err.message);
  }
});

// 4. Test Print
btnTest.addEventListener('click', async () => {
  try {
    btnTest.innerText = 'Printing...';
    btnTest.disabled = true;
    await window.api.triggerTestPrint();
    btnTest.innerText = 'Send Local Test Print';
    btnTest.disabled = false;
    alert('Test print ticket sent to local print spool.');
  } catch (err) {
    btnTest.innerText = 'Send Local Test Print';
    btnTest.disabled = false;
    alert('Local printing failed: ' + err.message);
  }
});

// 5. Connect Status update listeners from main electron IPC
window.api.onConnectionStatus((data) => {
  statusLabel.innerHTML = `<span class="status-dot ${data.status}"></span> ${data.msg}`;
  const dot = document.getElementById('status-dot');
  if (data.status === 'online') {
    dot.classList.add('online');
  } else {
    dot.classList.remove('online');
  }
});

// 6. Log entry hook
let jobLogsList = [];
window.api.onNewJobLog((data) => {
  jobLogsList.unshift(data); // Prepend new log
  if (jobLogsList.length > 10) jobLogsList.pop(); // keep last 10 entries

  jobLog.innerHTML = jobLogsList.map((log) => `
    <div class="job-entry">
      <span><strong>Order ID:</strong> ${log.orderId.substring(0, 8)}...</span>
      <span><strong>Job:</strong> ${log.jobId.substring(0, 8)}...</span>
      <span style="color: var(--primary);">${log.timestamp}</span>
    </div>
  `).join('');
});
