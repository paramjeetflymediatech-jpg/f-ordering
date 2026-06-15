'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Ticket, Percent, DollarSign, AlertCircle } from 'lucide-react';

export default function OffersPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrder, setMinOrder] = useState('');

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/coupons');
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons || []);
      } else {
        setError(data.error || 'Failed to retrieve discount campaigns.');
      }
    } catch (err) {
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) return;

    try {
      const res = await fetch('/api/dashboard/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          discountType,
          discountValue,
          minOrderAmount: minOrder || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCode('');
        setDiscountValue('');
        setMinOrder('');
        await fetchCoupons();
      } else {
        alert(data.error || 'Failed to create coupon.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete/deactivate this coupon?')) return;

    try {
      const res = await fetch(`/api/dashboard/coupons?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await fetchCoupons();
      } else {
        alert(data.error || 'Failed to delete coupon.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Tag className="h-6 w-6 text-orange-500" />
            Promotional Coupons & Offers
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create discount campaign codes, set threshold limits, and track active coupon listings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT PANEL: ADD COUPON */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Ticket className="h-5 w-5 text-orange-500" />
              Create Coupon
            </h2>

            <form onSubmit={handleAddCoupon} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold uppercase tracking-wide">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME20"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold uppercase tracking-wide">Discount Type</label>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={`flex-1 py-2.5 rounded-xl border text-[10px] uppercase font-bold transition flex justify-center items-center gap-1.5 ${
                      discountType === 'percentage'
                        ? 'border-orange-500 bg-orange-950/20 text-orange-400'
                        : 'border-slate-800 bg-slate-950 text-slate-500'
                    }`}
                  >
                    <Percent className="h-3.5 w-3.5" />
                    Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed')}
                    className={`flex-1 py-2.5 rounded-xl border text-[10px] uppercase font-bold transition flex justify-center items-center gap-1.5 ${
                      discountType === 'fixed'
                        ? 'border-orange-500 bg-orange-950/20 text-orange-400'
                        : 'border-slate-800 bg-slate-950 text-slate-500'
                    }`}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Fixed Value
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-bold uppercase tracking-wide">
                    {discountType === 'percentage' ? 'Rate (%) *' : 'Amount ($) *'}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder={discountType === 'percentage' ? '15' : '5.00'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-orange-500 transition"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold uppercase tracking-wide">Min Order ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 25.00"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-6 rounded-xl bg-orange-600 py-3 text-xs font-bold text-white hover:bg-orange-500 transition shadow-lg shadow-orange-600/10"
              >
                Create Discount Code
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT PANEL: COUPON DIRECTORY */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
            <h2 className="text-base font-extrabold text-white">Active Campaigns</h2>

            {loading ? (
              <p className="text-xs text-slate-400">Loading coupons list...</p>
            ) : coupons.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-semibold border border-dashed border-slate-800 rounded-xl">
                <Tag className="h-10 w-10 mx-auto stroke-[1.5] text-slate-700 mb-2" />
                No promotional codes created yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-sm font-extrabold text-orange-400 tracking-wider">
                          {coupon.code}
                        </span>
                        <span className="rounded bg-emerald-950 px-2 py-0.5 text-[9px] text-emerald-400 font-black">
                          ACTIVE
                        </span>
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-slate-400">
                        <p>
                          Discount:{' '}
                          <span className="text-white font-bold">
                            {coupon.discount_type === 'percentage'
                              ? `${parseFloat(coupon.discount_value).toFixed(0)}%`
                              : `$${parseFloat(coupon.discount_value).toFixed(2)}`}
                          </span>
                        </p>
                        <p>
                          Minimum Order:{' '}
                          <span className="text-white font-bold">
                            ${parseFloat(coupon.min_order_amount).toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-3 mt-3 border-t border-slate-900">
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Deactivate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
