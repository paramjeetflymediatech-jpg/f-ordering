'use client';

import React, { useState, useEffect } from 'react';
import { 
  Printer as PrinterIcon, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Check, 
  Play, 
  Settings2,
  FileText,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';

interface Printer {
  id: string;
  name: string;
  role: string;
  type: 'usb' | 'network';
  connection_value: string;
  copies: number;
  width: '80mm' | '58mm';
  auto_cut: boolean;
  open_drawer: boolean;
  api_key: string;
  status: 'online' | 'offline';
  last_seen_at: string | null;
  last_printed_at: string | null;
}

interface PrintJob {
  id: string;
  store_id: string;
  printer_id: string;
  order_id: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  attempts: number;
  error_message: string | null;
  printed_at: string | null;
  createdAt: string;
  Printer?: { name: string; role: string };
  Order?: { order_number: string; total_amount: string };
}

export default function PrintersPage() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPrinterName, setNewPrinterName] = useState('');
  const [newPrinterRole, setNewPrinterRole] = useState('Kitchen Printer');
  const [newPrinterType, setNewPrinterType] = useState<'usb' | 'network'>('network');
  const [newConnectionValue, setNewConnectionValue] = useState('');
  const [newCopies, setNewCopies] = useState(1);
  const [newWidth, setNewWidth] = useState<'80mm' | '58mm'>('80mm');
  const [newAutoCut, setNewAutoCut] = useState(true);
  const [newOpenDrawer, setNewOpenDrawer] = useState(false);

  // Key display state
  const [newlyCreatedKey, setNewlyCreatedKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Poll intervals
  useEffect(() => {
    fetchPrinters();
    const interval = setInterval(fetchPrinters, 5000); // refresh status every 5s
    return () => clearInterval(interval);
  }, []);

  const downloadConfigFile = (apiKey: string) => {
    const configData = {
      serverUrl: window.location.origin,
      apiKey: apiKey,
    };
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fetchPrinters = async () => {
    try {
      const res = await fetch('/api/dashboard/printers');
      const data = await res.json();
      if (data.success) {
        setPrinters(data.printers || []);
        setPrintJobs(data.printJobs || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/dashboard/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPrinterName,
          role: newPrinterRole,
          type: newPrinterType,
          connection_value: newConnectionValue,
          copies: newCopies,
          width: newWidth,
          auto_cut: newAutoCut,
          open_drawer: newOpenDrawer,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewlyCreatedKey(data.printer.api_key);
        setSuccessMsg('Printer registered successfully! Please copy the API key below.');
        fetchPrinters();
        // Reset inputs
        setNewPrinterName('');
        setNewConnectionValue('');
        setNewCopies(1);
      } else {
        setError(data.error || 'Failed to add printer');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    }
  };

  const handleDeletePrinter = async (id: string) => {
    if (!confirm('Are you sure you want to remove this printer configuration?')) return;
    try {
      const res = await fetch(`/api/dashboard/printers?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchPrinters();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestPrint = async (printerId: string) => {
    try {
      const res = await fetch('/api/dashboard/printers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: printerId }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Test print job created. The agent will process it shortly.');
        fetchPrinters();
      } else {
        alert('Test print failed: ' + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (loading && printers.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-white max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <PrinterIcon className="h-6 w-6 text-orange-500" /> Cloud Printer Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure standalone desktop printer agents to route food category orders directly to physical kitchen or bar thermal hardware.
          </p>
        </div>
        <button
          onClick={() => {
            setNewlyCreatedKey('');
            setShowAddModal(true);
          }}
          className="rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition flex items-center gap-2 shadow-lg shadow-orange-950/20"
        >
          <Plus className="h-4 w-4" /> Add Printer
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Live Printers Monitor */}
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">Registered Printer Stations</h2>

            {printers.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                <PrinterIcon className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-bold">No printer stations added yet.</p>
                <p className="text-xs text-slate-600 mt-1">Add a printer configuration to start printing order receipts.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {printers.map((printer) => (
                  <div 
                    key={printer.id} 
                    className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-3 relative group overflow-hidden"
                  >
                    {/* Status Top corner */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-black text-sm text-white">{printer.name}</h3>
                        <p className="text-[10px] text-orange-500 font-mono mt-0.5">{printer.role}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 ${
                        printer.status === 'online' 
                          ? 'bg-emerald-950/40 border border-emerald-900/40 text-emerald-400' 
                          : 'bg-slate-900 border border-slate-800 text-slate-500'
                      }`}>
                        {printer.status === 'online' ? (
                          <>
                            <Wifi className="h-2.5 w-2.5" /> Online
                          </>
                        ) : (
                          <>
                            <WifiOff className="h-2.5 w-2.5" /> Offline
                          </>
                        )}
                      </span>
                    </div>

                    {/* Meta stats */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-[10px] text-slate-500">
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-600">Type</span>
                        <span className="font-bold text-slate-300 capitalize">{printer.type} ({printer.connection_value})</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-600">Width</span>
                        <span className="font-bold text-slate-300">{printer.width} / {printer.copies} Copies</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[8px] uppercase tracking-wider text-slate-600">Last Seen</span>
                        <span className="font-bold text-slate-300">
                          {printer.last_seen_at ? new Date(printer.last_seen_at).toLocaleString() : 'Never'}
                        </span>
                      </div>
                    </div>

                    {/* Actions panel */}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-900 gap-2">
                      <button
                        onClick={() => handleTestPrint(printer.id)}
                        disabled={printer.status !== 'online'}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-orange-600/10 border border-orange-500/20 text-orange-500 hover:bg-orange-500/20 transition text-[10px] font-bold flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Play className="h-3 w-3" /> Test Print
                      </button>

                      <button
                        onClick={() => downloadConfigFile(printer.api_key)}
                        title="Download config.json helper file"
                        className="py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-orange-500 hover:bg-slate-850 hover:text-orange-400 transition text-[10px] font-bold flex items-center gap-1 shrink-0"
                      >
                        📥 Config
                      </button>

                      <button
                        onClick={() => handleDeletePrinter(printer.id)}
                        className="py-1.5 px-2 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/30 transition text-[10px] shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Configuration Guides */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
            <h2 className="text-sm font-black text-white">How does it work?</h2>
            <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <p>1. <strong>Configure:</strong> Add a printer profile selecting the correct role name (e.g. <i>Kitchen Printer</i>).</p>
              <p>2. <strong>Download Agent:</strong> Launch the desktop printing agent application on a PC inside your outlet.</p>
              <p>3. <strong>Connect:</strong> Input your store identifier and the unique secure API key into the agent config wizard.</p>
              <p>4. <strong>Automated Ticket Feeds:</strong> The backend worker automatically groups orders by category print roles and feeds matching print tickets directly to the agent over WebSockets.</p>
            </div>
          </div>
        </div>

        {/* Recent Print Jobs Log */}
        <div className="xl:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 max-h-[750px] overflow-y-auto">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Recent Jobs Log</span>
            <button 
              onClick={fetchPrinters} 
              className="text-slate-500 hover:text-white transition"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </h2>

          <div className="space-y-3">
            {printJobs.length === 0 ? (
              <p className="text-xs text-slate-600 py-6 text-center italic">No jobs logged in the current session.</p>
            ) : (
              printJobs.map((job) => (
                <div key={job.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      {job.Order?.order_number || 'Mock Test'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                      job.status === 'completed'
                        ? 'bg-emerald-950/20 text-emerald-400'
                        : job.status === 'failed'
                        ? 'bg-red-950/20 text-red-400'
                        : 'bg-orange-950/20 text-orange-400'
                    }`}>
                      {job.status}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Target: {job.Printer?.name || 'Unassigned'}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {job.error_message && (
                    <p className="text-[9px] text-red-400 bg-red-950/15 p-1 rounded font-mono break-all">
                      Error: {job.error_message}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Printer Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0c101b] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <PrinterIcon className="h-5 w-5 text-orange-500" /> Add Printer Configuration
              </h3>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" /> {successMsg}
              </div>
            )}

            {newlyCreatedKey ? (
              <div className="space-y-4 py-2">
                <div className="rounded-xl bg-orange-950/10 border border-orange-500/20 p-4 space-y-2">
                  <span className="block text-[10px] font-bold text-orange-400 uppercase tracking-wider">Secure API Key Token</span>
                  <div className="flex items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-xs select-all">
                    <span>{newlyCreatedKey}</span>
                    <button
                      onClick={() => copyToClipboard(newlyCreatedKey)}
                      className="text-slate-400 hover:text-white transition shrink-0"
                    >
                      {copiedKey ? <Check className="h-4.5 w-4.5 text-emerald-400" /> : <Copy className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1 leading-relaxed">
                    Copy and save this key token now! It will not be shown again.
                  </p>

                  <div className="pt-2.5 border-t border-slate-900 mt-2 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold">1-Click Auto Config:</span>
                    <button
                      onClick={() => downloadConfigFile(newlyCreatedKey)}
                      className="rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 px-3 py-1.5 text-[10px] text-orange-500 font-bold transition flex items-center gap-1.5"
                    >
                      📥 Download config.json
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-full rounded-xl bg-orange-600 hover:bg-orange-500 py-3 text-xs font-bold text-white transition"
                >
                  Finished & Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddPrinter} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 font-bold block mb-2">Printer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kitchen Epson T88"
                      value={newPrinterName}
                      onChange={(e) => setNewPrinterName(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-2">Category Print Role *</label>
                    <select
                      value={newPrinterRole}
                      onChange={(e) => setNewPrinterRole(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                    >
                      <option value="Kitchen Printer">Kitchen Printer (Mains/Hot Items)</option>
                      <option value="Bar Desk Printer">Bar Desk Printer (Drinks)</option>
                      <option value="Dessert Printer">Dessert Printer (Desserts)</option>
                      <option value="Receipt Printer">Receipt Printer (All items)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 font-bold block mb-2">Connection Type</label>
                    <select
                      value={newPrinterType}
                      onChange={(e) => setNewPrinterType(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none"
                    >
                      <option value="network">LAN Network Printer</option>
                      <option value="usb">USB Connected Printer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-2">
                      {newPrinterType === 'network' ? 'IP Address / Domain *' : 'Local Printer Profile Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={newPrinterType === 'network' ? 'e.g. 192.168.1.150' : 'e.g. EPSON_TM_T88IV'}
                      value={newConnectionValue}
                      onChange={(e) => setNewConnectionValue(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 font-bold block mb-2">Copies Count</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      required
                      value={newCopies}
                      onChange={(e) => setNewCopies(parseInt(e.target.value))}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-2">Paper Width</label>
                    <select
                      value={newWidth}
                      onChange={(e) => setNewWidth(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none"
                    >
                      <option value="80mm">Standard 80mm Roll</option>
                      <option value="58mm">Compact 58mm Roll</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-6 py-2 border-t border-slate-900">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newAutoCut}
                      onChange={(e) => setNewAutoCut(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-orange-500 focus:ring-0"
                    />
                    <span className="text-[11px] font-bold text-slate-300">Enable Auto Cut paper</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newOpenDrawer}
                      onChange={(e) => setNewOpenDrawer(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-orange-500 focus:ring-0"
                    />
                    <span className="text-[11px] font-bold text-slate-300">Open Cash Drawer on print</span>
                  </label>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-1/2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 py-3 text-xs font-bold text-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 rounded-xl bg-orange-600 hover:bg-orange-500 py-3 text-xs font-bold text-white transition"
                  >
                    Register Station
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
