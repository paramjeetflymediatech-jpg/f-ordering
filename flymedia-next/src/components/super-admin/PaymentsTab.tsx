'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Filter,
  ShieldCheck,
} from 'lucide-react';
import Pagination from './Pagination';

interface OrganizationShort {
  id: string;
  name: string;
}

export default function PaymentsTab() {
  const [paymentsData, setPaymentsData] = useState<any[]>([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(1);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentOrgFilter, setPaymentOrgFilter] = useState('');
  const [paymentStartDate, setPaymentStartDate] = useState('');
  const [paymentEndDate, setPaymentEndDate] = useState('');
  const [organizations, setOrganizations] = useState<OrganizationShort[]>([]);

  const fetchOrgs = async () => {
    try {
      const res = await fetch('/api/super-admin/organizations');
      const data = await res.json();
      if (data.success) {
        setOrganizations(data.organizations || []);
      }
    } catch (err: any) {
      console.error('Error fetching organizations for payments filter:', err);
    }
  };

  const fetchPayments = async (page = 1) => {
    setLoadingPayments(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (paymentOrgFilter) params.set('orgId', paymentOrgFilter);
      if (paymentStartDate) params.set('startDate', paymentStartDate);
      if (paymentEndDate) params.set('endDate', paymentEndDate);
      const res = await fetch(`/api/super-admin/payments?${params}`);
      const data = await res.json();
      if (data.success) {
        setPaymentsData(data.payments);
        setPaymentsTotal(data.total);
        setPaymentsTotalPages(data.totalPages);
        setPaymentsPage(page);
      }
    } catch (err: any) {
      console.error('Payments fetch error:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
    fetchPayments(1);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-orange-500 font-bold text-sm tracking-wider uppercase">
            <ShieldCheck className="h-4 w-4" /> Global Platform Console
          </div>
          <h1 className="text-3xl font-black text-white mt-1">
            Payment History
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Search, filter, and audit all transactions processed across the entire F-Ordering SaaS platform.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Filters Bar */}
        <div className="flex flex-wrap gap-3 items-end rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Filter by Org</label>
            <select
              value={paymentOrgFilter}
              onChange={(e) => setPaymentOrgFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
            >
              <option value="">All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Start Date</label>
            <input type="date" value={paymentStartDate} onChange={(e) => setPaymentStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition" />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">End Date</label>
            <input type="date" value={paymentEndDate} onChange={(e) => setPaymentEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition" />
          </div>
          <button
            onClick={() => fetchPayments(1)}
            className="flex items-center gap-2 rounded-xl bg-orange-600/20 border border-orange-600/30 px-4 py-2.5 text-xs font-bold text-orange-400 hover:bg-orange-600/30 transition"
          >
            <Filter className="h-3.5 w-3.5" /> Apply
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold">
          <Receipt className="h-3.5 w-3.5 text-slate-500" />
          <span><span className="text-white font-black">{paymentsTotal}</span> total transactions found</span>
        </div>

        {/* Payment Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            {loadingPayments ? (
              <div className="py-20 flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-orange-500" />
              </div>
            ) : paymentsData.length === 0 ? (
              <div className="py-20 text-center text-slate-500 font-semibold text-xs">
                No transactions found matching your filters.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Order #</th>
                    <th className="py-3.5 px-4">Organization</th>
                    <th className="py-3.5 px-4">Store</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paymentsData.map((pay: any) => {
                    const org = pay.Order?.Store?.Organization;
                    return (
                      <tr key={pay.id} className="hover:bg-slate-900/30 transition">
                        <td className="py-3.5 px-5 font-bold text-white">{pay.Order?.order_number || 'N/A'}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{org?.name || '—'}</div>
                          <div className="text-[10px] text-slate-500">{org?.slug || ''}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{pay.Order?.Store?.name || '—'}</td>
                        <td className="py-3.5 px-4 text-slate-400">{pay.Order?.customer?.name || 'Walk-in'}</td>
                        <td className="py-3.5 px-4 capitalize">{pay.payment_method}</td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(pay.createdAt).toLocaleDateString()}&nbsp;
                          <span className="text-[10px] text-slate-600">{new Date(pay.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            pay.transaction_status === 'success' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                          }`}>{pay.transaction_status}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-white">${parseFloat(pay.amount || 0).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={paymentsPage}
            totalPages={paymentsTotalPages}
            totalItems={paymentsTotal}
            itemsPerPage={20}
            onPageChange={(page) => fetchPayments(page)}
            itemLabel="transactions"
          />
        </div>
      </div>
    </div>
  );
}
