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
  AlertCircle
} from 'lucide-react';

export default function ReservationsPage() {
  const { data: session } = useSession();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mock initial reservations to seed if none exist
  const seedMockReservations = () => {
    return [
      { id: 'res_1', guest_name: 'John Doe', guest_email: 'john@gmail.com', guest_phone: '+61 412345678', reservation_time: '2026-06-20 18:30:00', party_size: 4, status: 'confirmed', table_number: 5 },
      { id: 'res_2', guest_name: 'Alice Smith', guest_email: 'alice@hotmail.com', guest_phone: '+61 498765432', reservation_time: '2026-06-20 19:15:00', party_size: 2, status: 'pending', table_number: 12 },
      { id: 'res_3', guest_name: 'David Miller', guest_email: 'david@yahoo.com', guest_phone: '+61 422334455', reservation_time: '2026-06-21 12:00:00', party_size: 6, status: 'pending', table_number: 3 },
      { id: 'res_4', guest_name: 'Emma Watson', guest_email: 'emma@outlook.com', guest_phone: '+61 455667788', reservation_time: '2026-06-22 20:00:00', party_size: 2, status: 'confirmed', table_number: 8 },
      { id: 'res_5', guest_name: 'Robert Downey', guest_email: 'robert@marvel.com', guest_phone: '+61 433322211', reservation_time: '2026-06-22 21:00:00', party_size: 8, status: 'cancelled', table_number: 15 },
    ];
  };

  useEffect(() => {
    if (!session || !(session.user as any)?.store_id) return;
    const storeId = (session.user as any).store_id;
    const reservationsKey = `reservationsConfig_${storeId}`;

    const fetchReservations = async () => {
      try {
        setLoading(true);
        // Fallback to local storage
        const saved = localStorage.getItem(reservationsKey);
        if (saved) {
          setReservations(JSON.parse(saved));
        } else {
          setReservations([]);
          localStorage.setItem(reservationsKey, JSON.stringify([]));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
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

  const handleUpdateStatus = (id: string, newStatus: 'confirmed' | 'cancelled') => {
    const updated = reservations.map(r => {
      if (r.id === id) {
        return { ...r, status: newStatus };
      }
      return r;
    });
    setReservations(updated);
    const storeId = (session?.user as any)?.store_id || 'default';
    localStorage.setItem(`reservationsConfig_${storeId}`, JSON.stringify(updated));
    triggerAlert(`Reservation marked as ${newStatus}.`);
  };

  const filteredReservations = reservations.filter(r => {
    const matchesSearch = 
      r.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.guest_phone.includes(searchQuery) ||
      (r.guest_email && r.guest_email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getMetrics = () => {
    const total = reservations.length;
    const pending = reservations.filter(r => r.status === 'pending').length;
    const confirmed = reservations.filter(r => r.status === 'confirmed').length;
    const cancelled = reservations.filter(r => r.status === 'cancelled').length;
    return { total, pending, confirmed, cancelled };
  };

  const metrics = getMetrics();

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
            <Calendar className="h-6 w-6 text-orange-500 animate-pulse" />
            Table Reservations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track customer table bookings, seat layout planning, reservation approvals, and guest lists.
          </p>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-[#0c101b] p-5 shadow-lg">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Bookings</div>
          <div className="text-2xl font-black text-white mt-1.5">{metrics.total}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#0c101b] p-5 shadow-lg border-l-4 border-l-amber-500">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending Review</div>
          <div className="text-2xl font-black text-white mt-1.5 text-amber-500">{metrics.pending}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#0c101b] p-5 shadow-lg border-l-4 border-l-emerald-500">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confirmed</div>
          <div className="text-2xl font-black text-white mt-1.5 text-emerald-500">{metrics.confirmed}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#0c101b] p-5 shadow-lg border-l-4 border-l-red-500">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cancelled</div>
          <div className="text-2xl font-black text-white mt-1.5 text-red-500">{metrics.cancelled}</div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4 border border-slate-800 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Guest Name, Phone or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
          />
        </div>

        <div className="flex gap-2 text-xs">
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-4 py-2 font-bold uppercase tracking-wider border transition ${
                statusFilter === status
                  ? 'bg-orange-600 border-orange-500 text-white shadow'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
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
                <th className="p-4 text-right">Approve / Cancel</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 font-bold">Loading bookings...</td>
                </tr>
              ) : filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-650 font-bold">No reservations found matching the filters.</td>
                </tr>
              ) : (
                filteredReservations.map((r) => (
                  <tr key={r.id} className="border-b border-slate-900 text-slate-300 hover:bg-slate-900/10">
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
                        <Users className="h-3.5 w-3.5 text-[#f59e0b]" />
                        {r.party_size}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-400">
                      <span className="inline-flex items-center gap-1 rounded bg-slate-950 px-2 py-1 text-slate-300">
                        <Table className="h-3.5 w-3.5 text-sky-500" />
                        T-{r.table_number}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        r.status === 'confirmed'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25'
                          : r.status === 'cancelled'
                          ? 'bg-red-500/10 text-red-500 border border-red-500/25'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/25'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {r.status === 'pending' ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'confirmed')}
                            className="rounded-lg bg-emerald-950/40 p-2 text-emerald-400 hover:bg-emerald-900/40 border border-emerald-950/50"
                            title="Confirm Booking"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'cancelled')}
                            className="rounded-lg bg-red-950/40 p-2 text-red-400 hover:bg-red-900/40 border border-red-950/50"
                            title="Cancel Booking"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
