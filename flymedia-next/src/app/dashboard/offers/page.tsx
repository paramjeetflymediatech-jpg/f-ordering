'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Ticket, Percent, DollarSign, AlertCircle, Upload, Image, Sparkles, ShoppingBag } from 'lucide-react';

export default function OffersPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [type, setType] = useState<'discount' | 'buy_x_get_y'>('discount');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrder, setMinOrder] = useState('');

  // BOGO / Buy-X-Get-Y states
  const [buyItemId, setBuyItemId] = useState('');
  const [buyQty, setBuyQty] = useState('2');
  const [getItemId, setGetItemId] = useState('');
  const [getQty, setGetQty] = useState('2');

  // Banner image states
  const [bannerUrl, setBannerUrl] = useState('');
  const [uploading, setUploading] = useState(false);

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

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (res.ok && data.success) {
        const flatItems = (data.categories || []).flatMap((cat: any) => cat.MenuItems || []);
        setMenuItems(flatItems);
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchMenuItems();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'banner');

      const res = await fetch('/api/dashboard/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setBannerUrl(data.url);
      } else {
        alert(data.error || 'Upload failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading banner image.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    if (type === 'discount' && !discountValue) {
      alert('Please fill out discount value.');
      return;
    }

    if (type === 'buy_x_get_y' && (!buyItemId || !buyQty || !getItemId || !getQty)) {
      alert('Please select the BOGO items and quantities.');
      return;
    }

    try {
      const payload = {
        code,
        type,
        discountType,
        discountValue: type === 'buy_x_get_y' ? '0' : discountValue,
        minOrderAmount: minOrder || 0,
        banner_url: bannerUrl || null,
        buy_item_id: type === 'buy_x_get_y' ? buyItemId : null,
        buy_qty: type === 'buy_x_get_y' ? parseInt(buyQty, 10) : 0,
        get_item_id: type === 'buy_x_get_y' ? getItemId : null,
        get_qty: type === 'buy_x_get_y' ? parseInt(getQty, 10) : 0,
      };

      const res = await fetch('/api/dashboard/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCode('');
        setDiscountValue('');
        setMinOrder('');
        setBuyItemId('');
        setGetItemId('');
        setBannerUrl('');
        await fetchCoupons();
      } else {
        alert(data.error || 'Failed to create coupon.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error creating coupon.');
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

  const getItemName = (id: string) => {
    const item = menuItems.find(i => i.id === id);
    return item ? item.name : 'Item';
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full text-slate-200">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Tag className="h-6 w-6 text-orange-500" />
            Promotional Campaigns & Offers
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create discount campaign codes, configure Buy-X-Get-Y (BOGO) rules, upload promotion banners, and manage listings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT PANEL: CREATE CAMPAIGN */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Ticket className="h-5 w-5 text-orange-500" />
              Create Campaign / Offer
            </h2>

            <form onSubmit={handleAddCoupon} className="space-y-4 text-xs">
              
              {/* Type Switcher */}
              <div className="space-y-2">
                <label className="text-slate-400 font-bold uppercase tracking-wide">Offer Type</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
                  <button
                    type="button"
                    onClick={() => setType('discount')}
                    className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                      type === 'discount'
                        ? 'bg-orange-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Discount Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('buy_x_get_y')}
                    className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                      type === 'buy_x_get_y'
                        ? 'bg-orange-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Buy X Get Y (BOGO)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold uppercase tracking-wide">Promo Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BOGO50"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-orange-500 transition font-mono uppercase"
                />
              </div>

              {/* standard discount fields */}
              {type === 'discount' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-slate-400 font-bold uppercase tracking-wide">Discount Method</label>
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

                  <div>
                    <label className="text-slate-400 font-bold uppercase tracking-wide">
                      {discountType === 'percentage' ? 'Rate (%) *' : 'Amount ($) *'}
                    </label>
                    <input
                      type="number"
                      placeholder={discountType === 'percentage' ? '15' : '5.00'}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-orange-500 transition"
                    />
                  </div>
                </div>
              )}

              {/* BOGO Buy-X-Get-Y fields */}
              {type === 'buy_x_get_y' && (
                <div className="space-y-4 bg-slate-950/40 p-4 border border-slate-850 rounded-xl">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
                    BOGO Rules Config
                  </h3>

                  <div className="grid grid-cols-3 gap-2 items-end">
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-slate-400 font-bold uppercase tracking-wide text-[9px]">Buy Item *</label>
                      <select
                        value={buyItemId}
                        onChange={(e) => setBuyItemId(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-[10px] text-white focus:border-orange-500 outline-none"
                      >
                        <option value="">Select Item</option>
                        {menuItems.map(i => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-bold uppercase tracking-wide text-[9px]">Qty *</label>
                      <input
                        type="number"
                        min="1"
                        value={buyQty}
                        onChange={(e) => setBuyQty(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-[10px] text-white focus:border-orange-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-end">
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-slate-400 font-bold uppercase tracking-wide text-[9px]">Get Item (Free) *</label>
                      <select
                        value={getItemId}
                        onChange={(e) => setGetItemId(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-[10px] text-white focus:border-orange-500 outline-none"
                      >
                        <option value="">Select Item</option>
                        {menuItems.map(i => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-bold uppercase tracking-wide text-[9px]">Qty (Free) *</label>
                      <input
                        type="number"
                        min="1"
                        value={getQty}
                        onChange={(e) => setGetQty(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-[10px] text-white focus:border-orange-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-400 font-bold uppercase tracking-wide">Min Order spend ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 50.00"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-orange-500 transition"
                />
              </div>

              {/* Offer Banner Upload */}
              <div className="space-y-2">
                <label className="text-slate-400 font-bold uppercase tracking-wide">Offer Banner Image</label>
                
                {bannerUrl ? (
                  <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden group">
                    <img src={bannerUrl} alt="Offer Banner Preview" className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <button
                        type="button"
                        onClick={() => setBannerUrl('')}
                        className="rounded-lg bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-xl border border-dashed border-slate-800 bg-slate-950 hover:bg-slate-900/40 p-4 transition text-center flex flex-col items-center justify-center gap-2">
                    <Upload className="h-6 w-6 text-slate-500" />
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                      {uploading ? 'Uploading image...' : 'Click to Upload Banner (1200x400 recommended)'}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full mt-6 rounded-xl bg-orange-600 py-3 text-xs font-bold text-white hover:bg-orange-500 transition shadow-lg shadow-orange-600/10"
              >
                Create Coupon / Offer
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT PANEL: OFFERS LIST */}
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
                    className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden flex flex-col justify-between"
                  >
                    {/* Banner Image Preview inside directory */}
                    {coupon.banner_url && (
                      <div className="w-full h-24 overflow-hidden border-b border-slate-850">
                        <img src={coupon.banner_url} alt="Offer Banner" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-sm font-extrabold text-orange-400 tracking-wider">
                          {coupon.code}
                        </span>
                        <span className={`rounded px-2 py-0.5 text-[9px] font-black border ${
                          coupon.type === 'buy_x_get_y'
                            ? 'bg-purple-950/20 text-purple-400 border-purple-500/20'
                            : 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {coupon.type === 'buy_x_get_y' ? 'BOGO' : 'DISCOUNT'}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-400 leading-relaxed font-medium">
                        {coupon.type === 'buy_x_get_y' ? (
                          <p className="text-white font-bold flex items-center gap-1">
                            <ShoppingBag className="h-3.5 w-3.5 text-orange-500" />
                            Buy {coupon.buy_qty} {getItemName(coupon.buy_item_id)} get {coupon.get_qty} {getItemName(coupon.get_item_id)} Free
                          </p>
                        ) : (
                          <p>
                            Discount:{' '}
                            <span className="text-white font-bold">
                              {coupon.discount_type === 'percentage'
                                ? `${parseFloat(coupon.discount_value).toFixed(0)}%`
                                : `$${parseFloat(coupon.discount_value).toFixed(2)}`}
                            </span>
                          </p>
                        )}
                        <p>
                          Minimum Spend:{' '}
                          <span className="text-white font-bold">
                            ${parseFloat(coupon.min_order_amount).toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end p-4 border-t border-slate-900">
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
