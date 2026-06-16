'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Table,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  AlertCircle,
  Users,
  Search,
  RefreshCw,
  QrCode,
  CheckCircle,
  Info,
  Calendar,
  Lock,
} from 'lucide-react';

interface RestaurantTableType {
  id: string;
  organization_id: string;
  store_id: string;
  table_number: string;
  seating_capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  qr_code_token: string | null;
}

export default function TableManagerPage() {
  const { data: session } = useSession();

  const [tables, setTables] = useState<RestaurantTableType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals & Selected items
  const [activeModal, setActiveModal] = useState<'add' | 'edit' | 'delete' | 'qr' | null>(null);
  const [selectedTable, setSelectedTable] = useState<RestaurantTableType | null>(null);

  // Form States
  const [formTableNumber, setFormTableNumber] = useState('');
  const [formCapacity, setFormCapacity] = useState('4');
  const [formStatus, setFormStatus] = useState<'available' | 'occupied' | 'reserved' | 'cleaning'>('available');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/tables');
      const data = await res.json();
      if (data.success) {
        setTables(data.tables || []);
      } else {
        setError(data.message || 'Failed to retrieve tables.');
      }
    } catch (err) {
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const openAddModal = () => {
    setFormTableNumber('');
    setFormCapacity('4');
    setFormStatus('available');
    setActionError(null);
    setActiveModal('add');
  };

  const openEditModal = (table: RestaurantTableType) => {
    setSelectedTable(table);
    setFormTableNumber(table.table_number);
    setFormCapacity(table.seating_capacity.toString());
    setFormStatus(table.status);
    setActionError(null);
    setActiveModal('edit');
  };

  const openDeleteModal = (table: RestaurantTableType) => {
    setSelectedTable(table);
    setActionError(null);
    setActiveModal('delete');
  };

  const openQrModal = (table: RestaurantTableType) => {
    setSelectedTable(table);
    setActiveModal('qr');
  };

  const showTemporarySuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const handleAddTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTableNumber.trim()) return;

    try {
      setActionLoading(true);
      setActionError(null);

      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_number: formTableNumber,
          seating_capacity: parseInt(formCapacity, 10),
          status: formStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActiveModal(null);
        showTemporarySuccess(`Table "${formTableNumber}" successfully added.`);
        await fetchTables();
      } else {
        setActionError(data.message || 'Failed to create table.');
      }
    } catch (err) {
      setActionError('Network error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !formTableNumber.trim()) return;

    try {
      setActionLoading(true);
      setActionError(null);

      const res = await fetch(`/api/tables/${selectedTable.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_number: formTableNumber,
          seating_capacity: parseInt(formCapacity, 10),
          status: formStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActiveModal(null);
        showTemporarySuccess(`Table "${formTableNumber}" successfully updated.`);
        await fetchTables();
      } else {
        setActionError(data.message || 'Failed to update table.');
      }
    } catch (err) {
      setActionError('Network error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTableSubmit = async () => {
    if (!selectedTable) return;

    try {
      setActionLoading(true);
      setActionError(null);

      const res = await fetch(`/api/tables/${selectedTable.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        setActiveModal(null);
        showTemporarySuccess(`Table "${selectedTable.table_number}" successfully deleted.`);
        await fetchTables();
      } else {
        setActionError(data.message || 'Failed to delete table.');
      }
    } catch (err) {
      setActionError('Network error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  // Live Stats calculations
  const totalCount = tables.length;
  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const reservedCount = tables.filter((t) => t.status === 'reserved').length;
  const cleaningCount = tables.filter((t) => t.status === 'cleaning').length;

  const filteredTables = tables.filter((table) => {
    const matchesSearch = table.table_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || table.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeStyles = (status: RestaurantTableType['status']) => {
    switch (status) {
      case 'available':
        return 'border-emerald-500 bg-emerald-950/20 text-emerald-400';
      case 'occupied':
        return 'border-amber-500 bg-amber-950/20 text-amber-400';
      case 'reserved':
        return 'border-sky-500 bg-sky-950/20 text-sky-400';
      case 'cleaning':
        return 'border-purple-500 bg-purple-950/20 text-purple-400';
    }
  };

  const getQRUrl = (token: string | null) => {
    if (!token) return '';
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/order-online/f-ordering-foods/menu?table=${token}`;
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Table className="h-6 w-6 text-orange-500" />
            Table Layout Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure dining tables, track status states in real-time, and download customer QR ordering print cards.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchTables}
            className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 text-slate-400 hover:text-white transition"
            title="Refresh List"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition shadow-md shadow-orange-950/25"
          >
            <Plus className="h-4 w-4" />
            Add Table
          </button>
        </div>
      </div>

      {/* SUCCESS POPUP */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 px-4 py-3.5 text-xs font-bold text-emerald-400 flex items-center gap-2 shadow-xl shadow-emerald-950/5"
          >
            <CheckCircle className="h-4 w-4" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Total Tables</span>
          <span className="text-2xl font-black text-white mt-1.5">{totalCount}</span>
        </div>
        <div className="rounded-2xl border border-emerald-900/25 bg-emerald-950/5 p-4 shadow-xl flex flex-col justify-between">
          <span className="text-[10px] text-emerald-500/80 font-extrabold uppercase tracking-wider">Available</span>
          <span className="text-2xl font-black text-emerald-400 mt-1.5">{availableCount}</span>
        </div>
        <div className="rounded-2xl border border-amber-900/25 bg-amber-950/5 p-4 shadow-xl flex flex-col justify-between">
          <span className="text-[10px] text-amber-500/80 font-extrabold uppercase tracking-wider">Occupied</span>
          <span className="text-2xl font-black text-amber-400 mt-1.5">{occupiedCount}</span>
        </div>
        <div className="rounded-2xl border border-sky-900/25 bg-sky-950/5 p-4 shadow-xl flex flex-col justify-between">
          <span className="text-[10px] text-sky-500/80 font-extrabold uppercase tracking-wider">Reserved</span>
          <span className="text-2xl font-black text-sky-400 mt-1.5">{reservedCount}</span>
        </div>
        <div className="rounded-2xl border border-purple-900/25 bg-purple-950/5 p-4 shadow-xl flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-[10px] text-purple-500/80 font-extrabold uppercase tracking-wider">Cleaning</span>
          <span className="text-2xl font-black text-purple-400 mt-1.5">{cleaningCount}</span>
        </div>
      </div>

      {/* FILTER & CONTROL BAR */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-slate-800 border bg-slate-900/30 p-4 rounded-2xl">
        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {['all', 'available', 'occupied', 'reserved', 'cleaning'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition capitalize ${
                statusFilter === status
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-950/20'
                  : 'bg-slate-950/50 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by table number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
          />
        </div>
      </div>

      {/* TABLES GRID CONTAINER */}
      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
          <p className="mt-4 text-xs text-slate-400 font-medium">Loading store tables...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-900/30 bg-red-950/5 p-6 text-center text-red-400 flex flex-col items-center justify-center">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p className="text-sm font-bold">{error}</p>
          <button
            onClick={fetchTables}
            className="mt-4 rounded-xl bg-red-950/40 border border-red-900/30 px-4 py-2 text-xs font-bold hover:bg-red-900/40 transition"
          >
            Retry Fetch
          </button>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl">
          <Table className="h-12 w-12 text-slate-700 stroke-[1.5] mx-auto mb-2" />
          <p className="text-sm font-extrabold text-white">No dining tables found</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'No tables match your active search filter settings.'
              : 'Add tables to configure your layout configuration, track dining status, and prepare QR ordering.'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button
              onClick={openAddModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition"
            >
              <Plus className="h-4 w-4" />
              Create First Table
            </button>
          )}
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {filteredTables.map((table) => (
            <motion.div
              layout
              key={table.id}
              whileHover={{ y: -3, scale: 1.01 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 flex flex-col justify-between hover:border-slate-700/80 transition duration-200 shadow-lg"
            >
              <div className="space-y-4">
                {/* Card Top */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-base text-white">{table.table_number}</h3>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-500" />
                      <span>{table.seating_capacity} Seats</span>
                    </div>
                  </div>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider ${getStatusBadgeStyles(
                      table.status
                    )}`}
                  >
                    {table.status}
                  </span>
                </div>

                {/* Simulated Visual Table Preview */}
                <div className="h-20 bg-slate-950/40 rounded-xl border border-slate-800/40 flex items-center justify-center relative overflow-hidden group">
                  <div
                    className={`absolute inset-0 opacity-10 bg-gradient-to-br transition duration-300 ${
                      table.status === 'available'
                        ? 'from-emerald-500'
                        : table.status === 'occupied'
                        ? 'from-amber-500'
                        : table.status === 'reserved'
                        ? 'from-sky-500'
                        : 'from-purple-500'
                    }`}
                  />
                  <div
                    className={`w-10 h-10 border-2 transition rounded-xl flex items-center justify-center ${
                      table.status === 'available'
                        ? 'border-emerald-500/40 bg-emerald-950/20'
                        : table.status === 'occupied'
                        ? 'border-amber-500/40 bg-amber-950/20'
                        : table.status === 'reserved'
                        ? 'border-sky-500/40 bg-sky-950/20'
                        : 'border-purple-500/40 bg-purple-950/20'
                    }`}
                  >
                    <Table className="h-5 w-5 text-slate-500" />
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="flex gap-2 mt-5 pt-4 border-t border-slate-800/60 justify-end">
                {table.qr_code_token && (
                  <button
                    onClick={() => openQrModal(table)}
                    className="rounded-xl border border-slate-800 bg-slate-950/50 p-2.5 text-slate-400 hover:text-white transition"
                    title="QR Code Scan Card"
                  >
                    <QrCode className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => openEditModal(table)}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-2.5 text-slate-400 hover:text-white transition"
                  title="Edit Table"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openDeleteModal(table)}
                  className="rounded-xl border border-red-950/30 bg-red-950/10 p-2.5 text-red-400 hover:bg-red-900/30 transition"
                  title="Delete Table"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* MODALS */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative"
            >
              {/* MODAL HEADER */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  {activeModal === 'add' && <Plus className="h-4.5 w-4.5 text-orange-500" />}
                  {activeModal === 'edit' && <Edit2 className="h-4.5 w-4.5 text-orange-500" />}
                  {activeModal === 'delete' && <Trash2 className="h-4.5 w-4.5 text-red-500" />}
                  {activeModal === 'qr' && <QrCode className="h-4.5 w-4.5 text-orange-500" />}
                  {activeModal === 'add' && 'Add New Table'}
                  {activeModal === 'edit' && 'Edit Table'}
                  {activeModal === 'delete' && 'Delete Table'}
                  {activeModal === 'qr' && 'QR Ordering Card'}
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* ACTION ERRORS */}
              {actionError && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/15 p-3 text-xs font-semibold text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* FORM - ADD / EDIT */}
              {(activeModal === 'add' || activeModal === 'edit') && (
                <form
                  onSubmit={activeModal === 'add' ? handleAddTableSubmit : handleEditTableSubmit}
                  className="mt-4 space-y-4 text-xs"
                >
                  <div>
                    <label className="text-slate-400 font-bold uppercase tracking-wide">Table Number / Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Table 6 or Patio 2"
                      value={formTableNumber}
                      onChange={(e) => setFormTableNumber(e.target.value)}
                      className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 font-bold uppercase tracking-wide">Seating Capacity</label>
                      <select
                        value={formCapacity}
                        onChange={(e) => setFormCapacity(e.target.value)}
                        className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((num) => (
                          <option key={num} value={num.toString()}>
                            {num} Seats
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 font-bold uppercase tracking-wide">Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition capitalize"
                      >
                        {['available', 'occupied', 'reserved', 'cleaning'].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full mt-6 rounded-xl bg-orange-600 py-3 text-xs font-bold text-white hover:bg-orange-500 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    {activeModal === 'add' ? 'Create Table' : 'Save Changes'}
                  </button>
                </form>
              )}

              {/* MODAL - DELETE CONFIRM */}
              {activeModal === 'delete' && selectedTable && (
                <div className="mt-4 space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Are you sure you want to delete <span className="font-bold text-white">"{selectedTable.table_number}"</span>? All history and configurations linked to this table in the dashboard will be removed.
                  </p>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setActiveModal(null)}
                      className="flex-1 py-3 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteTableSubmit}
                      disabled={actionLoading}
                      className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-500 transition flex items-center justify-center gap-1.5"
                    >
                      {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                      Delete Table
                    </button>
                  </div>
                </div>
              )}

              {/* MODAL - QR SCAN CARD */}
              {activeModal === 'qr' && selectedTable && (
                <div className="mt-4 space-y-5 text-center">
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Customers scan this card to review menus and order instantly at their table. Right-click code or print to distribute.
                  </p>

                  {/* SCAN CARD DISPLAY */}
                  <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-xs mx-auto border border-slate-200 text-slate-900 flex flex-col items-center">
                    {/* Brand */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center">
                        <span className="text-[10px] font-black italic text-white leading-none">T</span>
                      </div>
                      <span className="text-xs font-extrabold tracking-wider uppercase">F-Ordering</span>
                    </div>

                    {/* Dining location */}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                      Main Dining Floor
                    </span>
                    <h4 className="text-xl font-black text-slate-900 mt-1">{selectedTable.table_number}</h4>

                    {/* QR Code container */}
                    <div className="my-5 w-44 h-44 border border-slate-100 rounded-xl p-3 bg-slate-50 flex items-center justify-center">
                      {/* Generates a live, scan-ready QR code using QRServer API */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                          getQRUrl(selectedTable.qr_code_token)
                        )}`}
                        alt="Table QR Code"
                        className="w-full h-full"
                      />
                    </div>

                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Scan to Order
                    </p>
                    <span className="text-[8px] text-slate-400 break-all leading-normal px-2 select-all">
                      {getQRUrl(selectedTable.qr_code_token)}
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        const win = window.open();
                        if (win) {
                          win.document.write(`
                            <html>
                              <head>
                                <title>Print Table Card - ${selectedTable.table_number}</title>
                                <style>
                                  body {
                                    font-family: system-ui, -apple-system, sans-serif;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    height: 100vh;
                                    margin: 0;
                                    background: #f8fafc;
                                  }
                                  .card {
                                    background: white;
                                    border: 1px solid #e2e8f0;
                                    border-radius: 24px;
                                    padding: 32px;
                                    text-align: center;
                                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
                                    width: 280px;
                                  }
                                  .brand {
                                    font-size: 14px;
                                    font-weight: 800;
                                    letter-spacing: 1px;
                                    text-transform: uppercase;
                                    color: #ea580c;
                                    margin-bottom: 4px;
                                  }
                                  .location {
                                    font-size: 10px;
                                    font-weight: 700;
                                    color: #94a3b8;
                                    text-transform: uppercase;
                                    letter-spacing: 1.5px;
                                  }
                                  .table-num {
                                    font-size: 28px;
                                    font-weight: 900;
                                    margin: 8px 0 24px;
                                    color: #0f172a;
                                  }
                                  .qr-box {
                                    width: 180px;
                                    height: 180px;
                                    border: 1px solid #f1f5f9;
                                    background: #f8fafc;
                                    border-radius: 16px;
                                    padding: 12px;
                                    margin: 0 auto 24px;
                                  }
                                  .qr-img {
                                    width: 100%;
                                    height: 100%;
                                  }
                                  .scan-lbl {
                                    font-size: 10px;
                                    font-weight: 800;
                                    letter-spacing: 2px;
                                    text-transform: uppercase;
                                    color: #64748b;
                                  }
                                </style>
                              </head>
                              <body>
                                <div class="card">
                                  <div class="brand">F-Ordering</div>
                                  <div class="location">Main Dining Floor</div>
                                  <div class="table-num">${selectedTable.table_number}</div>
                                  <div class="qr-box">
                                    <img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                                      getQRUrl(selectedTable.qr_code_token)
                                    )}" />
                                  </div>
                                  <div class="scan-lbl">Scan to Order</div>
                                </div>
                                <script>
                                  window.onload = function() {
                                    window.print();
                                  }
                                </script>
                              </body>
                            </html>
                          `);
                          win.document.close();
                        }
                      }}
                      className="w-full py-3 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition"
                    >
                      Print Scan Card
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
