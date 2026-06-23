'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Gift,
  Award,
  Users,
  Search,
  CheckCircle,
  AlertCircle,
  Save,
  ChevronRight,
  TrendingUp,
  Star
} from 'lucide-react';

export default function LoyaltyPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Loyalty Settings States
  const [pointsPerDollar, setPointsPerDollar] = useState('1');
  const [minRedeemPoints, setMinRedeemPoints] = useState('100');
  const [discountPerPoint, setDiscountPerPoint] = useState('0.05'); // 100 points = $5.00
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);

  // Customer Loyalty List
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const seedMockCustomers = () => {
    return [
      { id: 'c_1', name: 'John Doe', email: 'john@doe.com', phone: '+61 412345678', points: 350, spent: 350.00, status: 'Gold' },
      { id: 'c_2', name: 'Emma Watson', email: 'emma@watson.com', phone: '+61 455667788', points: 740, spent: 740.00, status: 'Platinum' },
      { id: 'c_3', name: 'Alice Smith', email: 'alice@smith.com', phone: '+61 498765432', points: 120, spent: 120.00, status: 'Silver' },
      { id: 'c_4', name: 'David Miller', email: 'david@miller.com', phone: '+61 422334455', points: 50, spent: 50.00, status: 'Silver' },
      { id: 'c_5', name: 'Robert Downey', email: 'robert@tony.com', phone: '+61 433322211', points: 1540, spent: 1540.00, status: 'VIP' },
    ];
  };

  useEffect(() => {
    if (!session || !(session.user as any)?.store_id) return;

    const storeId = (session.user as any).store_id;
    const enabledKey = `loyaltyEnabled_${storeId}`;
    const perDollarKey = `loyaltyPointsPerDollar_${storeId}`;
    const minRedeemKey = `loyaltyMinRedeem_${storeId}`;
    const discountKey = `loyaltyDiscountPerPoint_${storeId}`;
    const customersKey = `loyaltyCustomers_${storeId}`;

    const savedEnabled = localStorage.getItem(enabledKey);
    if (savedEnabled !== null) setLoyaltyEnabled(savedEnabled === 'true');
    else setLoyaltyEnabled(true);

    const savedPerDollar = localStorage.getItem(perDollarKey);
    if (savedPerDollar) setPointsPerDollar(savedPerDollar);
    else setPointsPerDollar('1');

    const savedMinRedeem = localStorage.getItem(minRedeemKey);
    if (savedMinRedeem) setMinRedeemPoints(savedMinRedeem);
    else setMinRedeemPoints('100');

    const savedDiscount = localStorage.getItem(discountKey);
    if (savedDiscount) setDiscountPerPoint(savedDiscount);
    else setDiscountPerPoint('0.05');

    const savedCustomers = localStorage.getItem(customersKey);
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    } else {
      setCustomers([]);
      localStorage.setItem(customersKey, JSON.stringify([]));
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

  const handleSaveSettings = () => {
    const storeId = (session?.user as any)?.store_id || 'default';
    const enabledKey = `loyaltyEnabled_${storeId}`;
    const perDollarKey = `loyaltyPointsPerDollar_${storeId}`;
    const minRedeemKey = `loyaltyMinRedeem_${storeId}`;
    const discountKey = `loyaltyDiscountPerPoint_${storeId}`;

    localStorage.setItem(enabledKey, loyaltyEnabled.toString());
    localStorage.setItem(perDollarKey, pointsPerDollar);
    localStorage.setItem(minRedeemKey, minRedeemPoints);
    localStorage.setItem(discountKey, discountPerPoint);
    triggerAlert('Loyalty program settings updated successfully.');
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <Gift className="h-6 w-6 text-orange-500 animate-pulse" />
            Loyalty Rewards
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Design customer reward rules, configure point redemption conversion values, and inspect client ledger tallies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs">
        
        {/* Left Column: Loyalty Program Rule Form */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-[#0c101b] p-6 space-y-6 self-start shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Award className="h-4.5 w-4.5 text-orange-500" />
                Reward Schema
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Rules for point generation and redemptions.</p>
            </div>
            
            <input
              type="checkbox"
              checked={loyaltyEnabled}
              onChange={(e) => setLoyaltyEnabled(e.target.checked)}
              className="h-4.5 w-8 rounded-full accent-orange-500 cursor-pointer bg-slate-950 border border-slate-800"
            />
          </div>

          {loyaltyEnabled ? (
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Points Earned per $1.00 Spent</label>
                <input
                  type="number"
                  value={pointsPerDollar}
                  onChange={(e) => setPointsPerDollar(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Minimum Points to Redeem</label>
                <input
                  type="number"
                  value={minRedeemPoints}
                  onChange={(e) => setMinRedeemPoints(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Redemption Discount per Point ($)</label>
                <div className="flex items-center rounded-xl bg-slate-950 border border-slate-850 px-3 py-1">
                  <span className="text-slate-500 text-xs font-bold mr-1">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={discountPerPoint}
                    onChange={(e) => setDiscountPerPoint(e.target.value)}
                    className="w-full bg-transparent border-none outline-none font-bold text-white text-xs"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                  Example: 100 points = ${(100 * parseFloat(discountPerPoint || '0')).toFixed(2)} cash discount.
                </span>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full rounded-xl bg-orange-600 py-3 text-xs font-bold text-white hover:bg-orange-500 transition shadow flex items-center justify-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                Save Settings
              </button>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 font-bold">
              Loyalty program is currently disabled. Toggle the checkbox above to enable configurations.
            </div>
          )}
        </div>

        {/* Right Column: Customer Ledger database */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-[#0c101b] p-6 space-y-6 shadow-xl animate-fade-in">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-sky-500" />
              Customer Points Ledger
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Inspect active user accounts, point levels, and spent metrics.</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search customers by Name, Phone or Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
            />
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-500 font-bold">
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Phone / Contact</th>
                  <th className="p-4 text-center">Reward Rank</th>
                  <th className="p-4 text-right">Points Level</th>
                  <th className="p-4 text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-650 font-bold">No matching customer entries.</td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="border-b border-slate-900 text-slate-300 hover:bg-slate-900/10">
                      <td className="p-4">
                        <div className="font-bold text-white text-xs">{c.name}</div>
                        <div className="text-[10px] text-slate-500 block mt-0.5">{c.email || 'No email registered'}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-400">{c.phone}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase border ${
                          c.status === 'VIP'
                            ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20'
                            : c.status === 'Platinum'
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                            : c.status === 'Gold'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}>
                          <Star className="h-3 w-3 fill-current" />
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-orange-400">{c.points} pts</td>
                      <td className="p-4 text-right font-bold text-white">${c.spent.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
