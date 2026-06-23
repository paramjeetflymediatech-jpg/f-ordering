'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Truck,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Search,
  Building,
  FileText,
  DollarSign,
  Calendar,
  Layers,
  ChevronRight,
  X
} from 'lucide-react';

export default function SuppliersPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'suppliers' | 'pos'>('suppliers');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showAddPOModal, setShowAddPOModal] = useState(false);

  // Forms fields
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supCategory, setSupCategory] = useState('Ingredients');

  const [poSupplierId, setPoSupplierId] = useState('');
  const [poAmount, setPoAmount] = useState('');
  const [poNotes, setPoNotes] = useState('');

  const seedMockData = () => {
    const mockSups = [
      { id: 's_1', name: 'Fresh Produce Wholesale', phone: '+61 29876543', email: 'orders@freshwholesale.com.au', address: '42 Market St, Sydney', category: 'Vegetables & Fruits' },
      { id: 's_2', name: 'Prime Meat Supplies', phone: '+61 23456789', email: 'sales@primemeat.com.au', address: '12 Butcher Rd, Parramatta', category: 'Meats' },
      { id: 's_3', name: 'Dairy & Co.', phone: '+61 24445555', email: 'info@dairyandco.com', address: '88 Milk Ave, Newcastle', category: 'Dairy Products' },
      { id: 's_4', name: 'Global Packaging Ltd', phone: '+61 27778888', email: 'support@globalpack.com', address: '105 Industrial Pkwy, Penrith', category: 'Packaging' }
    ];

    const mockPOs = [
      { id: 'po_1', po_number: 'PO-2026-001', supplier_name: 'Fresh Produce Wholesale', issue_date: '2026-06-18', amount: 450.00, status: 'Received' },
      { id: 'po_2', po_number: 'PO-2026-002', supplier_name: 'Prime Meat Supplies', issue_date: '2026-06-19', amount: 1200.00, status: 'Pending' },
      { id: 'po_3', po_number: 'PO-2026-003', supplier_name: 'Dairy & Co.', issue_date: '2026-06-20', amount: 350.00, status: 'Pending' }
    ];

    return { mockSups, mockPOs };
  };

  useEffect(() => {
    if (!session || !(session.user as any)?.store_id) return;

    const storeId = (session.user as any).store_id;
    const supsKey = `suppliersConfig_${storeId}`;
    const posKey = `purchaseOrdersConfig_${storeId}`;

    const savedSups = localStorage.getItem(supsKey);
    const savedPOs = localStorage.getItem(posKey);

    if (savedSups) {
      setSuppliers(JSON.parse(savedSups));
    } else {
      setSuppliers([]);
      localStorage.setItem(supsKey, JSON.stringify([]));
    }

    if (savedPOs) {
      setPurchaseOrders(JSON.parse(savedPOs));
    } else {
      setPurchaseOrders([]);
      localStorage.setItem(posKey, JSON.stringify([]));
    }
    setLoading(false);
  }, [session]);

  const triggerAlert = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Add Supplier
  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim() || !supPhone.trim()) return;

    const newSup = {
      id: 'sup_' + Date.now(),
      name: supName,
      phone: supPhone,
      email: supEmail || '—',
      address: supAddress || '—',
      category: supCategory
    };

    const storeId = (session?.user as any)?.store_id || 'default';
    const supsKey = `suppliersConfig_${storeId}`;

    const updated = [...suppliers, newSup];
    setSuppliers(updated);
    localStorage.setItem(supsKey, JSON.stringify(updated));
    setShowAddSupplierModal(false);
    clearSupplierForm();
    triggerAlert('Supplier profile created successfully.');
  };

  // Add Purchase Order
  const handleAddPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId || !poAmount) return;

    const supplier = suppliers.find(s => s.id === poSupplierId);
    if (!supplier) return;

    const amountVal = parseFloat(poAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      triggerAlert('Amount must be a valid positive number.', true);
      return;
    }

    const newPO = {
      id: 'po_' + Date.now(),
      po_number: `PO-2026-00${purchaseOrders.length + 1}`,
      supplier_name: supplier.name,
      issue_date: new Date().toISOString().split('T')[0],
      amount: amountVal,
      status: 'Pending'
    };

    const storeId = (session?.user as any)?.store_id || 'default';
    const posKey = `purchaseOrdersConfig_${storeId}`;

    const updated = [...purchaseOrders, newPO];
    setPurchaseOrders(updated);
    localStorage.setItem(posKey, JSON.stringify(updated));
    setShowAddPOModal(false);
    setPoSupplierId('');
    setPoAmount('');
    setPoNotes('');
    triggerAlert('Purchase Order issued successfully.');
  };

  const handleDeleteSupplier = (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    
    const storeId = (session?.user as any)?.store_id || 'default';
    const supsKey = `suppliersConfig_${storeId}`;

    const updated = suppliers.filter(s => s.id !== id);
    setSuppliers(updated);
    localStorage.setItem(supsKey, JSON.stringify(updated));
    triggerAlert('Supplier deleted.');
  };

  const handleUpdatePOStatus = (id: string, newStatus: 'Received' | 'Cancelled') => {
    const storeId = (session?.user as any)?.store_id || 'default';
    const posKey = `purchaseOrdersConfig_${storeId}`;

    const updated = purchaseOrders.map(po => {
      if (po.id === id) {
        return { ...po, status: newStatus };
      }
      return po;
    });
    setPurchaseOrders(updated);
    localStorage.setItem(posKey, JSON.stringify(updated));
    triggerAlert(`Purchase Order status updated to: ${newStatus}`);
  };

  const clearSupplierForm = () => {
    setSupName('');
    setSupPhone('');
    setSupEmail('');
    setSupAddress('');
    setSupCategory('Ingredients');
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPOs = purchaseOrders.filter(po => 
    po.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    po.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Truck className="h-6 w-6 text-orange-500 animate-pulse" />
            Suppliers & Purchase Orders
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage ingredient suppliers, logistics, warehousing, purchase orders (PO), and stock intakes.
          </p>
        </div>
      </div>

      {/* TOGGLE TABS */}
      <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-800 rounded-2xl">
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveTab('suppliers');
            }}
            className={`rounded-xl px-4 py-2.5 font-bold uppercase tracking-wider border transition flex items-center gap-1.5 ${
              activeTab === 'suppliers'
                ? 'bg-orange-600 border-orange-500 text-white shadow'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Building className="h-4 w-4" />
            Manage Suppliers ({suppliers.length})
          </button>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveTab('pos');
            }}
            className={`rounded-xl px-4 py-2.5 font-bold uppercase tracking-wider border transition flex items-center gap-1.5 ${
              activeTab === 'pos'
                ? 'bg-orange-600 border-orange-500 text-white shadow'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4" />
            Purchase Orders ({purchaseOrders.length})
          </button>
        </div>

        <button
          onClick={() => {
            if (activeTab === 'suppliers') {
              clearSupplierForm();
              setShowAddSupplierModal(true);
            } else {
              if (suppliers.length === 0) {
                triggerAlert('Please add a supplier first.', true);
                return;
              }
              setPoSupplierId(suppliers[0].id);
              setPoAmount('');
              setShowAddPOModal(true);
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition shadow"
        >
          <Plus className="h-4 w-4" />
          {activeTab === 'suppliers' ? 'Add Supplier' : 'New Purchase Order'}
        </button>
      </div>

      {/* SEARCH FILTER */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder={activeTab === 'suppliers' ? 'Search by Supplier Name, Phone or Category...' : 'Search by PO Number or Supplier Name...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
        />
      </div>

      {/* LIST CONTENT */}
      {activeTab === 'suppliers' ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-500 font-bold">
                  <th className="p-4">Supplier Name</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Address</th>
                  <th className="p-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-500 font-bold">Loading suppliers...</td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-650 font-bold">No suppliers found.</td>
                  </tr>
                ) : (
                  filteredSuppliers.map((s) => (
                    <tr key={s.id} className="border-b border-slate-900 text-slate-300 hover:bg-slate-900/10">
                      <td className="p-4 font-bold text-white flex items-center gap-2">
                        <Building className="h-4 w-4 text-orange-500" />
                        {s.name}
                      </td>
                      <td className="p-4 font-semibold text-slate-400">{s.phone}</td>
                      <td className="p-4 text-slate-400">{s.email}</td>
                      <td className="p-4">
                        <span className="inline-flex rounded-full bg-slate-950 border border-slate-850 px-2.5 py-0.5 font-semibold text-slate-300">
                          {s.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 max-w-[200px] truncate" title={s.address}>{s.address}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteSupplier(s.id)}
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
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-500 font-bold">
                  <th className="p-4">PO Number</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Issue Date</th>
                  <th className="p-4 text-right">Total Amount</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Update Order</th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-650 font-bold">No purchase orders found.</td>
                  </tr>
                ) : (
                  filteredPOs.map((po) => (
                    <tr key={po.id} className="border-b border-slate-900 text-slate-300 hover:bg-slate-900/10">
                      <td className="p-4 font-mono font-bold text-white">{po.po_number}</td>
                      <td className="p-4 font-bold text-slate-400">{po.supplier_name}</td>
                      <td className="p-4 font-mono text-slate-550 flex items-center gap-1.5 mt-2.5">
                        <Calendar className="h-3.5 w-3.5 text-orange-500" />
                        {po.issue_date}
                      </td>
                      <td className="p-4 text-right font-black text-white">${po.amount.toFixed(2)}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase border ${
                          po.status === 'Received'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                            : po.status === 'Cancelled'
                            ? 'bg-red-500/10 text-red-500 border-red-500/25'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/25'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {po.status === 'Pending' ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdatePOStatus(po.id, 'Received')}
                              className="rounded-lg bg-emerald-950/40 px-2 py-1 text-emerald-400 hover:bg-emerald-900/40 border border-emerald-950/50 text-[10px] font-bold uppercase tracking-wider transition"
                            >
                              Receive
                            </button>
                            <button
                              onClick={() => handleUpdatePOStatus(po.id, 'Cancelled')}
                              className="rounded-lg bg-red-950/40 px-2 py-1 text-red-400 hover:bg-red-900/40 border border-red-950/50 text-[10px] font-bold uppercase tracking-wider transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white">Add Supplier Profile</h3>
              <button onClick={() => setShowAddSupplierModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddSupplier} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prime Meat Supplies"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +61 23456789"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Category</label>
                  <select
                    value={supCategory}
                    onChange={(e) => setSupCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400 outline-none"
                  >
                    <option value="Ingredients">Ingredients & Food</option>
                    <option value="Packaging">Packaging supplies</option>
                    <option value="Beverages">Drinks & Beverages</option>
                    <option value="Equipment">Kitchen Hardware</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Order E-mail</label>
                <input
                  type="email"
                  placeholder="e.g. orders@primemeat.com.au"
                  value={supEmail}
                  onChange={(e) => setSupEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Supplier Address</label>
                <input
                  type="text"
                  placeholder="e.g. 12 Butcher Rd, Parramatta"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none"
                />
              </div>
              <button type="submit" className="w-full mt-4 rounded-xl bg-orange-600 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition">
                Create Supplier Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add PO Modal */}
      {showAddPOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white">Issue Purchase Order</h3>
              <button onClick={() => setShowAddPOModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddPO} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Select Supplier *</label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400 outline-none"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Total Order Amount ($) *</label>
                <div className="flex items-center rounded-xl bg-slate-950 border border-slate-850 px-3 py-1">
                  <span className="text-slate-500 font-bold mr-1">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 500"
                    value={poAmount}
                    onChange={(e) => setPoAmount(e.target.value)}
                    className="w-full bg-transparent border-none outline-none font-bold text-white text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Purchase Order Notes</label>
                <textarea
                  placeholder="Items list, delivery preferences, billing terms..."
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white h-20 outline-none resize-none"
                />
              </div>
              <button type="submit" className="w-full mt-4 rounded-xl bg-orange-600 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition">
                Issue Purchase Order
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
