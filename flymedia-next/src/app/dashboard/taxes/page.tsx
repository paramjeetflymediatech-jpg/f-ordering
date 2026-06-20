'use client';

import React, { useState, useEffect } from 'react';
import { useSession as useAuthSession } from 'next-auth/react';
import {
  Percent,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Briefcase,
  Layers,
  Edit,
  Save,
  X
} from 'lucide-react';

export default function TaxesPage() {
  const { data: session } = useAuthSession();
  const [loading, setLoading] = useState(true);
  const [taxRate, setTaxRate] = useState('10.00'); // GST standard default
  const [additionalTaxes, setAdditionalTaxes] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Additional taxes form fields
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newType, setNewType] = useState<'Percentage' | 'Fixed'>('Percentage');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    // Load local config
    const savedRate = localStorage.getItem('primaryTaxRate');
    if (savedRate) {
      setTaxRate(savedRate);
    }
    const savedAdditional = localStorage.getItem('additionalTaxes');
    if (savedAdditional) {
      setAdditionalTaxes(JSON.parse(savedAdditional));
    } else {
      const defaults = [
        { id: 't_1', name: 'Service Charge', rate: 5.00, type: 'Percentage', description: 'Applied for dine-in operations' },
        { id: 't_2', name: 'Container Surcharge', rate: 1.50, type: 'Fixed', description: 'Applied for takeaway/delivery packaging' }
      ];
      setAdditionalTaxes(defaults);
      localStorage.setItem('additionalTaxes', JSON.stringify(defaults));
    }
    setLoading(false);
  }, []);

  const triggerAlert = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleSavePrimaryTax = () => {
    const rateVal = parseFloat(taxRate);
    if (isNaN(rateVal) || rateVal < 0 || rateVal > 100) {
      triggerAlert('Primary tax rate must be a valid percentage between 0 and 100.', true);
      return;
    }
    localStorage.setItem('primaryTaxRate', rateVal.toFixed(2));
    triggerAlert('Primary location tax rate updated successfully.');
  };

  const handleAddTax = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newRate) return;

    const rateVal = parseFloat(newRate);
    if (isNaN(rateVal) || rateVal < 0) {
      triggerAlert('Tax rate/fee must be a positive number.', true);
      return;
    }

    const newItem = {
      id: 'tax_' + Date.now(),
      name: newName,
      rate: rateVal,
      type: newType,
      description: newType === 'Percentage' ? `${rateVal}% surcharge fee` : `$${rateVal.toFixed(2)} fixed surcharge`
    };

    const updated = [...additionalTaxes, newItem];
    setAdditionalTaxes(updated);
    localStorage.setItem('additionalTaxes', JSON.stringify(updated));
    setShowAddModal(false);
    setNewName('');
    setNewRate('');
    triggerAlert('Additional tax rate rule added successfully.');
  };

  const handleDeleteTax = (id: string) => {
    if (!confirm('Are you sure you want to delete this tax rule?')) return;
    const updated = additionalTaxes.filter(t => t.id !== id);
    setAdditionalTaxes(updated);
    localStorage.setItem('additionalTaxes', JSON.stringify(updated));
    triggerAlert('Tax rule deleted.');
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full text-slate-200">
      
      {/* ALERTS */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-500 text-white px-4 py-3 shadow-xl">
          <CheckCircle className="h-5 w-5" />
          <span className="text-xs font-bold">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-red-500 text-white px-4 py-3 shadow-xl">
          <AlertCircle className="h-5 w-5" />
          <span className="text-xs font-bold">{errorMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Percent className="h-6 w-6 text-orange-500 animate-pulse" />
            Taxes & Fees
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure primary sales taxes (GST/VAT) and custom hospitality service charge adjustments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Card: Primary Tax Setting */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-[#0c101b] p-6 space-y-6 self-start shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-orange-500" />
              Primary Store Tax
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Primary sales tax applied automatically at checkout.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-slate-400 font-bold block mb-1.5 text-[11px]">Primary Tax Name</label>
              <input
                type="text"
                readOnly
                value="GST / VAT"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5 text-xs text-slate-500 outline-none cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1.5 text-[11px]">Tax Rate Percentage (%)</label>
              <div className="flex items-center rounded-xl bg-slate-950 border border-slate-850 px-3 py-1">
                <input
                  type="number"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full bg-transparent border-none outline-none font-bold text-white text-xs"
                />
                <span className="text-xs text-slate-500 font-extrabold">%</span>
              </div>
            </div>

            <button
              onClick={handleSavePrimaryTax}
              className="w-full rounded-xl bg-orange-600 py-3 text-xs font-bold text-white hover:bg-orange-500 transition shadow flex items-center justify-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              Update Surcharge
            </button>
          </div>
        </div>

        {/* Right Card: Additional Surcharges / Fees */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-[#0c101b] p-6 space-y-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Briefcase className="h-4.5 w-4.5 text-sky-500" />
                Additional Fees & Rules
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Custom surcharge rules applied during ordering flows.</p>
            </div>

            <button
              onClick={() => {
                setNewName('');
                setNewRate('');
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-orange-600/10 border border-orange-500/20 text-[#f59e0b] hover:bg-orange-500/20 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Rule
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-500 font-bold">
                  <th className="p-4">Fee Rule Name</th>
                  <th className="p-4 text-center">Type</th>
                  <th className="p-4 text-right">Value</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody>
                {additionalTaxes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-650 font-bold">No additional tax/fee rules configured.</td>
                  </tr>
                ) : (
                  additionalTaxes.map((t) => (
                    <tr key={t.id} className="border-b border-slate-900 text-slate-300 hover:bg-slate-900/10">
                      <td className="p-4 font-bold text-white">{t.name}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-slate-950 px-2.5 py-0.5 text-[10px] text-slate-400 font-bold border border-slate-850">
                          {t.type}
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-[#f59e0b]">
                        {t.type === 'Percentage' ? `${t.rate.toFixed(2)}%` : `$${t.rate.toFixed(2)}`}
                      </td>
                      <td className="p-4 text-slate-500">{t.description}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteTax(t.id)}
                          className="rounded-lg bg-red-950/40 p-2 text-red-400 hover:bg-red-900/40 border border-red-950/50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Add Tax Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white">Add Surcharge Rule</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddTax} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend Surcharge"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Rule Type</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400 outline-none"
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 10"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <button type="submit" className="w-full mt-4 rounded-xl bg-orange-600 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition">
                Create Surcharge Rule
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
