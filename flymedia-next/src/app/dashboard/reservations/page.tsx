'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Calendar,
  Clock,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Plus,
  Table,
  Check,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User,
  Edit2,
  CalendarDays,
  Trash,
  Trash2
} from 'lucide-react';

export default function ReservationsPage() {
  const { data: session } = useSession();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'seated'>('all');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tablesList, setTablesList] = useState<any[]>([]);
  
  // New State for Calendar Feature
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'history'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // Modal Control States
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Selected state for Modals
  const [selectedCellTable, setSelectedCellTable] = useState<any | null>(null);
  const [selectedCellHour, setSelectedCellHour] = useState<number | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null);
  const [selectedReservationIds, setSelectedReservationIds] = useState<string[]>([]);

  // Form states for Quick Booking
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formGuestCount, setFormGuestCount] = useState(2);
  const [formTime, setFormTime] = useState('18:00');
  const [formDate, setFormDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formTableId, setFormTableId] = useState('');

  // Form states for Editing/Moving
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGuestCount, setEditGuestCount] = useState(2);
  const [editTime, setEditTime] = useState('18:00');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editTableId, setEditTableId] = useState('');
  const [editStatus, setEditStatus] = useState('');

  const HOURS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/reservations');
      const data = await res.json();
      if (res.ok && data.success) {
        setReservations(data.reservations);
      } else {
        triggerAlert(data.error || 'Failed to load reservations.', true);
      }
    } catch (err: any) {
      console.error(err);
      triggerAlert('Error occurred loading reservations.', true);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables');
      const data = await res.json();
      if (res.ok && data.success) {
        setTablesList(data.tables || []);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  };

  useEffect(() => {
    if (!session || !(session.user as any)?.store_id) return;
    fetchReservations();
    fetchTables();
  }, [session]);

  useEffect(() => {
    setSelectedReservationIds([]);
  }, [viewMode, statusFilter, searchQuery]);

  const triggerAlert = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'confirmed' | 'cancelled' | 'seated') => {
    try {
      const res = await fetch('/api/dashboard/reservations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setReservations(prev => 
          prev.map(r => r.id === id ? { ...r, status: newStatus } : r)
        );
        triggerAlert(`Reservation marked as ${newStatus}.`);
        fetchTables();
      } else {
        triggerAlert(data.error || 'Failed to update status.', true);
      }
    } catch (err: any) {
      console.error(err);
      triggerAlert('Network error updating status.', true);
    }
  };

  const handleAssignTable = async (id: string, tableId: string) => {
    try {
      const res = await fetch('/api/dashboard/reservations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, table_id: tableId }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const selectedTable = tablesList.find(t => t.id === tableId);
        setReservations(prev => 
          prev.map(r => r.id === id ? { 
            ...r, 
            table_id: tableId, 
            table_number: selectedTable ? selectedTable.table_number : 'Not Assigned' 
          } : r)
        );
        triggerAlert('Table assigned successfully.');
        fetchTables();
      } else {
        triggerAlert(data.error || 'Failed to assign table.', true);
      }
    } catch (err: any) {
      console.error(err);
      triggerAlert('Network error assigning table.', true);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this reservation record?')) return;

    try {
      const res = await fetch(`/api/dashboard/reservations?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerAlert(data.message || 'Reservation deleted successfully.');
        setSelectedReservationIds(prev => prev.filter(item => item !== id));
        fetchReservations();
        fetchTables();
      } else {
        triggerAlert(data.error || 'Failed to delete reservation.', true);
      }
    } catch (err: any) {
      console.error(err);
      triggerAlert('Network error deleting reservation.', true);
    }
  };

  const handleDeleteSelectedReservations = async () => {
    if (selectedReservationIds.length === 0) return;
    const confirmMsg = `Are you sure you want to permanently delete the ${selectedReservationIds.length} selected reservation(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/dashboard/reservations?id=${selectedReservationIds.join(',')}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerAlert(data.message || 'Selected reservations deleted successfully.');
        setSelectedReservationIds([]);
        fetchReservations();
        fetchTables();
      } else {
        triggerAlert(data.error || 'Failed to delete reservations.', true);
      }
    } catch (err: any) {
      console.error(err);
      triggerAlert('Network error deleting reservations.', true);
    }
  };

  const handleBulkDeleteHistory = async () => {
    if (statusFilter === 'all') {
      triggerAlert('Please select a specific status filter (e.g. SEATED or CANCELLED) to bulk delete history.', true);
      return;
    }

    const confirmMsg = `Are you sure you want to permanently delete ALL history records with status "${statusFilter.toUpperCase()}"? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/dashboard/reservations?status=${statusFilter}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerAlert(data.message || 'Selected history records deleted successfully.');
        fetchReservations();
        fetchTables();
      } else {
        triggerAlert(data.error || 'Failed to delete history.', true);
      }
    } catch (err: any) {
      console.error(err);
      triggerAlert('Network error deleting history.', true);
    }
  };

  const handleQuickBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone || !formDate || !formTime) {
      triggerAlert('Name, Phone, Date, and Time are required.', true);
      return;
    }

    try {
      // Bug 3 fix: send local datetime — do NOT call .toISOString() to avoid UTC shift
      const localISO = `${formDate}T${formTime}`;
      const payload = {
        customerName: formName,
        customerPhone: formPhone,
        customerEmail: formEmail,
        reservationTime: localISO,
        guestCount: formGuestCount,
        notes: formNotes,
        table_id: formTableId || null,
        status: 'confirmed',
      };

      const res = await fetch('/api/dashboard/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerAlert('Table reserved successfully!');
        setIsBookModalOpen(false);
        fetchReservations();
        fetchTables();
        
        setFormName('');
        setFormPhone('');
        setFormEmail('');
        setFormGuestCount(2);
        setFormNotes('');
      } else {
        triggerAlert(data.error || 'Failed to book reservation.', true);
      }
    } catch (err) {
      console.error(err);
      triggerAlert('Error booking reservation.', true);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservation) return;

    try {
      // Bug 3 fix: send local datetime — do NOT call .toISOString() to avoid UTC shift
      const localISO = `${editDate}T${editTime}`;
      const payload = {
        id: selectedReservation.id,
        status: editStatus,
        table_id: editTableId || null,
        reservation_time: localISO,
        guest_count: editGuestCount,
        notes: editNotes,
      };

      const res = await fetch('/api/dashboard/reservations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerAlert('Reservation updated successfully.');
        setIsEditModalOpen(false);
        fetchReservations();
        fetchTables();
      } else {
        triggerAlert(data.error || 'Failed to update reservation.', true);
      }
    } catch (err) {
      console.error(err);
      triggerAlert('Error updating reservation.', true);
    }
  };

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${ampm}`;
  };

  const openQuickBook = (table: any, hour: number) => {
    setSelectedCellTable(table);
    setSelectedCellHour(hour);
    
    setFormDate(selectedDate);
    setFormTime(`${String(hour).padStart(2, '0')}:00`);
    setFormTableId(table ? table.id : '');
    setFormGuestCount(table ? Math.min(table.seating_capacity, 4) : 2);
    
    setIsBookModalOpen(true);
  };

  const openEditModal = (res: any) => {
    setSelectedReservation(res);
    setEditName(res.guest_name);
    setEditPhone(res.guest_phone);
    setEditEmail(res.guest_email || '');
    setEditGuestCount(res.party_size);
    setEditNotes(res.notes || '');
    setEditTableId(res.table_id || '');
    setEditStatus(res.status);

    const [datePart, timePart] = res.reservation_time.split(' ');
    setEditDate(datePart);
    setEditTime(timePart ? timePart.slice(0, 5) : '18:00');

    setIsEditModalOpen(true);
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleJumpToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const getReservationsForCell = (tableId: string, hour: number) => {
    return reservations.filter(r => {
      if (r.table_id !== tableId) return false;
      if (r.status === 'cancelled') return false;

      const datePart = r.reservation_time.split(' ')[0];
      if (datePart !== selectedDate) return false;

      const timePart = r.reservation_time.split(' ')[1];
      if (!timePart) return false;

      const [h, m] = timePart.split(':').map(Number);
      const startMinutes = h * 60 + m;
      const endMinutes = startMinutes + 120;

      const cellStart = hour * 60;
      const cellEnd = (hour + 1) * 60;

      return startMinutes < cellEnd && endMinutes > cellStart;
    });
  };

  const isStartCell = (r: any, hour: number) => {
    const timePart = r.reservation_time.split(' ')[1];
    if (!timePart) return false;
    const [h] = timePart.split(':').map(Number);
    return hour === h;
  };

  const getReservationColor = (status: string) => {
    switch (status) {
      case 'seated':
        return 'bg-sky-500/20 text-sky-200 border-sky-500/30 hover:bg-sky-500/30';
      case 'confirmed':
        return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/30';
      case 'pending':
        return 'bg-amber-500/20 text-amber-200 border-amber-500/30 hover:bg-amber-500/30';
      default:
        return 'bg-slate-700/35 text-slate-300 border-slate-650 hover:bg-slate-700/50';
    }
  };

  const filteredReservations = reservations.filter(r => {
    const matchesSearch = 
      r.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.guest_phone.includes(searchQuery) ||
      (r.guest_email && r.guest_email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const unassignedBookings = reservations.filter(r => {
    const datePart = r.reservation_time.split(' ')[0];
    if (datePart !== selectedDate) return false;
    if (r.status === 'cancelled') return false;
    return !r.table_id || !tablesList.some(t => t.id === r.table_id);
  });

  const getMetrics = () => {
    const total = reservations.length;
    const pending = reservations.filter(r => r.status === 'pending').length;
    const confirmed = reservations.filter(r => r.status === 'confirmed').length;
    const cancelled = reservations.filter(r => r.status === 'cancelled').length;
    const seated = reservations.filter(r => r.status === 'seated').length;
    return { total, pending, confirmed, cancelled, seated };
  };

  const metrics = getMetrics();

  const sortedTables = [...tablesList].sort((a, b) => 
    a.table_number.localeCompare(b.table_number, undefined, { numeric: true, sensitivity: 'base' })
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full text-slate-200">
      
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-orange-500" />
            Table Reservations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track customer table bookings, visualize table availability in real-time, and manage reservations.
          </p>
        </div>
        
        <button
          onClick={() => {
            setSelectedCellTable(null);
            setSelectedCellHour(null);
            setFormDate(selectedDate);
            setFormTime('18:00');
            setFormTableId('');
            setFormGuestCount(2);
            setIsBookModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 text-xs font-bold transition shadow-lg shadow-orange-950/20 shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Reservation
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-[#0c101b] p-4 shadow-lg">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Bookings</div>
          <div className="text-xl font-black text-white mt-1">{metrics.total}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#0c101b] p-4 shadow-lg border-l-4 border-l-amber-500">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Pending Review</div>
          <div className="text-xl font-black text-amber-500 mt-1">{metrics.pending}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#0c101b] p-4 shadow-lg border-l-4 border-l-emerald-500">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confirmed</div>
          <div className="text-xl font-black text-emerald-500 mt-1">{metrics.confirmed}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#0c101b] p-4 shadow-lg border-l-4 border-l-sky-500">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Seated</div>
          <div className="text-xl font-black text-sky-500 mt-1">{metrics.seated}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#0c101b] p-4 shadow-lg border-l-4 border-l-red-500">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cancelled</div>
          <div className="text-xl font-black text-red-500 mt-1">{metrics.cancelled}</div>
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-slate-900/40 p-4 border border-slate-800 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                  viewMode === 'calendar'
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                Calendar Board
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                  viewMode === 'list'
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Table className="h-4 w-4" />
                List View
              </button>
              <button
                onClick={() => setViewMode('history')}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                  viewMode === 'history'
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="h-4 w-4" />
                History
              </button>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search Guest Name, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-orange-500 transition"
              />
            </div>
          </div>

          {viewMode === 'calendar' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <button
                  onClick={handlePrevDay}
                  className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-900 border-r border-slate-850"
                  title="Previous Day"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs text-white font-mono font-bold py-2 px-3 border-none outline-none focus:ring-0 cursor-pointer"
                />
                <button
                  onClick={handleNextDay}
                  className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-900 border-l border-slate-850"
                  title="Next Day"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleJumpToToday}
                className="rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Today
              </button>
            </div>
          )}

          {(viewMode === 'list' || viewMode === 'history') && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1 overflow-x-auto text-xs pb-1 md:pb-0">
                {(['all', 'pending', 'confirmed', 'seated', 'cancelled'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-xl px-3 py-1.5 font-bold uppercase tracking-wider border transition shrink-0 ${
                      statusFilter === status
                        ? 'bg-orange-600 border-orange-500 text-white shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              {viewMode === 'history' && selectedReservationIds.length > 0 && (
                <button
                  onClick={handleDeleteSelectedReservations}
                  className="flex items-center gap-1.5 rounded-xl bg-red-950/60 border border-red-500/30 text-red-400 px-3.5 py-1.5 text-[10px] font-black hover:bg-red-900/30 transition shadow uppercase tracking-wider shrink-0"
                  title={`Delete ${selectedReservationIds.length} Selected Records`}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  Delete Selected ({selectedReservationIds.length})
                </button>
              )}
              {viewMode === 'history' && statusFilter !== 'all' && (
                <button
                  onClick={handleBulkDeleteHistory}
                  className="flex items-center gap-1.5 rounded-xl bg-red-950/60 border border-red-500/30 text-red-400 px-3.5 py-1.5 text-[10px] font-black hover:bg-red-900/30 transition shadow uppercase tracking-wider shrink-0"
                  title={`Bulk Delete All ${statusFilter.toUpperCase()} History`}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  Clear All {statusFilter}
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-500 font-bold">
                  <th className="p-4">Guest Info</th>
                  <th className="p-4">Reservation Time</th>
                  <th className="p-4 text-center">Guests</th>
                  <th className="p-4 text-center">Table</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500 font-bold">Loading bookings...</td>
                  </tr>
                ) : filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-600 font-bold">No reservations found matching the filters.</td>
                  </tr>
                ) : (
                  filteredReservations.map((r) => (
                    <tr key={r.id} className="border-b border-slate-900 text-slate-300 hover:bg-slate-900/10 transition">
                      <td className="p-4">
                        <div className="font-bold text-white text-xs">{r.guest_name}</div>
                        <div className="text-[10px] text-slate-500 block mt-0.5">{r.guest_phone} {r.guest_email && `| ${r.guest_email}`}</div>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-400 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-orange-500" />
                        {r.reservation_time}
                      </td>
                      <td className="p-4 text-center font-extrabold text-white">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-950 px-2 py-1 text-slate-300">
                          <Users className="h-3.5 w-3.5 text-amber-500" />
                          {r.party_size}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                          <Table className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                          <select
                            value={r.table_id || ''}
                            onChange={(e) => handleAssignTable(r.id, e.target.value)}
                            className="bg-transparent text-xs text-slate-300 font-bold focus:outline-none cursor-pointer border-none p-0 pr-2"
                          >
                            <option value="" className="bg-slate-950 text-slate-400">Not Assigned</option>
                            {tablesList.map((table) => {
                              const statusLabel = table.status !== 'available' ? ` [${table.status.toUpperCase()}]` : '';
                              return (
                                <option key={table.id} value={table.id} className="bg-slate-950 text-slate-200">
                                  T-{table.table_number} ({table.seating_capacity} Seats){statusLabel}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          r.status === 'confirmed'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25'
                            : r.status === 'seated'
                            ? 'bg-sky-500/10 text-sky-500 border border-sky-500/25'
                            : r.status === 'cancelled'
                            ? 'bg-red-500/10 text-red-500 border border-red-500/25'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/25'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {r.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'confirmed')}
                              className="rounded-lg bg-emerald-950/40 p-2 text-emerald-400 hover:bg-emerald-900/40 border border-emerald-950/50 transition"
                              title="Confirm Booking"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {r.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'seated')}
                              className="rounded-lg bg-sky-950/40 p-2 text-sky-400 hover:bg-sky-900/40 border border-sky-950/50 transition"
                              title="Seat Table"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {r.status !== 'cancelled' && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'cancelled')}
                              className="rounded-lg bg-red-950/40 p-2 text-red-400 hover:bg-red-900/40 border border-red-950/50 transition"
                              title="Cancel Booking"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(r)}
                            className="rounded-lg bg-slate-950 p-2 text-slate-300 hover:bg-slate-900 border border-slate-800 transition"
                            title="Edit / Reschedule / Move Table"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="flex flex-col lg:flex-row gap-6">
          
          <div className="flex-1 rounded-2xl border border-slate-800 bg-[#070b13]/60 p-4 shadow-xl overflow-hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Table className="h-4 w-4 text-sky-500" />
              Table Timelines for {selectedDate}
            </h3>
            
            <div className="overflow-x-auto w-full border border-slate-900 rounded-xl bg-slate-950/40">
              <div className="min-w-[900px] divide-y divide-slate-850">
                
                <div className="flex bg-slate-950/80 sticky top-0 text-[10px] font-bold text-slate-500 uppercase tracking-widest py-3">
                  <div className="w-32 px-4 shrink-0 font-black border-r border-slate-850 text-slate-400 text-xs">Table</div>
                  <div className="flex flex-1 justify-between">
                    {HOURS.map(hour => (
                      <div key={hour} className="flex-1 text-center font-mono border-r border-slate-900/40 last:border-none">
                        {formatHour(hour)}
                      </div>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="py-12 text-center text-slate-500 font-bold">Loading table scheduler...</div>
                ) : sortedTables.length === 0 ? (
                  <div className="py-12 text-center text-slate-650 font-bold">No dining tables found. Create some in the "Tables" section.</div>
                ) : (
                  sortedTables.map(table => (
                    <div key={table.id} className="flex group/row hover:bg-slate-900/10 py-1 items-stretch min-h-[64px]">
                      
                      <div className="w-32 px-4 shrink-0 flex flex-col justify-center border-r border-slate-850 bg-slate-950/10">
                        <span className="font-extrabold text-white text-xs">T-{table.table_number}</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">{table.seating_capacity} Max Seats</span>
                      </div>

                      <div className="flex flex-1 items-stretch">
                        {HOURS.map(hour => {
                          const cellBookings = getReservationsForCell(table.id, hour);
                          
                          return (
                            <div
                              key={hour}
                              className="flex-1 relative border-r border-slate-900/40 last:border-none flex items-stretch p-1 min-h-[56px]"
                            >
                              {cellBookings.length > 0 ? (
                                <div className="w-full flex flex-col gap-1">
                                  {cellBookings.map(res => {
                                    const startCell = isStartCell(res, hour);
                                    return (
                                      <button
                                        key={res.id}
                                        onClick={() => openEditModal(res)}
                                        className={`flex-1 rounded border p-1 text-[10px] text-left transition select-none flex flex-col justify-center overflow-hidden leading-tight ${getReservationColor(res.status)}`}
                                        title={`${res.guest_name} - ${res.party_size} Guests - ${res.reservation_time}`}
                                      >
                                        {startCell ? (
                                          <>
                                            <span className="font-extrabold truncate block text-white">{res.guest_name}</span>
                                            <span className="text-[9px] font-semibold text-slate-400 mt-0.5 flex items-center gap-0.5">
                                              <Users className="h-2.5 w-2.5 inline" /> {res.party_size}
                                              <span className="ml-1 opacity-70">@{res.reservation_time.split(' ')[1].slice(0, 5)}</span>
                                            </span>
                                          </>
                                        ) : (
                                          <span className="opacity-40 italic font-mono text-[9px] block text-center">── block ──</span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <button
                                  onClick={() => openQuickBook(table, hour)}
                                  className="w-full h-full rounded opacity-0 hover:opacity-100 bg-orange-600/10 hover:bg-orange-600/20 border border-dashed border-orange-500/30 flex items-center justify-center transition"
                                  title={`Reserve T-${table.table_number} at ${formatHour(hour)}`}
                                >
                                  <Plus className="h-4 w-4 text-orange-500" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  ))
                )}

              </div>
            </div>
          </div>

          <div className="w-full lg:w-72 space-y-6">
            
            <div className="rounded-2xl border border-slate-800 bg-[#070b13]/60 p-5 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Unassigned Bookings</h3>
                <span className="rounded-full bg-orange-600/20 text-orange-500 px-2 py-0.5 text-[10px] font-black border border-orange-500/20">
                  {unassignedBookings.length}
                </span>
              </div>

              {unassignedBookings.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">All bookings assigned</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {unassignedBookings.map(r => (
                    <div
                      key={r.id}
                      onClick={() => openEditModal(r)}
                      className="p-3 rounded-xl border border-slate-850 bg-slate-950 hover:bg-slate-900/60 transition cursor-pointer flex flex-col gap-1.5"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-extrabold text-xs text-white truncate">{r.guest_name}</span>
                        <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-black text-amber-500 border border-slate-850 shrink-0">
                          {r.party_size}P
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-orange-500" />
                        {r.reservation_time.split(' ')[1].slice(0, 5)}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(r);
                        }}
                        className="mt-1.5 w-full text-center rounded bg-orange-600/10 hover:bg-orange-600 text-orange-500 hover:text-white py-1 text-[10px] font-black border border-orange-500/20 transition uppercase tracking-wider"
                      >
                        Assign Table
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#070b13]/40 p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Scheduler Help</h3>
              <div className="space-y-2.5 text-[10px] text-slate-400 leading-relaxed font-medium">
                <div className="flex items-start gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
                  <p><strong className="text-white">Green</strong> cells represent confirmed reservations.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-500 mt-1 shrink-0"></span>
                  <p><strong className="text-white">Blue</strong> cells indicate the guest is seated (table occupied).</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 mt-1 shrink-0"></span>
                  <p><strong className="text-white">Yellow</strong> cells are pending bookings requiring host confirmation.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="h-2.5 w-2.5 rounded border border-dashed border-orange-500/30 bg-orange-600/10 mt-0.5 shrink-0 flex items-center justify-center font-bold text-orange-500 text-[8px]">+</span>
                  <p>Hover and click on any empty cell slot to create a direct reservation on that table at that hour.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : viewMode === 'history' ? (
        /* ── HISTORY VIEW ── */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/40">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Reservation History Log
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">All bookings sorted by most recent. Click any row to manage it.</p>
            </div>
            <span className="rounded-full bg-orange-600/10 border border-orange-500/20 text-orange-400 px-2.5 py-1 text-[10px] font-black">
              {filteredReservations.length} records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredReservations.length > 0 && filteredReservations.every(r => selectedReservationIds.includes(r.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const pageIds = filteredReservations.map(r => r.id);
                          setSelectedReservationIds(prev => Array.from(new Set([...prev, ...pageIds])));
                        } else {
                          const pageIds = filteredReservations.map(r => r.id);
                          setSelectedReservationIds(prev => prev.filter(id => !pageIds.includes(id)));
                        }
                      }}
                      className="rounded border-slate-800 bg-slate-950 text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-4">Guest</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Booked On</th>
                  <th className="p-4">Reservation Time</th>
                  <th className="p-4 text-center">Party</th>
                  <th className="p-4 text-center">Table</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Notes</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-slate-500 font-bold">Loading history...</td>
                  </tr>
                ) : filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-slate-600 font-bold">No reservation records found.</td>
                  </tr>
                ) : (
                  filteredReservations.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => openEditModal(r)}
                      className="border-b border-slate-900 text-slate-300 hover:bg-slate-900/20 transition cursor-pointer"
                    >
                      <td className="p-4 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedReservationIds.includes(r.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedReservationIds(prev => [...prev, r.id]);
                            } else {
                              setSelectedReservationIds(prev => prev.filter(id => id !== r.id));
                            }
                          }}
                          className="rounded border-slate-800 bg-slate-950 text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white text-xs">{r.guest_name}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-[10px] text-slate-400">{r.guest_phone}</div>
                        {r.guest_email && <div className="text-[10px] text-slate-500">{r.guest_email}</div>}
                      </td>
                      <td className="p-4 font-mono text-[10px] text-slate-500">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
                          : '—'}
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-400 text-[10px]">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3 w-3 text-orange-500 shrink-0" />
                          {r.reservation_time}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-950 px-2 py-1 text-slate-300 font-bold border border-slate-800">
                          <Users className="h-3 w-3 text-amber-500" />
                          {r.party_size}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono text-[10px] font-bold">
                        {r.table_number !== 'Not Assigned'
                          ? <span className="text-sky-400">T-{r.table_number}</span>
                          : <span className="text-slate-600 italic">Unassigned</span>}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          r.status === 'confirmed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                            : r.status === 'seated'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/25'
                            : r.status === 'cancelled'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/25'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 max-w-[180px]">
                        {r.notes
                          ? <span className="text-[10px] text-slate-400 italic line-clamp-2">{r.notes}</span>
                          : <span className="text-[10px] text-slate-700">—</span>}
                      </td>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDeleteSingle(r.id)}
                          className="rounded-lg bg-red-950/40 p-2 text-red-400 hover:bg-red-900/40 border border-red-950/50 hover:text-white transition"
                          title="Delete Record"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-850 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3.5">
              <h2 className="text-lg font-black text-white flex items-center gap-1.5">
                <Calendar className="h-5 w-5 text-orange-500" />
                {formTableId ? `Reserve Table T-${tablesList.find(t => t.id === formTableId)?.table_number || ''}` : 'Create Table Reservation'}
              </h2>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleQuickBookSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 transition font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Time</label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 transition font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Customer Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +61 412345678"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Guest Count</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formGuestCount}
                    onChange={(e) => setFormGuestCount(parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Customer Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="e.g. john@example.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assign Dining Table</label>
                <select
                  value={formTableId}
                  onChange={(e) => setFormTableId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-orange-500 transition"
                >
                  <option value="">Not Assigned (Walk-in Hold)</option>
                  {tablesList.map(t => {
                    const statusLabel = t.status !== 'available' ? ` [${t.status.toUpperCase()}]` : '';
                    return (
                      <option key={t.id} value={t.id}>
                        T-{t.table_number} ({t.seating_capacity} seats){statusLabel}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Notes / Requests</label>
                <textarea
                  placeholder="Allergies, table preferences..."
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500 transition resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="rounded-xl border border-slate-850 bg-slate-950 hover:bg-slate-900 px-4 py-2.5 text-xs font-bold transition text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 text-xs font-bold transition shadow-lg shadow-orange-950/20"
                >
                  Reserve Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-850 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3.5">
              <h2 className="text-lg font-black text-white flex items-center gap-1.5">
                <Edit2 className="h-5 w-5 text-orange-500" />
                {editTableId ? `Manage Booking (Table T-${tablesList.find(t => t.id === editTableId)?.table_number || ''})` : 'Manage Booking'}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-850">
              <button
                type="button"
                onClick={() => {
                  setEditStatus('confirmed');
                  triggerAlert('Set status to confirmed. Click save to apply.');
                }}
                className={`py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                  editStatus === 'confirmed'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditStatus('seated');
                  triggerAlert('Set status to seated (table occupied). Click save to apply.');
                }}
                className={`py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                  editStatus === 'seated'
                    ? 'bg-sky-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Seat Guest
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditStatus('cancelled');
                  triggerAlert('Set status to cancelled. Click save to apply.');
                }}
                className={`py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                  editStatus === 'cancelled'
                    ? 'bg-red-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <User className="h-3.5 w-3.5 text-orange-500" />
                  {editName}
                </div>
                <div className="text-[10px] text-slate-500 leading-none">
                  {editPhone} {editEmail && `| ${editEmail}`}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 transition font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Time</label>
                  <input
                    type="time"
                    required
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 transition font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Guest Count</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editGuestCount}
                    onChange={(e) => setEditGuestCount(parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 transition font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Move to Table</label>
                  <select
                    value={editTableId}
                    onChange={(e) => setEditTableId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-orange-500 transition font-mono"
                  >
                    <option value="">Not Assigned (Hold)</option>
                    {tablesList.map(t => {
                      const statusLabel = t.status !== 'available' ? ` [${t.status.toUpperCase()}]` : '';
                      return (
                        <option key={t.id} value={t.id}>
                          T-{t.table_number} ({t.seating_capacity} Seats){statusLabel}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Notes / Requests</label>
                <textarea
                  placeholder="Allergies, table preferences..."
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none focus:border-orange-500 transition resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-slate-850 bg-slate-950 hover:bg-slate-900 px-4 py-2.5 text-xs font-bold transition text-slate-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 text-xs font-bold transition shadow-lg shadow-orange-950/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
