'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Search,
  Clock,
  Globe,
  Monitor,
  User,
  ArrowUpRight,
  Filter,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed,
  Calendar,
  CreditCard,
  FileText
} from 'lucide-react';

export default function TrafficLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'order' | 'booking'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const itemsPerPage = 12;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/traffic-logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch traffic logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLogs();
    }
  }, [status]);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedLogId(null);
  }, [selectedType, searchQuery]);

  if (status === 'loading') {
    return null;
  }

  // Filter Logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || log.type === selectedType;

    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const formatDevice = (ua: string) => {
    if (!ua) return 'Unknown Device';
    if (ua.includes('iPhone')) return 'iPhone / iOS';
    if (ua.includes('iPad')) return 'iPad / iOS';
    if (ua.includes('Android')) return 'Android Device';
    if (ua.includes('Macintosh')) return 'Mac / macOS';
    if (ua.includes('Windows')) return 'PC / Windows';
    if (ua.includes('Linux')) return 'PC / Linux';
    return 'Web Browser';
  };

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto text-slate-200">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <Activity className="h-5.5 w-5.5 text-orange-500" /> Customer Traffic & Origin Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Analyze where your customers are placing online orders and booking tables (city, device, and network origins). Click any row to expand details.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-850 transition"
        >
          Refresh Logs
        </button>
      </div>

      {/* Main Interactive Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c101b] shadow-2xl overflow-hidden flex flex-col">
        {/* Filters and search header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/20 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'order', 'booking'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-bold transition duration-150 uppercase tracking-wider ${
                    selectedType === type
                      ? 'bg-[#1a2336] text-[#f59e0b] border-l border-[#f59e0b]'
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                  }`}
                >
                  {type === 'all' ? 'All Origins' : type === 'order' ? 'Online Orders' : 'Table Bookings'}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search IP, city, reference, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-[#f59e0b] transition placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Logs list table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-[#f59e0b] mx-auto"></div>
              <p className="mt-3 text-xs text-slate-500 font-semibold tracking-wider">Loading activity log stream...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-20">
              <Globe className="h-10 w-10 text-slate-600 mx-auto" />
              <p className="mt-3 text-xs text-slate-500 font-bold">No origins found</p>
              <p className="text-[10px] text-slate-600 mt-1">No online transactions matching current filters have been logged yet.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/45 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6 w-12 text-center"></th>
                  <th className="py-3.5 px-6">Event Type</th>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4">Location (Geo Address)</th>
                  <th className="py-3.5 px-4">Device / Browser OS</th>
                  <th className="py-3.5 px-4">Time Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {paginatedLogs.map((log) => {
                  const isExpanded = expandedLogId === `${log.type}-${log.id}`;
                  return (
                    <React.Fragment key={`${log.type}-${log.id}`}>
                      <tr
                        onClick={() => toggleExpand(`${log.type}-${log.id}`)}
                        className={`hover:bg-slate-900/20 transition duration-100 font-medium cursor-pointer ${
                          isExpanded ? 'bg-slate-900/10' : ''
                        }`}
                      >
                        <td className="py-4 px-6 text-center text-slate-500">
                          {isExpanded ? <ChevronUp className="h-4 w-4 mx-auto" /> : <ChevronDown className="h-4 w-4 mx-auto" />}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold border ${
                            log.type === 'order'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          }`}>
                            {log.type === 'order' ? 'Online Order' : 'Table Booking'}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-extrabold text-white flex items-center gap-1">
                          {log.reference}
                          <ArrowUpRight className="h-3 w-3 text-slate-500 shrink-0" />
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-white font-bold">{log.customerName}</span>
                            <span className="text-slate-400 text-[10px] font-mono">{log.customerPhone}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono font-bold">
                          <span className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-orange-400 text-[10px]">
                            {log.ipAddress}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {log.address !== 'Unknown Location' ? (
                            <div className="flex flex-col">
                              <span className="text-slate-200 font-semibold">{log.address}</span>
                              {log.geo?.isp && (
                                <span className="text-[9.5px] text-slate-500 italic font-mono mt-0.5">{log.geo.isp}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 italic">Localhost / Unknown</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5">
                            {log.type === 'order' ? (
                              <Monitor className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            ) : (
                              <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            )}
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-300 font-bold">{formatDevice(log.device)}</span>
                              <span className="text-[9px] text-slate-500 truncate max-w-[150px] font-mono mt-0.5" title={log.device}>
                                {log.device}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-950/40">
                          <td colSpan={8} className="p-6 border-l-2 border-[#f59e0b] shadow-inner">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Left Column: Customer details */}
                              <div className="space-y-4">
                                <div className="rounded-xl border border-slate-800 bg-[#070b13]/80 p-4 space-y-2">
                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-orange-500" /> Customer Information
                                  </h4>
                                  <div className="text-xs space-y-1">
                                    <p><strong>Name:</strong> {log.customerName}</p>
                                    <p><strong>Phone:</strong> {log.customerPhone}</p>
                                    <p><strong>Email:</strong> {log.customerEmail}</p>
                                  </div>
                                </div>

                                <div className="rounded-xl border border-slate-850 bg-[#070b13]/40 p-4 space-y-2">
                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5 text-orange-500" /> Connection Metadata
                                  </h4>
                                  <div className="text-[11px] space-y-1 text-slate-300 font-mono">
                                    <p><strong>IP Address:</strong> {log.ipAddress}</p>
                                    <p><strong>Location:</strong> {log.address}</p>
                                    <p><strong>ISP Provider:</strong> {log.geo?.isp || 'Localhost/Internal'}</p>
                                    {log.geo?.lat && log.geo?.lon && (
                                      <p><strong>Coordinates:</strong> Lat {log.geo.lat}, Lon {log.geo.lon}</p>
                                    )}
                                    <p className="break-all"><strong>User-Agent:</strong> {log.device}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Center & Right Column: Specific details */}
                              <div className="md:col-span-2 space-y-4">
                                {log.type === 'order' ? (
                                  /* ORDER DETAILS BREAKDOWN */
                                  <div className="rounded-xl border border-slate-800 bg-[#070b13]/80 p-5 space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                      <UtensilsCrossed className="h-3.5 w-3.5 text-orange-500" /> Order Details
                                    </h4>
                                    <div className="border-b border-dashed border-slate-800 pb-3 flex justify-between items-center text-xs">
                                      <div>
                                        <p><strong>Ticket ID:</strong> {log.reference}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Status: <span className="text-white uppercase font-bold">{log.status}</span></p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                                      </div>
                                    </div>

                                    {/* Order Items Table */}
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shopping Basket</p>
                                      <div className="divide-y divide-slate-900 border border-slate-900 rounded-lg overflow-hidden bg-slate-950/20 text-xs">
                                        {log.items && log.items.length > 0 ? (
                                          log.items.map((oi: any) => (
                                            <div key={oi.id} className="flex justify-between items-center p-2.5">
                                              <span>
                                                <strong className="text-white font-bold">{oi.quantity}x</strong> {oi.MenuItem?.name || 'Dish Item'}
                                              </span>
                                              <span className="font-mono font-bold text-slate-200">
                                                ${(parseFloat(oi.unit_price) * oi.quantity).toFixed(2)}
                                              </span>
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-center py-4 text-slate-600 font-bold">No items listed</p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Totals */}
                                    <div className="border-t border-slate-900 pt-3 flex justify-end">
                                      <div className="w-56 text-xs space-y-1 font-bold">
                                        <div className="flex justify-between text-slate-500">
                                          <span>Subtotal:</span>
                                          <span className="font-mono">${log.subtotal?.toFixed(2)}</span>
                                        </div>
                                        {log.discount > 0 && (
                                          <div className="flex justify-between text-red-400">
                                            <span>Discount:</span>
                                            <span className="font-mono">-${log.discount?.toFixed(2)}</span>
                                          </div>
                                        )}
                                        <div className="flex justify-between text-slate-500">
                                          <span>Tax:</span>
                                          <span className="font-mono">${log.tax?.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-white border-t border-slate-800 pt-1.5 text-sm font-black">
                                          <span className="text-[#f59e0b]">Grand Total:</span>
                                          <span className="font-mono text-[#f59e0b]">${log.total?.toFixed(2)}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Payment details */}
                                    {log.payment ? (
                                      <div className="rounded-lg bg-slate-950 p-3 border border-slate-900 text-[10px] space-y-1 text-slate-400 leading-normal">
                                        <p><strong>Payment Method:</strong> {log.payment.payment_method?.toUpperCase()}</p>
                                        <p><strong>TX Status:</strong> <span className="text-emerald-400 font-bold uppercase">{log.payment.transaction_status}</span></p>
                                        <p><strong>TX Reference:</strong> <code className="text-white font-mono">{log.payment.transaction_reference || 'N/A'}</code></p>
                                      </div>
                                    ) : (
                                      <div className="rounded-lg border border-red-500/10 bg-red-500/5 p-3 text-[10px] text-red-400 font-bold italic text-center uppercase tracking-wider">
                                        Unpaid Cashier Hold
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  /* BOOKING / RESERVATION DETAILS BREAKDOWN */
                                  <div className="rounded-xl border border-slate-800 bg-[#070b13]/80 p-5 space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                      <Calendar className="h-3.5 w-3.5 text-orange-500" /> Reservation Details
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-900">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Reservation Date & Time</p>
                                        <p className="font-mono font-bold text-white text-[13px]">{new Date(log.reservationTime).toLocaleString()}</p>
                                      </div>
                                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-900">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Assigned Dining Table</p>
                                        <p className="font-bold text-sky-400 text-[13px]">T-{log.tableNumber}</p>
                                      </div>
                                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-900">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Party Size</p>
                                        <p className="font-bold text-white text-[13px]">{log.guestCount} Guests</p>
                                      </div>
                                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-900">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Reservation Status</p>
                                        <p className="font-bold text-amber-500 uppercase text-[12px]">{log.status}</p>
                                      </div>
                                    </div>

                                    {log.bookingChargePaid > 0 && (
                                      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 p-3 text-xs flex justify-between items-center">
                                        <span className="font-bold text-slate-300">Security Booking Deposit Paid:</span>
                                        <strong className="font-mono text-emerald-400 text-sm">${log.bookingChargePaid.toFixed(2)}</strong>
                                      </div>
                                    )}

                                    {log.notes ? (
                                      <div className="rounded-lg bg-slate-950 p-3 border border-slate-900 text-xs">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Guest Special Notes / Requests</p>
                                        <p className="text-slate-300 italic leading-relaxed">"{log.notes}"</p>
                                      </div>
                                    ) : (
                                      <div className="rounded-lg bg-slate-950 p-3 border border-slate-900 text-xs text-center text-slate-600 font-semibold italic">
                                        No special notes or preferences specified
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination controls */}
        {filteredLogs.length > 0 && (
          <div className="p-4 border-t border-slate-850 bg-slate-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold text-slate-400">
            <div>
              Showing <span className="text-white">{startIndex + 1}</span> to{' '}
              <span className="text-white">
                {Math.min(startIndex + itemsPerPage, filteredLogs.length)}
              </span>{' '}
              of <span className="text-white">{filteredLogs.length}</span> activity logs
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 font-bold hover:bg-slate-900 transition disabled:opacity-40 disabled:hover:bg-slate-955"
              >
                Previous
              </button>
              <span className="text-slate-500">
                Page <span className="text-white">{currentPage}</span> of{' '}
                <span className="text-white">{totalPages}</span>
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 font-bold hover:bg-slate-900 transition disabled:opacity-40 disabled:hover:bg-slate-955"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
