'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Award,
  Calendar,
  Mail,
  Phone,
  Receipt,
  DollarSign,
  Clock,
  ChevronRight,
  X,
  CreditCard
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [filterPhone, setFilterPhone] = useState('');
  const [filterOrder, setFilterOrder] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active detail modal customer
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'payments'>('orders');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/customers');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
      } else {
        setError(data.error || 'Failed to retrieve customer profiles.');
      }
    } catch (err) {
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((cust) => {
    const matchesPhone = !filterPhone || cust.phone.includes(filterPhone);
    const matchesDate = !filterDate || new Date(cust.createdAt) >= new Date(filterDate);
    
    // Filter by order number (check if any nested order contains input)
    const matchesOrder = !filterOrder || (cust.Orders && cust.Orders.some((order: any) => 
      order.order_number.toLowerCase().includes(filterOrder.toLowerCase())
    ));

    return matchesPhone && matchesDate && matchesOrder;
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full min-h-screen bg-[#080b11] text-slate-100">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-[#1e293b]/60 pb-5">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-[#f59e0b]" />
            Customer Database Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse through registered restaurant customers, click a customer to inspect order lists & payment history.
          </p>
        </div>
      </div>

      {/* CORE WORKSPACE: CUSTOMERS LIST */}
      <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-6 space-y-6 shadow-xl">
        
        {/* Filters search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 items-end">
          <div className="relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Search Number</label>
            <input
              type="text"
              placeholder="e.g. 555..."
              value={filterPhone}
              onChange={(e) => setFilterPhone(e.target.value)}
              className="w-full rounded-xl border border-[#1e293b] bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition"
            />
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Search Order Number</label>
            <input
              type="text"
              placeholder="e.g. ORD-ONL..."
              value={filterOrder}
              onChange={(e) => setFilterOrder(e.target.value)}
              className="w-full rounded-xl border border-[#1e293b] bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition"
            />
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Joined After Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full rounded-xl border border-[#1e293b] bg-slate-950 px-3.5 py-2.5 text-xs text-slate-300 outline-none focus:border-[#f59e0b] transition"
            />
          </div>

          <button
            onClick={() => {
              setFilterPhone('');
              setFilterOrder('');
              setFilterDate('');
            }}
            className="rounded-xl border border-[#1e293b] bg-slate-900 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition w-full"
          >
            Clear Filters
          </button>
        </div>

        {/* Directory Table */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-[#f59e0b] mx-auto"></div>
            <p className="mt-3 text-xs text-slate-400 font-semibold tracking-wider">Loading directory profiles...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-semibold border border-dashed border-[#1e293b]/60 rounded-2xl">
            <Users className="h-10 w-10 mx-auto stroke-[1.5] text-slate-700 mb-2" />
            No customer profiles matched your query.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#1e293b]/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1e293b]/60 bg-[#0f1524] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Loyalty Points</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 bg-slate-950/10">
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    onClick={() => {
                      setSelectedCustomer(cust);
                      setActiveTab('orders');
                    }}
                    className="hover:bg-[#1a2336]/30 transition cursor-pointer group"
                  >
                    <td className="p-4 font-extrabold text-white group-hover:text-[#f59e0b] transition">{cust.name}</td>
                    <td className="p-4 text-slate-300 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-500" />
                        {cust.phone}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                      {cust.email ? (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-500" />
                          {cust.email}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-bold uppercase tracking-wider text-[9px]">None</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-300 font-bold">
                      <span className="inline-flex items-center gap-1 text-[#f59e0b] font-bold">
                        <Award className="h-3.5 w-3.5" />
                        {cust.loyalty_points}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        {new Date(cust.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="rounded-lg bg-slate-900 border border-[#1e293b] p-1.5 text-slate-400 hover:text-white transition group-hover:border-[#f59e0b]/40">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL DRAWER / OVERLAY MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-[#1e293b] bg-[#0c101b] p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal header */}
            <div className="flex justify-between items-start border-b border-[#1e293b] pb-4 shrink-0">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#f59e0b]" />
                  {selectedCustomer.name}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-3">
                  <span>Ph: {selectedCustomer.phone}</span>
                  {selectedCustomer.email && <span>Email: {selectedCustomer.email}</span>}
                  <span className="text-[#f59e0b] font-bold">Points: {selectedCustomer.loyalty_points}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg border border-[#1e293b] bg-slate-900 p-1.5 text-slate-400 hover:text-white transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal tabs */}
            <div className="flex gap-2 border-b border-slate-800 py-3 shrink-0">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'orders'
                    ? 'bg-[#f59e0b] text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Receipt className="h-4 w-4" />
                Orders History ({selectedCustomer.Orders?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'payments'
                    ? 'bg-[#f59e0b] text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Payments History
              </button>
            </div>

            {/* Modal Scrollable list contents */}
            <div className="flex-1 overflow-y-auto py-4">
              
              {/* ORDERS TAB */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  {!selectedCustomer.Orders || selectedCustomer.Orders.length === 0 ? (
                    <div className="text-center py-12 text-slate-600 font-semibold border border-dashed border-[#1e293b]/40 rounded-xl">
                      <Receipt className="h-10 w-10 mx-auto text-slate-700 stroke-[1.5] mb-2" />
                      No order history found for this customer.
                    </div>
                  ) : (
                    selectedCustomer.Orders.map((order: any) => {
                      // Status color
                      let statusColor = 'bg-slate-900 border-slate-800 text-slate-400';
                      if (order.status === 'completed') {
                        statusColor = 'bg-emerald-950/60 border-emerald-800/40 text-emerald-400';
                      } else if (order.status === 'pending') {
                        statusColor = 'bg-[#ea580c]/20 border-[#ea580c]/30 text-[#ea580c]';
                      } else if (order.status === 'cancelled') {
                        statusColor = 'bg-red-950/60 border-red-800/40 text-red-400';
                      }

                      return (
                        <div
                          key={order.id}
                          className="rounded-xl border border-[#1e293b]/60 bg-slate-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white text-xs">{order.order_number}</span>
                              <span className={`rounded-full border px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider ${statusColor}`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />
                              {new Date(order.createdAt).toLocaleString()}
                              <span className="text-slate-600">•</span>
                              <span className="uppercase">{order.order_type.replace('_', ' ')}</span>
                            </p>
                          </div>

                          <div className="text-right sm:text-right shrink-0">
                            <p className="text-[10px] text-slate-400">Total Charged</p>
                            <p className="text-sm font-black text-[#f59e0b] mt-0.5">${parseFloat(order.total_amount).toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* PAYMENTS TAB */}
              {activeTab === 'payments' && (
                <div className="space-y-3">
                  {/* Collect all payments from orders */}
                  {(!selectedCustomer.Orders || 
                    selectedCustomer.Orders.flatMap((o: any) => o.payments || []).length === 0) ? (
                    <div className="text-center py-12 text-slate-600 font-semibold border border-dashed border-[#1e293b]/40 rounded-xl">
                      <CreditCard className="h-10 w-10 mx-auto text-slate-700 stroke-[1.5] mb-2" />
                      No payment transaction history found for this customer.
                    </div>
                  ) : (
                    selectedCustomer.Orders.flatMap((order: any) => 
                      (order.payments || []).map((pay: any) => ({ ...pay, orderNumber: order.order_number, orderDate: order.createdAt }))
                    ).map((payment: any) => {
                      // Status colors
                      let badgeColor = 'bg-slate-900 border-slate-800 text-slate-400';
                      if (payment.transaction_status === 'success') {
                        badgeColor = 'bg-emerald-950/60 border-emerald-800/40 text-emerald-400';
                      } else if (payment.transaction_status === 'failed') {
                        badgeColor = 'bg-red-950/60 border-red-800/40 text-red-400';
                      } else if (payment.transaction_status === 'refunded') {
                        badgeColor = 'bg-purple-950/60 border-purple-800/40 text-purple-400';
                      }

                      return (
                        <div
                          key={payment.id}
                          className="rounded-xl border border-[#1e293b]/60 bg-slate-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white uppercase flex items-center gap-1">
                                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                                {payment.payment_method}
                              </span>
                              <span className={`rounded-full border px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider ${badgeColor}`}>
                                {payment.transaction_status}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">
                              Order: <span className="text-slate-300 font-semibold">{payment.orderNumber}</span>
                              {payment.transaction_reference && (
                                <>
                                  <span className="text-slate-600 mx-1.5">•</span>
                                  Ref: <span className="text-slate-300 font-semibold">{payment.transaction_reference}</span>
                                </>
                              )}
                              <span className="text-slate-600 mx-1.5">•</span>
                              {new Date(payment.createdAt || payment.orderDate).toLocaleString()}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-[10px] text-slate-400">Paid Amount</p>
                            <p className="text-sm font-black text-emerald-400 mt-0.5">${parseFloat(payment.amount).toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

            </div>

            {/* Modal footer close */}
            <div className="mt-4 border-t border-[#1e293b] pt-4 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-xl bg-slate-900 border border-[#1e293b] px-6 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition"
              >
                Close History
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
