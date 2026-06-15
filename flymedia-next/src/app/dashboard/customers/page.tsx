'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, Award, Calendar, Mail, Phone } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const filteredCustomers = customers.filter((cust) =>
    cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cust.phone.includes(searchQuery) ||
    cust.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-orange-500" />
            Customer Profiles Database
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse through customers registered during online checkouts or table reservations.
          </p>
        </div>
      </div>

      {/* CORE WORKSPACE: CUSTOMERS LIST */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
        
        {/* Filters */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-orange-500 transition"
          />
        </div>

        {/* Directory Table */}
        {loading ? (
          <p className="text-xs text-slate-400">Loading customer profiles...</p>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-semibold border border-dashed border-slate-800 rounded-xl">
            <Users className="h-10 w-10 mx-auto stroke-[1.5] text-slate-700 mb-2" />
            No customer profiles matched your query.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-bold">
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Loyalty Points</th>
                  <th className="p-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/20">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-900/25 transition">
                    <td className="p-4 font-bold text-white">{cust.name}</td>
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
                        <span className="text-slate-600 font-bold uppercase tracking-wider text-[10px]">None</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-300 font-bold">
                      <span className="inline-flex items-center gap-1 text-orange-400 font-bold">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
