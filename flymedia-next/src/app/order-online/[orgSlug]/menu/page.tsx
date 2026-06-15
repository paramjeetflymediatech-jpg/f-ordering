'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Plus,
  Minus,
  ShoppingBag,
  MapPin,
  Phone,
  ArrowLeft,
  X,
  CheckCircle,
  AlertCircle,
  Calendar,
} from 'lucide-react';

interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  variant: any | null;
  addons: any[];
  notes?: string;
}

export default function PublicOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;

  // Store & Menu state
  const [store, setStore] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart & UI states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [activeModal, setActiveModal] = useState<'checkout' | 'success' | null>(null);
  
  // Checkout details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('takeaway');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [recentOrder, setRecentOrder] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Store Info and Menu by Organization Slug
  useEffect(() => {
    if (!orgSlug) return;

    const fetchStoreAndMenu = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Store Config by Org Slug
        const storeRes = await fetch(`/api/public/store?orgSlug=${orgSlug}`);
        const storeData = await storeRes.json();
        if (!storeRes.ok || !storeData.success) {
          throw new Error(storeData.error || 'Failed to load store information.');
        }
        setStore(storeData.store);
        setTables(storeData.tables || []);

        // 2. Fetch Menu by Org Slug
        const menuRes = await fetch(`/api/public/menu?orgSlug=${orgSlug}`);
        const menuData = await menuRes.json();
        if (!menuRes.ok || !menuData.success) {
          throw new Error(menuData.error || 'Failed to load menu listing.');
        }
        setCategories(menuData.categories || []);

        // 3. Fetch logged in customer info if exists (for prefilling)
        try {
          const custRes = await fetch('/api/public/customer/me');
          const custData = await custRes.json();
          if (custRes.ok && custData.success && custData.customer) {
            setCustomerName(custData.customer.name);
            setCustomerPhone(custData.customer.phone);
            setCustomerEmail(custData.customer.email || '');
          }
        } catch (e) {
          // Ignore if not logged in
        }

      } catch (err: any) {
        setError(err.message || 'An error occurred while setting up the terminal.');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreAndMenu();
  }, [orgSlug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-400 font-semibold tracking-wider">Loading Digital Menu...</p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100 text-center">
        <AlertCircle className="h-14 w-14 text-red-500 mb-4" />
        <h2 className="text-2xl font-black">Store Not Found</h2>
        <p className="mt-2 text-sm text-slate-400 max-w-sm">
          {error || 'The restaurant branch does not exist or may have been deactivated.'}
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 rounded-xl bg-slate-900 border border-slate-800 px-6 py-3 text-sm font-semibold hover:bg-slate-800 transition"
        >
          Return Home
        </button>
      </div>
    );
  }

  const allItems = categories.flatMap((cat) =>
    (cat.MenuItems || []).map((item: any) => ({
      ...item,
      categoryName: cat.name,
    }))
  );

  const filteredItems = allItems.filter((item) => {
    const matchesCategory = selectedCategoryId === 'all' || item.category_id === selectedCategoryId;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCartTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxRate = parseFloat(store.tax_rate) || 8.25;
    const tax = (subtotal * taxRate) / 100;
    return {
      subtotal,
      tax,
      total: subtotal + tax,
    };
  };

  const handleOpenItem = (item: any) => {
    setSelectedItem(item);
    setSelectedVariant(item.variants?.[0] || null);
    setSelectedAddons([]);
  };

  const handleToggleAddon = (addon: any) => {
    setSelectedAddons((prev) =>
      prev.some((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;

    let finalUnitPrice = parseFloat(selectedItem.price);
    if (selectedVariant) {
      finalUnitPrice += parseFloat(selectedVariant.additional_price || 0);
    }
    const addonPrice = selectedAddons.reduce((sum, addon) => sum + parseFloat(addon.price || 0), 0);
    finalUnitPrice += addonPrice;

    const cartItemId = `${selectedItem.id}-${selectedVariant?.id || 'none'}-${selectedAddons
      .map((a) => a.id)
      .sort()
      .join(',')}`;

    const existingIndex = cart.findIndex((item) => item.id === cartItemId);
    
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart((prev) => [
        ...prev,
        {
          id: cartItemId,
          menuItemId: selectedItem.id,
          name: selectedItem.name,
          price: finalUnitPrice,
          quantity: 1,
          variant: selectedVariant,
          addons: selectedAddons,
        },
      ]);
    }

    setSelectedItem(null);
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCart((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
      );
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || submitting) return;
    
    setSubmitting(true);
    try {
      const payload = {
        storeId: store.id,
        customerName,
        customerPhone,
        customerEmail,
        items: cart,
        orderType: orderType === 'dine_in' ? 'qr_order' : orderType,
        tableId: orderType === 'dine_in' ? selectedTableId : undefined,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
        notes: checkoutNotes,
      };

      const res = await fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setRecentOrder(data.order);
        setCart([]);
        setDeliveryAddress(''); // Reset address
        setActiveModal('success');
      } else {
        alert(data.error || 'Failed to place order.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while processing order.');
    } finally {
      setSubmitting(false);
    }
  };

  const totals = getCartTotal();

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 pb-24 lg:pb-0">
      
      {/* 1. STORE HEADER BANNER */}
      <div className="relative h-64 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent z-10"></div>
        <img
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200"
          alt="Banner"
          className="w-full h-full object-cover opacity-40"
        />
        
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                Online Ordering
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-white mt-2">
                {store.name}
              </h1>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  {store.address}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4 text-orange-500" />
                  {store.phone}
                </span>
              </div>
            </div>
            
            <Link
              href={`/order-online/book`}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-500 transition shadow-lg shadow-orange-600/20 self-start md:self-auto"
            >
              <Calendar className="h-4 w-4" />
              Book a Table
            </Link>
          </div>
        </div>
      </div>

      {/* 2. BODY LAYOUT */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COLUMN: MENU CATALOG */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-orange-500 transition"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setSelectedCategoryId('all')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  selectedCategoryId === 'all'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                }`}
              >
                All Items
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    selectedCategoryId === cat.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-12 border border-slate-800 rounded-2xl bg-slate-900/40">
              <p className="text-slate-500 font-semibold">No food items found matching your filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenItem(item)}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-4 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/5 transition duration-200 cursor-pointer"
                >
                  <div className="space-y-3">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-40 w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center rounded-xl bg-slate-950 text-slate-700 font-bold border border-slate-800">
                        No Image
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        {item.categoryName}
                      </span>
                      <h3 className="text-base font-extrabold text-white mt-1 line-clamp-1">{item.name}</h3>
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 min-h-[2rem]">
                        {item.description || 'Delicately cooked with selected spices.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
                    <span className="text-lg font-black text-white">
                      ${parseFloat(item.price).toFixed(2)}
                    </span>
                    <button className="flex items-center gap-1 rounded-xl bg-orange-950/60 border border-orange-500/30 px-3 py-1.5 text-xs font-bold text-orange-400 hover:bg-orange-600 hover:text-white transition">
                      <Plus className="h-3.5 w-3.5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DESKTOP CART PANEL */}
        <div className="w-full lg:w-96 shrink-0 hidden lg:block">
          <div className="sticky top-6 rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-orange-500" />
                Your Cart ({cart.reduce((s, c) => s + c.quantity, 0)})
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-slate-400 hover:text-red-400 font-bold"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[40vh]">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-semibold">
                  <ShoppingBag className="h-10 w-10 mx-auto stroke-[1.5] text-slate-600 mb-2" />
                  Your cart is currently empty
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-slate-950/40 border border-slate-800 p-3 rounded-xl"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-xs font-bold text-white truncate">{item.name}</p>
                      {item.variant && (
                        <p className="text-[10px] text-orange-400 mt-0.5">Variant: {item.variant.name}</p>
                      )}
                      {item.addons.length > 0 && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          Addons: {item.addons.map((a) => a.name).join(', ')}
                        </p>
                      )}
                      <p className="text-xs font-black text-white mt-1">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="rounded-lg bg-slate-900 p-1 border border-slate-800 text-slate-400 hover:text-white"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="rounded-lg bg-slate-900 p-1 border border-slate-800 text-slate-400 hover:text-white"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal</span>
                <span>${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Tax ({parseFloat(store.tax_rate).toFixed(2)}%)</span>
                <span>${totals.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 text-base font-black text-white">
                <span>Grand Total</span>
                <span>${totals.total.toFixed(2)}</span>
              </div>

              <button
                onClick={() => setActiveModal('checkout')}
                disabled={cart.length === 0}
                className="w-full mt-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 py-3.5 text-sm font-extrabold text-white hover:from-orange-500 hover:to-amber-400 transition disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-orange-600/10"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* MOBILE FLOATING CART BAR */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900 border-t border-slate-800 p-4 flex items-center justify-between lg:hidden backdrop-blur-md bg-opacity-95">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Active Cart</p>
            <p className="text-base font-black text-white mt-0.5">${totals.total.toFixed(2)}</p>
          </div>
          <button
            onClick={() => setActiveModal('checkout')}
            className="rounded-xl bg-orange-600 px-6 py-3 text-xs font-bold text-white hover:bg-orange-500 transition shadow-md shadow-orange-500/20"
          >
            Checkout ({cart.reduce((s, c) => s + c.quantity, 0)})
          </button>
        </div>
      )}

      {/* CUSTOMIZATION DIALOG */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
            <div className="relative h-48 bg-slate-950">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-10 rounded-full bg-slate-900/60 p-2 text-slate-400 hover:text-white border border-slate-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
              {selectedItem.image_url ? (
                <img src={selectedItem.image_url} alt="detail" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-700 font-extrabold text-lg">
                  No Image Available
                </div>
              )}
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[50vh]">
              <div>
                <h3 className="text-lg font-extrabold text-white">{selectedItem.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedItem.description}</p>
              </div>

              {selectedItem.variants && selectedItem.variants.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Variant</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedItem.variants.map((v: any) => {
                      const isSelected = selectedVariant?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                            isSelected
                              ? 'border-orange-500 bg-orange-950/30 text-orange-400'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <p>{v.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            +${parseFloat(v.additional_price).toFixed(2)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedItem.addons && selectedItem.addons.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Add-ons (Optional)</h4>
                  <div className="space-y-2">
                    {selectedItem.addons.map((addon: any) => {
                      const isSelected = selectedAddons.some((a) => a.id === addon.id);
                      return (
                        <div
                          key={addon.id}
                          onClick={() => handleToggleAddon(addon)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                            isSelected
                              ? 'border-orange-500 bg-orange-950/10 text-orange-400'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <span>{addon.name}</span>
                          <span className="font-bold text-slate-300">+${parseFloat(addon.price).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Final Price</p>
                <p className="text-xl font-black text-white mt-0.5">
                  ${(
                    parseFloat(selectedItem.price) +
                    parseFloat(selectedVariant?.additional_price || 0) +
                    selectedAddons.reduce((sum, a) => sum + parseFloat(a.price || 0), 0)
                  ).toFixed(2)}
                </p>
              </div>
              
              <button
                onClick={handleAddToCart}
                className="rounded-xl bg-orange-600 px-6 py-3.5 text-xs font-bold text-white hover:bg-orange-500 transition shadow-lg shadow-orange-600/20"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT DIALOG */}
      {activeModal === 'checkout' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-orange-500" />
                Submit Order Checkout
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCheckout} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Guest Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +1 555-0100"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. john@example.com (optional)"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Order Mode *
                </label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(['dine_in', 'takeaway', 'delivery'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setOrderType(mode)}
                      className={`py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition ${
                        orderType === mode
                          ? 'border-orange-500 bg-orange-950/20 text-orange-400'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      {mode.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {orderType === 'dine_in' && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Select Your Table *
                  </label>
                  <select
                    required
                    value={selectedTableId}
                    onChange={(e) => setSelectedTableId(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500 transition"
                  >
                    <option value="">-- Choose Table --</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id} disabled={t.status === 'occupied'}>
                        {t.table_number} ({t.seating_capacity} seats) {t.status === 'occupied' ? '• Occupied' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {orderType === 'delivery' && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Delivery Address *
                  </label>
                  <textarea
                    required
                    placeholder="Enter complete delivery address..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white h-16 outline-none resize-none focus:border-orange-500 transition"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Additional Notes
                </label>
                <textarea
                  placeholder="Kitchen instructions..."
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white h-16 outline-none resize-none focus:border-orange-500 transition"
                />
              </div>

              <div className="border-t border-slate-800 pt-4 mt-6 flex items-center justify-between text-white font-extrabold text-sm">
                <span>Total Payable (incl. Tax)</span>
                <span>${totals.total.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 rounded-xl bg-orange-600 py-3.5 text-sm font-extrabold text-white hover:bg-orange-500 transition shadow-lg shadow-orange-600/20 disabled:opacity-50"
              >
                {submitting ? 'Placing Order...' : 'Place Order & Pay at Counter'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL */}
      {activeModal === 'success' && recentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl text-center space-y-6">
            <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto animate-bounce" />
            
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Order Placed Successfully!</h3>
              <p className="text-xs text-slate-400">
                Your order is now in queue and has been sent directly to the kitchen display.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs font-semibold text-left">
              <div className="flex justify-between text-slate-400">
                <span>Order Number:</span>
                <span className="text-white font-bold">{recentOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Amount:</span>
                <span className="text-white font-extrabold">${parseFloat(recentOrder.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Status:</span>
                <span className="rounded bg-orange-950 px-2 py-0.5 text-[10px] text-orange-400 uppercase font-black">
                  {recentOrder.status}
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full rounded-xl bg-slate-800 py-3.5 text-xs font-extrabold text-slate-300 hover:bg-slate-700 transition"
            >
              Continue Browsing Menu
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
