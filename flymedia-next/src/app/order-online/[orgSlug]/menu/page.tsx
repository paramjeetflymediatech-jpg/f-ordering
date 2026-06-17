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
  User,
  LogIn,
  UserPlus,
  LogOut,
  Award,
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

const getItemInitialsAndColor = (name: string) => {
  const words = name.trim().split(/\s+/);
  let initials = '';
  if (words.length > 0) {
    if (words.length >= 2) {
      initials = (words[0][0] + words[1][0]).toUpperCase();
    } else {
      const word = words[0];
      const match = word.match(/^([a-zA-Z])(.*?)(\d+)$/);
      if (match) {
        initials = (match[1] + match[3]).toUpperCase();
      } else {
        initials = word.substring(0, 2).toUpperCase();
      }
    }
  }

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-[#E07A5F]', // soft terracotta
    'bg-[#3D5A80]', // soft steel blue
    'bg-[#81B29A]', // soft sage green
    'bg-[#F2CC8F]', // soft mustard yellow
    'bg-[#98C1D9]', // soft ice blue
    'bg-[#A8DADC]', // soft mint
    'bg-[#457B9D]', // soft deep blue
  ];
  const color = colors[Math.abs(hash) % colors.length];
  return { initials, color };
};

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
  const [customer, setCustomer] = useState<any>(null);
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
            setCustomer(custData.customer);
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

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/public/customer/logout', { method: 'POST' });
      if (res.ok) {
        setCustomer(null);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
      }
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

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

  const categoriesWithFilteredItems = categories.map((cat) => {
    const matched = (cat.MenuItems || []).filter((item: any) => {
      const matchesCategory = selectedCategoryId === 'all' || item.category_id === selectedCategoryId;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    return { ...cat, filteredItems: matched };
  }).filter(cat => cat.filteredItems.length > 0);

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-slate-800 font-sans pb-24 lg:pb-0">
      
      {/* HEADER NAVBAR */}
      <header className="bg-[#2A0E07] border-b border-[#3E1A10] sticky top-0 z-40 px-6 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo & Name */}
          <Link href={`/order-online/${orgSlug}/menu`} className="flex items-center gap-3">
            {store.Organization?.logo ? (
              <img src={store.Organization.logo} alt={store.Organization.name} className="h-10 max-h-12 object-contain" />
            ) : (
              <span className="font-serif text-lg font-extrabold tracking-widest text-white uppercase">
                {store.Organization?.name || store.name}
              </span>
            )}
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-6 text-sm font-semibold">
            {store.website ? (
              <a href={store.website} className="text-slate-350 hover:text-white transition">
                Home
              </a>
            ) : (
              <Link href="/" className="text-slate-350 hover:text-white transition">
                Home
              </Link>
            )}
            <Link href={`/order-online/${orgSlug}/menu`} className="text-[#C39A3C] hover:text-white transition">
              Menu
            </Link>
            {store.website ? (
              <a href={`${store.website.replace(/\/$/, '')}/#about`} className="text-slate-350 hover:text-white transition">
                About Us
              </a>
            ) : (
              <Link href="/about" className="text-slate-350 hover:text-white transition">
                About Us
              </Link>
            )}
            <Link href={`/order-online/${orgSlug}/book`} className="text-slate-350 hover:text-white transition">
              Book Table
            </Link>
            {customer ? (
              <>
                <Link href={`/order-online/${orgSlug}/customer/profile`} className="text-slate-350 hover:text-[#C39A3C] transition flex items-center gap-1.5">
                  <User className="h-4 w-4" /> Hi, {customer.name}
                </Link>
                {customer.loyaltyPoints !== undefined && (
                  <span className="inline-flex items-center gap-1 rounded bg-[#C39A3C]/15 px-2 py-0.5 text-xs text-[#C39A3C] font-bold border border-[#C39A3C]/20">
                    <Award className="h-3.5 w-3.5" /> {customer.loyaltyPoints} PTS
                  </span>
                )}
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition" title="Log Out">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link href={`/order-online/${orgSlug}/customer/login`} className="text-slate-350 hover:text-white transition flex items-center gap-1">
                  <LogIn className="h-4 w-4" /> Login
                </Link>
                <Link href={`/order-online/${orgSlug}/customer/register`} className="bg-[#C39A3C] hover:bg-[#B38A2C] text-white px-3 py-1.5 rounded-lg transition text-xs font-bold uppercase tracking-wider">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* BODY LAYOUT */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* COLUMN 1: CATEGORY SIDEBAR (LEFT) */}
        <div className="w-64 shrink-0 hidden lg:block">
          <div className="sticky top-24 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Categories</h3>
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                selectedCategoryId === 'all'
                  ? 'bg-[#2A0E07] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  selectedCategoryId === cat.id
                    ? 'bg-[#2A0E07] text-white border-l-4 border-[#C39A3C]'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* COLUMN 2: MENU CATALOG (CENTER) */}
        <div className="flex-1 space-y-6">
          {/* Order Type & Search Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Select Order Type</h3>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setOrderType('takeaway')}
                className={`p-4 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                  orderType === 'takeaway'
                    ? 'border-[#2A0E07] bg-[#2A0E07]/5 text-[#2A0E07]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="font-extrabold text-sm uppercase tracking-wide">Take Away</span>
                <span className="text-[10px] text-slate-500 mt-1">Open 05:00 PM - 10:00 PM</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`p-4 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                  orderType === 'delivery'
                    ? 'border-[#2A0E07] bg-[#2A0E07]/5 text-[#2A0E07]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="font-extrabold text-sm uppercase tracking-wide">Delivery</span>
                <span className="text-[10px] text-slate-500 mt-1">Open 05:00 PM - 10:00 PM</span>
              </button>
            </div>

            <div className="relative mt-6 max-w-md mx-auto">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none focus:border-[#2A0E07] focus:bg-white transition"
              />
            </div>
          </div>

          {/* Menu Sections */}
          {categoriesWithFilteredItems.length === 0 ? (
            <div className="text-center py-12 border border-slate-200 bg-white rounded-2xl">
              <p className="text-slate-400 font-semibold">No food items found matching your filter.</p>
            </div>
          ) : (
            categoriesWithFilteredItems.map((cat) => (
              <div key={cat.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
                <div className="bg-[#2A0E07] px-4 py-3 border-b border-[#3E1A10] flex justify-between items-center">
                  <h2 className="font-serif font-black tracking-widest text-[#F9F6F0] text-sm uppercase">
                    {cat.name}
                  </h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {cat.filteredItems.map((item: any) => {
                    const { initials, color } = getItemInitialsAndColor(item.name);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleOpenItem(item)}
                        className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition cursor-pointer"
                      >
                        {/* Thumbnail / Initials */}
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-16 w-16 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className={`h-16 w-16 rounded-xl text-white font-extrabold flex items-center justify-center shrink-0 ${color}`}>
                            {initials}
                          </div>
                        )}

                        {/* Middle Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-800 text-sm">{item.name}</h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {item.description || 'Delicately cooked with selected spices.'}
                          </p>
                        </div>

                        {/* Price & Quantity Selector */}
                        <div className="flex items-center gap-6 shrink-0">
                          <span className="font-extrabold text-slate-800 text-sm">
                            ${parseFloat(item.price).toFixed(2)}
                          </span>

                          <div className="flex items-center gap-2">
                            {(() => {
                              const cartItems = cart.filter((c) => c.menuItemId === item.id);
                              const totalQty = cartItems.reduce((s, c) => s + c.quantity, 0);

                              if (totalQty > 0) {
                                return (
                                  <div
                                    className="flex items-center gap-2 border border-slate-200 rounded-lg p-1 bg-slate-50"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => {
                                        if (cartItems.length > 0) {
                                          updateQuantity(cartItems[0].id, cartItems[0].quantity - 1);
                                        }
                                      }}
                                      className="p-1 hover:text-red-500 transition text-slate-500"
                                    >
                                      <Minus className="h-3.5 w-3.5" />
                                    </button>
                                    <span className="text-xs font-bold text-slate-800 w-5 text-center">{totalQty}</span>
                                    <button
                                      onClick={() => {
                                        if (item.variants && item.variants.length > 0) {
                                          handleOpenItem(item);
                                        } else {
                                          updateQuantity(cartItems[0].id, cartItems[0].quantity + 1);
                                        }
                                      }}
                                      className="p-1 hover:text-[#2A0E07] transition text-slate-500"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                );
                              } else {
                                return (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if ((item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0)) {
                                        handleOpenItem(item);
                                      } else {
                                        setCart((prev) => [
                                          ...prev,
                                          {
                                            id: `${item.id}-none-`,
                                            menuItemId: item.id,
                                            name: item.name,
                                            price: parseFloat(item.price),
                                            quantity: 1,
                                            variant: null,
                                            addons: [],
                                          },
                                        ]);
                                      }
                                    }}
                                    className="flex items-center gap-1 rounded-lg bg-[#2A0E07]/5 border border-[#2A0E07]/20 px-3 py-1.5 text-xs font-bold text-[#2A0E07] hover:bg-[#2A0E07] hover:text-white transition"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add
                                  </button>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* COLUMN 3: DESKTOP CART PANEL (RIGHT) */}
        <div className="w-full lg:w-80 shrink-0 hidden lg:block">
          <div className="sticky top-24 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[#C39A3C]" />
                Your Cart ({cart.reduce((s, c) => s + c.quantity, 0)})
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-slate-400 hover:text-red-500 font-bold transition"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[40vh] divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  <ShoppingBag className="h-8 w-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                  Your cart is currently empty
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex justify-between items-center ${idx > 0 ? 'pt-3' : ''}`}
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-xs font-bold text-slate-700 truncate">{item.name}</p>
                      {item.variant && (
                        <p className="text-[10px] text-[#C39A3C] mt-0.5 font-semibold">Variant: {item.variant.name}</p>
                      )}
                      {item.addons.length > 0 && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5 font-semibold">
                          Addons: {item.addons.map((a) => a.name).join(', ')}
                        </p>
                      )}
                      <p className="text-xs font-black text-slate-800 mt-1">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    
                    <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="rounded p-0.5 text-slate-450 hover:bg-slate-100"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-800 w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="rounded p-0.5 text-slate-450 hover:bg-slate-100"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>Subtotal</span>
                <span>${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>Tax ({parseFloat(store.tax_rate).toFixed(2)}%)</span>
                <span>${totals.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-800">
                <span>Grand Total</span>
                <span>${totals.total.toFixed(2)}</span>
              </div>

              <button
                onClick={() => setActiveModal('checkout')}
                disabled={cart.length === 0}
                className="w-full mt-4 rounded-xl bg-[#2A0E07] py-3 text-xs font-bold text-white hover:bg-[#3E1A10] transition disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-[#2A0E07]/10"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* MOBILE FLOATING CART BAR */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#2A0E07] border-t border-[#3E1A10] p-4 flex items-center justify-between lg:hidden backdrop-blur-md bg-opacity-95">
          <div>
            <p className="text-[10px] text-slate-350 font-bold uppercase">Active Cart</p>
            <p className="text-base font-black text-white mt-0.5">${totals.total.toFixed(2)}</p>
          </div>
          <button
            onClick={() => setActiveModal('checkout')}
            className="rounded-xl bg-[#C39A3C] px-6 py-3 text-xs font-bold text-white hover:bg-[#B38A2C] transition shadow-md shadow-[#C39A3C]/20"
          >
            Checkout ({cart.reduce((s, c) => s + c.quantity, 0)})
          </button>
        </div>
      )}

      {/* CUSTOMIZATION DIALOG */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xl">
            <div className="relative h-48 bg-slate-100 flex items-center justify-center border-b border-slate-200">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-10 rounded-full bg-white/80 p-2 text-slate-500 hover:text-slate-800 border border-slate-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
              {selectedItem.image_url ? (
                <img src={selectedItem.image_url} alt="detail" className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-400 font-extrabold text-lg flex flex-col items-center gap-2">
                  <span className={`h-16 w-16 rounded-xl text-white font-extrabold flex items-center justify-center shadow-md ${getItemInitialsAndColor(selectedItem.name).color}`}>
                    {getItemInitialsAndColor(selectedItem.name).initials}
                  </span>
                  <span>{selectedItem.name}</span>
                </div>
              )}
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[50vh]">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800">{selectedItem.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{selectedItem.description}</p>
              </div>

              {selectedItem.variants && selectedItem.variants.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Variant</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedItem.variants.map((v: any) => {
                      const isSelected = selectedVariant?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                            isSelected
                              ? 'border-[#C39A3C] bg-[#C39A3C]/10 text-[#2A0E07]'
                              : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <p>{v.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
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
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Add-ons (Optional)</h4>
                  <div className="space-y-2">
                    {selectedItem.addons.map((addon: any) => {
                      const isSelected = selectedAddons.some((a) => a.id === addon.id);
                      return (
                        <div
                          key={addon.id}
                          onClick={() => handleToggleAddon(addon)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                            isSelected
                              ? 'border-[#C39A3C] bg-[#C39A3C]/5 text-[#2A0E07]'
                              : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <span>{addon.name}</span>
                          <span className="font-bold text-slate-600">+${parseFloat(addon.price).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Final Price</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">
                  ${(
                    parseFloat(selectedItem.price) +
                    parseFloat(selectedVariant?.additional_price || 0) +
                    selectedAddons.reduce((sum, a) => sum + parseFloat(a.price || 0), 0)
                  ).toFixed(2)}
                </p>
              </div>
              
              <button
                onClick={handleAddToCart}
                className="rounded-xl bg-[#2A0E07] px-6 py-3 text-xs font-bold text-white hover:bg-[#3E1A10] transition shadow-lg shadow-[#2A0E07]/20"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT DIALOG */}
      {activeModal === 'checkout' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-[#C39A3C]" />
                Submit Order Checkout
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCheckout} className="mt-4 space-y-4">
              {customer ? (
                <div className="bg-[#C39A3C]/10 border border-[#C39A3C]/25 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-800 font-bold flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#C39A3C]" />
                      Logged In Checkout
                    </span>
                    <span className="text-[10px] bg-[#C39A3C]/20 text-[#2D120B] px-2 py-0.5 rounded uppercase font-bold">
                      Account Active
                    </span>
                  </div>
                  <p className="text-slate-600">
                    Order will be linked to <strong className="text-slate-800">{customer.name}</strong> ({customer.email || 'no email'}).
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[#C39A3C] font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Award className="h-3 w-3" /> Earning Loyalty Points
                    </span>
                    <button 
                      type="button"
                      onClick={handleLogout}
                      className="text-[10px] text-red-500 hover:text-red-400 font-bold underline bg-transparent border-0 cursor-pointer"
                    >
                      Logout (Guest Order)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Ordering as a <strong className="text-[#C39A3C]">Guest</strong></span>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase font-bold">No Account</span>
                  </div>
                  <p className="text-slate-500 leading-relaxed">
                    Want to earn loyalty points and speed up future checkouts? 
                  </p>
                  <div className="flex gap-2.5 pt-1">
                    <Link 
                      href={`/order-online/${orgSlug}/customer/login`}
                      className="text-[#C39A3C] hover:text-[#B38A2C] font-bold underline"
                    >
                      Log In
                    </Link>
                    <span className="text-slate-300">|</span>
                    <Link 
                      href={`/order-online/${orgSlug}/customer/register`}
                      className="text-[#C39A3C] hover:text-[#B38A2C] font-bold underline"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#2A0E07] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +1 555-0100"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#2A0E07] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. john@example.com (optional)"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#2A0E07] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                          ? 'border-[#2A0E07] bg-[#2A0E07]/5 text-[#2A0E07]'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {mode.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {orderType === 'dine_in' && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Select Your Table *
                  </label>
                  <select
                    required
                    value={selectedTableId}
                    onChange={(e) => setSelectedTableId(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#2A0E07] focus:bg-white transition"
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
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Delivery Address *
                  </label>
                  <textarea
                    required
                    placeholder="Enter complete delivery address..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 h-16 outline-none resize-none focus:border-[#2A0E07] focus:bg-white transition"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Additional Notes
                </label>
                <textarea
                  placeholder="Kitchen instructions..."
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  className="w-full mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 h-16 outline-none resize-none focus:border-[#2A0E07] focus:bg-white transition"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 mt-6 flex items-center justify-between text-slate-800 font-extrabold text-sm">
                <span>Total Payable (incl. Tax)</span>
                <span>${totals.total.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 rounded-xl bg-[#2A0E07] py-3 text-xs font-bold text-white hover:bg-[#3E1A10] transition shadow-lg shadow-[#2A0E07]/10 disabled:opacity-50"
              >
                {submitting ? 'Placing Order...' : 'Place Order & Pay at Counter'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL */}
      {activeModal === 'success' && recentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl text-center space-y-6">
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto animate-bounce" />
            
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-800">Order Placed Successfully!</h3>
              <p className="text-xs text-slate-500">
                Your order is now in queue and has been sent directly to the kitchen display.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-2 text-xs font-semibold text-left">
              <div className="flex justify-between text-slate-500">
                <span>Order Number:</span>
                <span className="text-slate-800 font-bold">{recentOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Amount:</span>
                <span className="text-slate-800 font-extrabold">${parseFloat(recentOrder.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Status:</span>
                <span className="rounded bg-[#2A0E07]/10 px-2 py-0.5 text-[10px] text-[#2A0E07] uppercase font-black">
                  {recentOrder.status}
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
            >
              Continue Browsing Menu
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
