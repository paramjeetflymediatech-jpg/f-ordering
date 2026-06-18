'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Receipt,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import Pagination from './Pagination';

export default function RevenueTab() {
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loadingRevenue, setLoadingRevenue] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const orgList = revenueData?.organizations || [];
  const totalPages = Math.max(1, Math.ceil(orgList.length / itemsPerPage));
  const paginatedOrgs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return orgList.slice(start, start + itemsPerPage);
  }, [orgList, currentPage, itemsPerPage]);
  const handlePageChange = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const handlePerPageChange = (perPage: number) => { setItemsPerPage(perPage); setCurrentPage(1); };

  const fetchRevenue = async () => {
    setLoadingRevenue(true);
    try {
      const res = await fetch('/api/super-admin/revenue');
      const data = await res.json();
      if (data.success) setRevenueData(data);
    } catch (err: any) {
      console.error('Revenue fetch error:', err);
    } finally {
      setLoadingRevenue(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
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
            Revenue Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor SaaS-wide revenue, transactions, and metrics segmented by organization and package tiers.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Summary Widgets */}
        {loadingRevenue ? (
          <div className="flex justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-orange-500" />
          </div>
        ) : revenueData ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Platform Revenue</p>
                  <p className="text-2xl font-black text-white mt-1.5">${revenueData.platformTotal?.toFixed(2) ?? '0.00'}</p>
                  <span className="text-[9.5px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">All Orgs</span>
                </div>
                <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400"><TrendingUp className="h-6 w-6" /></div>
              </div>
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Orders</p>
                  <p className="text-2xl font-black text-white mt-1.5">{revenueData.platformOrders ?? 0}</p>
                  <span className="text-[9.5px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">Platform-wide</span>
                </div>
                <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400"><Receipt className="h-6 w-6" /></div>
              </div>
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Orgs</p>
                  <p className="text-2xl font-black text-white mt-1.5">{revenueData.organizations?.filter((o: any) => o.totalRevenue > 0).length ?? 0}</p>
                  <span className="text-[9.5px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">With Revenue</span>
                </div>
                <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400"><BarChart3 className="h-6 w-6" /></div>
              </div>
            </div>

            {/* Per-Org Revenue Table */}
            <div className="rounded-2xl border border-[#1e293b]/60 bg-slate-900/60 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-400" />
                <h2 className="text-sm font-black text-white">Revenue by Organization</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-5">Organization</th>
                      <th className="py-3.5 px-4">Plan</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Total Orders</th>
                      <th className="py-3.5 px-4">Completed</th>
                      <th className="py-3.5 px-4 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {paginatedOrgs.map((org: any) => (
                      <tr key={org.id} className="hover:bg-slate-900/30 transition">
                        <td className="py-4 px-5 font-bold text-white">
                          <div>{org.name}</div>
                          <div className="text-[10px] text-slate-500 font-semibold">{org.slug}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize border ${
                            org.subscription_plan === 'enterprise'
                              ? 'text-amber-400 bg-amber-500/10 border-amber-600/30'
                              : org.subscription_plan === 'professional'
                              ? 'text-sky-400 bg-sky-500/10 border-sky-600/30'
                              : 'text-slate-400 bg-slate-800 border-slate-700'
                          }`}>{org.subscription_plan}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                            org.status === 'active' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                          }`}>{org.status}</span>
                        </td>
                        <td className="py-4 px-4 font-semibold">{org.totalOrders}</td>
                        <td className="py-4 px-4 font-semibold text-emerald-400">{org.completedOrders}</td>
                        <td className="py-4 px-4 text-right font-black text-white">${org.totalRevenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={orgList.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handlePerPageChange}
                itemLabel="organizations"
              />
            </div>
          </>
        ) : (
          <div className="py-20 text-center text-slate-500 font-semibold">No revenue data available.</div>
        )}
      </div>
    </div>
  );
}
