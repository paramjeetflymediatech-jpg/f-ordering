'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  History,
  Search,
  Clock,
  DollarSign,
  TrendingUp,
  Receipt,
  X,
  CreditCard,
  User,
  UtensilsCrossed,
  Filter,
  Trash2
} from 'lucide-react';

export default function OrderHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const [orders, setOrders] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState<string>('TABLETASTE FOODS');
  const [companyAddress, setCompanyAddress] = useState<string>('100 Silicon Valley Way, Suite A');
  const [companyPhone, setCompanyPhone] = useState<string>('+1 555-0199');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'completed' | 'active' | 'on_hold' | 'cancelled'>('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const itemsPerPage = 10;

  const handleDeleteSelectedOrders = async () => {
    if (selectedOrderIds.length === 0) return;
    const confirmMsg = `Are you sure you want to permanently delete the ${selectedOrderIds.length} selected order(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/orders?ids=${selectedOrderIds.join(',')}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'Orders deleted successfully.');
        setSelectedOrderIds([]);
        fetchOrders();
      } else {
        alert(data.error || 'Failed to delete orders.');
      }
    } catch (err) {
      console.error('Failed to delete orders:', err);
      alert('Error occurred while deleting orders.');
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev: any[]) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        setSelectedOrder((prev: any) => (prev && prev.id === orderId ? { ...prev, status: newStatus } : prev));
      } else {
        alert(data.error || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Error updating order status');
    } finally {
      setUpdatingStatus(null);
    }
  };


  const handleClearFilters = () => {
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setSelectedStatus('all');
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders/history');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch order history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchOrders();
      fetch('/api/dashboard/profile')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            if (data.organization?.name) setCompanyName(data.organization.name);
            if (data.store?.address) setCompanyAddress(data.store.address);
            if (data.store?.phone) setCompanyPhone(data.store.phone);
          }
        })
        .catch((err) => console.error('Error fetching company info:', err));
    }
  }, [status]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedOrderIds([]);
  }, [selectedStatus, searchQuery, fromDate, toDate]);

  if (status === 'loading') {
    return null; // Layout handles spinner
  }

  // Calculate Metrics
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const activeOrdersCount = orders.filter((o) => !['completed', 'cancelled'].includes(o.status)).length;
  
  const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const totalOrders = orders.length;
  const averageTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  // Filter Orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.cashier?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.RestaurantTable?.table_number || '').toLowerCase().includes(searchQuery.toLowerCase());

    const isActiveStatus = !['completed', 'cancelled'].includes(order.status);
    let matchesStatus = true;
    if (selectedStatus === 'completed') matchesStatus = order.status === 'completed';
    else if (selectedStatus === 'active') matchesStatus = isActiveStatus;
    else if (selectedStatus === 'on_hold') matchesStatus = order.status === 'on_hold';
    else if (selectedStatus === 'cancelled') matchesStatus = order.status === 'cancelled';

    // Date Range Filter
    let matchesDate = true;
    const orderDate = new Date(order.createdAt);
    
    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      if (orderDate < start) matchesDate = false;
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      if (orderDate > end) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">Completed</span>;
      case 'on_hold':
        return <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-400 border border-amber-500/20">On Hold</span>;
      case 'cancelled':
        return <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-400 border border-rose-500/20">Cancelled</span>;
      default:
        return <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold text-cyan-400 border border-cyan-500/20 capitalize">{status}</span>;
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <History className="h-5.5 w-5.5 text-[#f59e0b]" /> Order History Log
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review detailed transactions, active POS bills, and track cashier ticket logs.
          </p>
        </div>
        {/* <button
          onClick={fetchOrders}
          className="rounded-xl border border-[#1e293b] bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          Refresh log
        </button> */}
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-4 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-black text-white mt-1.5">${totalRevenue.toFixed(2)}</p>
            <span className="text-[9.5px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
              Processed Sales
            </span>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-4 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Tickets</p>
            <p className="text-2xl font-black text-white mt-1.5">{totalOrders}</p>
            <span className="text-[9.5px] font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded mt-1 inline-block">
              All Orders Created
            </span>
          </div>
          <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400">
            <Receipt className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-4 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Average Ticket</p>
            <p className="text-2xl font-black text-white mt-1.5">${averageTicket.toFixed(2)}</p>
            <span className="text-[9.5px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
              Per Ticket Size
            </span>
          </div>
          <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-4 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Tickets</p>
            <p className="text-2xl font-black text-white mt-1.5">{activeOrdersCount}</p>
            <span className="text-[9.5px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
              Live POS queues
            </span>
          </div>
          <div className="rounded-xl bg-purple-500/10 p-2 text-purple-400">
            <Clock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Interactive Table */}
      <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] shadow-2xl overflow-hidden flex flex-col">
        {/* Filters and search header */}
        <div className="p-5 border-b border-[#1e293b]/60 bg-slate-950/20 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'completed', 'active', 'on_hold', 'cancelled'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedStatus(tab)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition duration-150 capitalize ${
                    selectedStatus === tab
                      ? 'bg-[#1a2336] text-[#f59e0b] border-l border-[#f59e0b]'
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                  }`}
                >
                  {tab === 'active' ? 'Active / In Prep' : tab === 'on_hold' ? 'Held Bills' : tab}
                </button>
              ))}
            </div>

            {/* Bulk Actions */}
            {selectedOrderIds.length > 0 && (
              <button
                onClick={handleDeleteSelectedOrders}
                className="flex items-center gap-1.5 rounded-xl bg-red-950/60 border border-red-500/30 text-red-400 px-3.5 py-2 text-xs font-black hover:bg-red-900/30 transition shadow uppercase tracking-wider shrink-0"
                title={`Delete ${selectedOrderIds.length} Selected Orders`}
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                Delete Selected ({selectedOrderIds.length})
              </button>
            )}
          </div>

          {/* Search & Dates Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search order #, table, cashier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#1e293b] bg-slate-950/80 pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-[#f59e0b] transition placeholder-slate-500"
              />
            </div>

            {/* From Date Filter */}
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-xl border border-[#1e293b] bg-slate-950/80 px-3 py-2 text-xs text-slate-300 outline-none focus:border-[#f59e0b] transition cursor-pointer [color-scheme:dark]"
              />
            </div>

            {/* To Date Filter */}
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-xl border border-[#1e293b] bg-slate-955/80 px-3 py-2 text-xs text-slate-300 outline-none focus:border-[#f59e0b] transition cursor-pointer [color-scheme:dark]"
              />
            </div>

            {/* Clear Filters Button */}
            <div className="flex justify-end">
              {(searchQuery || fromDate || toDate || selectedStatus !== 'all') && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full md:w-auto flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-[#1e293b] text-slate-400 hover:text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                >
                  <X className="h-4 w-4 text-orange-500" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Orders list table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-[#f59e0b] mx-auto"></div>
              <p className="mt-3 text-xs text-slate-500 font-semibold tracking-wider">Syncing log records...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20 border-b border-[#1e293b]/30">
              <Receipt className="h-10 w-10 text-slate-600 mx-auto" />
              <p className="mt-3 text-xs text-slate-500 font-bold">No orders found</p>
              <p className="text-[10px] text-slate-600 mt-1">No matches found matching search queries or filters.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-[#1e293b]/60 bg-slate-950/45 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={paginatedOrders.length > 0 && paginatedOrders.every(o => selectedOrderIds.includes(o.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const pageIds = paginatedOrders.map(o => o.id);
                          setSelectedOrderIds(prev => Array.from(new Set([...prev, ...pageIds])));
                        } else {
                          const pageIds = paginatedOrders.map(o => o.id);
                          setSelectedOrderIds(prev => prev.filter(id => !pageIds.includes(id)));
                        }
                      }}
                      className="rounded border-[#1e293b] bg-slate-950 text-[#f59e0b] focus:ring-[#f59e0b] cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-6">Order Number</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Table</th>
                  <th className="py-3.5 px-4">Cashier Staff</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Total Paid</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/40">
                {paginatedOrders.map((order) => {
                  const paymentMethod = order.payments?.[0]?.payment_method || 'N/A';
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-900/20 transition duration-100 font-medium"
                    >
                      <td className="py-4 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrderIds(prev => [...prev, order.id]);
                            } else {
                              setSelectedOrderIds(prev => prev.filter(id => id !== order.id));
                            }
                          }}
                          className="rounded border-[#1e293b] bg-slate-950 text-[#f59e0b] focus:ring-[#f59e0b] cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-6 font-extrabold text-white">{order.order_number}</td>
                      <td className="py-4 px-4 text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString()} at{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-4 px-4 capitalize">{order.order_type.replace('_', ' ')}</td>
                      <td className="py-4 px-4">
                        {order.RestaurantTable?.table_number ? (
                          <span className="text-[#f59e0b] font-bold">{order.RestaurantTable.table_number}</span>
                        ) : (
                          <span className="text-slate-500 font-semibold">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">{order.cashier?.name || 'Self-Ordering'}</td>
                      <td className="py-4 px-4 capitalize">
                        {paymentMethod === 'N/A' && order.status === 'on_hold' ? (
                          <span className="text-slate-500 font-semibold italic">Unpaid Draft</span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                            {paymentMethod}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-black text-white">${parseFloat(order.total_amount).toFixed(2)}</td>
                      <td className="py-4 px-4">{getStatusBadge(order.status)}</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-lg border border-[#1e293b] bg-slate-950 px-3 py-1.5 text-[10px] font-extrabold text-[#f59e0b] hover:bg-slate-900 transition"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination controls */}
        {filteredOrders.length > 0 && (
          <div className="p-4 border-t border-[#1e293b]/60 bg-slate-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold text-slate-400">
            <div>
              Showing <span className="text-white">{startIndex + 1}</span> to{' '}
              <span className="text-white">
                {Math.min(startIndex + itemsPerPage, filteredOrders.length)}
              </span>{' '}
              of <span className="text-white">{filteredOrders.length}</span> orders
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-[#1e293b] bg-slate-950 px-3 py-1.5 font-bold hover:bg-slate-900 transition disabled:opacity-40 disabled:hover:bg-slate-955"
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
                className="rounded-lg border border-[#1e293b] bg-slate-950 px-3 py-1.5 font-bold hover:bg-slate-900 transition disabled:opacity-40 disabled:hover:bg-slate-955"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Receipt Modal Popup */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#1e293b] bg-[#0c101b] p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-3 mb-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Receipt className="h-4.5 w-4.5 text-[#f59e0b]" /> Detailed Order Receipt
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Receipt layout */}
            <div className="rounded-lg bg-white p-4 text-black font-mono text-[10px] shadow-inner border border-slate-200 leading-normal">
              <div className="text-center font-bold text-[12px] uppercase tracking-wide">
                {companyName}
              </div>
              <div className="text-center mb-3 text-[9px] text-slate-600">
                {companyAddress}<br />
                Ph: {companyPhone}
              </div>

              <div className="border-b border-dashed border-black pb-2 mb-2">
                Order Reference: {selectedOrder.order_number}<br />
                Timestamp: {new Date(selectedOrder.createdAt).toLocaleString()}<br />
                Staff Agent: {selectedOrder.cashier?.name || 'Self-Ordering'}<br />
                Order Type: {selectedOrder.order_type.toUpperCase()}<br />
                {selectedOrder.RestaurantTable && <>Table: {selectedOrder.RestaurantTable.table_number}<br /></>}
                Status: {selectedOrder.status.toUpperCase()}
              </div>

              <table className="w-full mb-3 border-b border-dashed border-black pb-2">
                <thead>
                  <tr className="border-b border-dashed border-black font-bold">
                    <th className="text-left py-1">Item</th>
                    <th className="text-center py-1">Qty</th>
                    <th className="text-right py-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((oi: any) => (
                      <tr key={oi.id}>
                        <td className="py-1 max-w-[140px] truncate">{oi.MenuItem?.name || 'Dish Item'}</td>
                        <td className="text-center py-1">{oi.quantity}</td>
                        <td className="text-right py-1">${(parseFloat(oi.unit_price) * oi.quantity).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center py-3 text-slate-400">No items listed</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="space-y-0.5 text-right font-bold">
                <div>Subtotal: ${parseFloat(selectedOrder.subtotal).toFixed(2)}</div>
                {parseFloat(selectedOrder.discount_amount) > 0 && (
                  <div className="text-red-600">Discount: -${parseFloat(selectedOrder.discount_amount).toFixed(2)}</div>
                )}
                <div>Tax: ${parseFloat(selectedOrder.tax_amount).toFixed(2)}</div>
                <div className="text-[11px] border-t border-black pt-1.5 font-black mt-1">
                  Grand Total: ${parseFloat(selectedOrder.total_amount).toFixed(2)}
                </div>
              </div>

              {selectedOrder.payments && selectedOrder.payments.length > 0 ? (
                <div className="mt-4 pt-2 border-t border-black text-[9px]">
                  Payment Method: {selectedOrder.payments[0].payment_method.toUpperCase()}<br />
                  TX Reference: {selectedOrder.payments[0].transaction_reference || 'N/A'}<br />
                  TX Status: {selectedOrder.payments[0].transaction_status.toUpperCase()}
                </div>
              ) : (
                <div className="mt-4 pt-2 border-t border-black text-[9px] text-red-600 font-bold italic text-center">
                  UNPAID / ON HOLD BILL
                </div>
              )}

              <div className="text-center mt-5 pt-3.5 border-t border-dashed border-black text-[9px]">
                Powered by Fly-POS
              </div>
            </div>

            {/* Update Status Control */}
            <div className="mt-5 rounded-xl border border-[#1e293b] bg-slate-950/40 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Update Order Status
                </span>
                {updatingStatus === selectedOrder.id && (
                  <span className="text-[10px] text-[#f59e0b] animate-pulse font-bold">
                    Saving...
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedOrder.status}
                  disabled={updatingStatus === selectedOrder.id}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                  className="w-full rounded-xl border border-[#1e293b] bg-slate-950/80 px-3 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition disabled:opacity-50"
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full mt-5 rounded-xl bg-slate-900 border border-[#1e293b] hover:bg-slate-800 py-2.5 text-xs font-bold text-slate-300 transition"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
