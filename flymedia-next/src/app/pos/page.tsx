'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { usePOSStore } from '../../lib/store';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  LogOut,
  FolderOpen,
  DollarSign,
  Grid,
  ShoppingBag,
  Layers,
  Sparkles,
  UtensilsCrossed,
  Printer,
  ChevronRight,
} from 'lucide-react';

export default function POSPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Load POS State
  const {
    cart,
    discountRate,
    discountAmount,
    taxRate,
    orderType,
    selectedTable,
    heldOrders,
    splitCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setDiscount,
    setTaxRate,
    setOrderType,
    selectTable,
    setSplitCount,
    holdOrder,
    resumeOrder,
    getTotals,
  } = usePOSStore();

  // Component States
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tables, setTables] = useState<any[]>([]);
  
  // Modal controllers
  const [activeModal, setActiveModal] = useState<'checkout' | 'hold' | 'resume' | 'split' | 'receipt' | 'table' | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'card' | 'upi' | 'wallet'>('cash');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [holdNotes, setHoldNotes] = useState('');
  const [recentOrder, setRecentOrder] = useState<any>(null);

  // Fetch Menu and Tables
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/menu')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCategories(data.categories);
          }
        });

      fetch('/api/tables')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setTables(data.tables);
          }
        });
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-400 font-semibold">Initializing Terminal...</p>
        </div>
      </div>
    );
  }

  // Get totals calculation from Zustand
  const { subtotal, discount, tax, total } = getTotals();

  // Flatten items for catalog search/filtering
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

  const handleCheckout = async () => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart,
          orderType,
          tableId: selectedTable?.id,
          paymentMethod: selectedPayment,
          discountRate,
          discountAmount,
          taxRate,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRecentOrder(data.order);
        clearCart();
        setActiveModal('receipt');
      } else {
        alert(data.message || 'Checkout failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during checkout.');
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950 font-sans text-slate-100 overflow-hidden">
      
      {/* 1. TOP NAVBAR */}
      <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6 shrink-0">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="h-8 w-8 text-orange-500" />
          <h1 className="text-xl font-bold tracking-tight text-white">
            F-Ordering <span className="text-orange-500">POS</span>
          </h1>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
            Store: {(session?.user as any)?.store_id ? 'Branch Active' : 'Owner Root'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-white">{session?.user?.name}</p>
            <p className="text-xs text-slate-400">{(session?.user as any)?.roles?.[0] || 'Staff'}</p>
          </div>
          
          <button
            onClick={() => setActiveModal('resume')}
            className="relative rounded-lg bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 transition"
            title="Held Orders"
          >
            <FolderOpen className="h-5 w-5" />
            {heldOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                {heldOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-lg bg-red-950/40 p-2 text-red-400 hover:bg-red-900/40 transition"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* 2. CATEGORIES SIDEBAR */}
        <aside className="w-24 shrink-0 border-r border-slate-800 bg-slate-900/60 p-3 flex flex-col items-center gap-3 overflow-y-auto">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`flex w-full flex-col items-center gap-2 rounded-xl p-3 text-center transition ${
              selectedCategoryId === 'all'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Grid className="h-5 w-5" />
            <span className="text-[10px] font-medium">All Items</span>
          </button>
          
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`flex w-full flex-col items-center gap-2 rounded-xl p-3 text-center transition ${
                selectedCategoryId === cat.id
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="text-[10px] font-medium truncate w-full">{cat.name}</span>
            </button>
          ))}
        </aside>

        {/* 3. PRODUCT CATALOG GRID */}
        <main className="flex-1 p-6 flex flex-col overflow-y-auto min-w-0">
          
          {/* Filters & Search Row */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search products by code or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 pl-11 pr-4 text-white outline-none transition focus:border-orange-500"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setOrderType('dine_in')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  orderType === 'dine_in' ? 'bg-orange-500 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Dine In
              </button>
              <button
                onClick={() => setOrderType('takeaway')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  orderType === 'takeaway' ? 'bg-orange-500 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Takeaway
              </button>
              {orderType === 'dine_in' && (
                <button
                  onClick={() => setActiveModal('table')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition"
                >
                  {selectedTable ? `${selectedTable.table_number}` : 'Select Table'}
                </button>
              )}
            </div>
          </div>

          {/* Grid list */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-1">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  addToCart({
                    menuItemId: item.id,
                    name: item.name,
                    price: parseFloat(item.price),
                    quantity: 1,
                  })
                }
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-4 transition duration-200 hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/5 cursor-pointer"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-28 w-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-full items-center justify-center rounded-xl bg-slate-800 text-slate-600 font-bold">
                    No Image
                  </div>
                )}
                <div className="mt-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500">{item.categoryName}</span>
                  <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition truncate mt-1">
                    {item.name}
                  </h3>
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-base font-extrabold text-white">${parseFloat(item.price).toFixed(2)}</p>
                    <span className="rounded-lg bg-orange-950/60 p-1 text-orange-400">
                      <Plus className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* 4. ACTIVE CART SIDEBAR */}
        <aside className="w-96 shrink-0 border-l border-slate-800 bg-slate-900 flex flex-col justify-between overflow-hidden">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="h-5 w-5 text-orange-500" />
              Active Cart ({cart.reduce((s, c) => s + c.quantity, 0)})
            </h2>
            <button
              onClick={clearCart}
              className="text-xs text-slate-400 hover:text-red-400 font-semibold"
            >
              Clear All
            </button>
          </div>

          {/* List panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-600 py-12">
                <ShoppingBag className="h-12 w-12 stroke-[1.5] mb-2" />
                <p className="text-sm font-semibold">Cart is currently empty</p>
                <p className="text-xs mt-1">Click dishes to fill terminal bill</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3 hover:border-slate-700 transition"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-bold text-white truncate">{item.name}</p>
                    <p className="text-xs text-slate-500 mt-1">${item.price.toFixed(2)} each</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-2 text-xs font-bold text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="rounded-lg p-1 text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals panel */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3 shrink-0">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            
            {discount > 0 && (
              <div className="flex justify-between text-xs text-red-400">
                <span>Discounts ({discountRate}% + ${discountAmount})</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-xs text-slate-400">
              <span>Tax ({taxRate}%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between border-t border-slate-800 pt-2 text-lg font-black text-white">
              <span>Grand Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            {splitCount > 1 && (
              <div className="flex justify-between border-t border-dashed border-slate-800 pt-2 text-sm font-semibold text-orange-400">
                <span>Split Cost ({splitCount} ways)</span>
                <span>${(total / splitCount).toFixed(2)} / person</span>
              </div>
            )}

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => setActiveModal('hold')}
                className="rounded-xl border border-slate-800 bg-slate-900 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
              >
                Hold Order
              </button>
              <button
                onClick={() => setActiveModal('split')}
                className="rounded-xl border border-slate-800 bg-slate-900 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
              >
                Split Bill
              </button>
            </div>

            <button
              onClick={() => setActiveModal('checkout')}
              disabled={cart.length === 0}
              className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 py-4 text-sm font-extrabold text-white hover:from-orange-500 hover:to-amber-400 transition disabled:opacity-50 mt-2 flex justify-center items-center gap-2"
            >
              <DollarSign className="h-5 w-5" />
              Process Checkout
            </button>
          </div>
        </aside>
      </div>

      {/* MODALS RENDER PANEL */}
      
      {/* CHECKOUT DIALOG */}
      {activeModal === 'checkout' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white border-b border-slate-800 pb-2">
              Payment Checkout
            </h3>
            
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(['cash', 'card', 'upi', 'wallet'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setSelectedPayment(method)}
                      className={`py-3 rounded-xl border text-sm font-bold uppercase transition ${
                        selectedPayment === method
                          ? 'border-orange-500 bg-orange-950/40 text-orange-400'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Discounts Settings
                </label>
                <div className="flex gap-2 mt-2">
                  <input
                    type="number"
                    placeholder="Rate %"
                    value={discountRate || ''}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0, discountAmount)}
                    className="w-1/2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                  <input
                    type="number"
                    placeholder="Amount $"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscount(discountRate, parseFloat(e.target.value) || 0)}
                    className="w-1/2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Notes
                </label>
                <textarea
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  placeholder="e.g. Well done meat, packaging, invoice details..."
                  className="w-full mt-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white h-20 outline-none resize-none focus:border-orange-500"
                />
              </div>

              <div className="border-t border-slate-800 pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm text-white font-bold">
                  <span>Payable Amount</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-1/2 rounded-xl bg-slate-800 py-3 text-sm font-semibold text-slate-400 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckout}
                  className="w-1/2 rounded-xl bg-orange-600 py-3 text-sm font-bold text-white hover:bg-orange-500 transition"
                >
                  Confirm & Pay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HOLD ORDER DIALOG */}
      {activeModal === 'hold' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white border-b border-slate-800 pb-2">
              Hold Active Transaction
            </h3>
            
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400">
                  Provide identifier/notes for hold queue
                </label>
                <input
                  type="text"
                  placeholder="e.g., Guest at Table 3, Bill pending tip..."
                  value={holdNotes}
                  onChange={(e) => setHoldNotes(e.target.value)}
                  className="w-full mt-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-1/2 rounded-xl bg-slate-800 py-3 text-sm font-semibold text-slate-400 hover:bg-slate-700 transition"
                >
                  Discard
                </button>
                <button
                  onClick={() => {
                    holdOrder(holdNotes);
                    setHoldNotes('');
                    setActiveModal(null);
                  }}
                  className="w-1/2 rounded-xl bg-orange-600 py-3 text-sm font-bold text-white hover:bg-orange-500 transition"
                >
                  Hold Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESUME ORDER DIALOG (HOLD QUEUE) */}
      {activeModal === 'resume' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white border-b border-slate-800 pb-2">
              On-Hold Bills Queue
            </h3>
            
            <div className="mt-4 overflow-y-auto max-h-80 space-y-3">
              {heldOrders.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No held bills found</p>
              ) : (
                heldOrders.map((o) => (
                  <div
                    key={o.id}
                    className="flex justify-between items-center rounded-xl bg-slate-950 border border-slate-800 p-4"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">
                        {o.notes || 'Unnamed Held Order'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(o.timestamp).toLocaleTimeString()} • {o.items.reduce((s,i)=>s+i.quantity,0)} items
                      </p>
                    </div>
                    
                    <button
                      onClick={() => {
                        resumeOrder(o.id);
                        setActiveModal(null);
                      }}
                      className="rounded-lg bg-orange-600/20 px-3 py-1.5 text-xs font-bold text-orange-400 hover:bg-orange-600 hover:text-white transition"
                    >
                      Resume
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-xl bg-slate-800 px-6 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-700 transition"
              >
                Close Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SPLIT BILL DIALOG */}
      {activeModal === 'split' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white border-b border-slate-800 pb-2">
              Split Billing Modifiers
            </h3>
            
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400">
                  Number of paying customers
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => setSplitCount(splitCount - 1)}
                    className="rounded-lg bg-slate-800 p-2 hover:bg-slate-700"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-lg font-bold w-12 text-center text-white">{splitCount}</span>
                  <button
                    onClick={() => setSplitCount(splitCount + 1)}
                    className="rounded-lg bg-slate-800 p-2 hover:bg-slate-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Grand Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base text-orange-400 font-extrabold">
                  <span>Per Split Cost</span>
                  <span>${(total / splitCount).toFixed(2)} each</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setActiveModal(null)}
                  className="rounded-xl bg-orange-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition"
                >
                  Apply Split
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABLE SELECTOR DIALOG */}
      {activeModal === 'table' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white border-b border-slate-800 pb-2">
              Dine-In Floor Tables
            </h3>
            
            <div className="mt-4 grid grid-cols-3 gap-3">
              {tables.map((t) => {
                const isSelected = selectedTable?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      selectTable({ id: t.id, table_number: t.table_number });
                      setActiveModal(null);
                    }}
                    className={`p-4 rounded-xl border text-center transition ${
                      isSelected
                        ? 'border-orange-500 bg-orange-950/40 text-orange-400 shadow-md'
                        : t.status === 'occupied'
                        ? 'border-red-800 bg-red-950/20 text-red-400'
                        : t.status === 'reserved'
                        ? 'border-amber-800 bg-amber-950/20 text-amber-400'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <p className="font-bold text-sm">{t.table_number}</p>
                    <p className="text-[10px] text-slate-500 mt-1 capitalize">{t.status} • {t.seating_capacity} seats</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => {
                  selectTable(null);
                  setActiveModal(null);
                }}
                className="text-xs font-semibold text-red-400 hover:underline"
              >
                Clear Selected Table
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-xl bg-slate-800 px-6 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EPSON SIMULATED RECEIPT DIALOG */}
      {activeModal === 'receipt' && recentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-base font-extrabold text-white text-center pb-2 flex justify-center gap-2 items-center">
              <Printer className="h-5 w-5 text-emerald-400" />
              Receipt Printed successfully!
            </h3>
            
            {/* thermal invoice ticket */}
            <div className="mt-4 rounded-lg bg-white p-4 text-black font-mono text-[11px] shadow-inner border border-slate-200 leading-normal">
              <div className="text-center font-bold text-sm mb-1 uppercase">
                F-Ordering Foods
              </div>
              <div className="text-center mb-4">
                100 Silicon Valley Way, Suite A<br />
                Ph: +1 555-0199
              </div>

              <div className="border-b border-dashed border-black pb-2 mb-2">
                Order: {recentOrder.orderNumber}<br />
                Date: {new Date().toLocaleString()}<br />
                Cashier: {session?.user?.name || 'Staff'}<br />
                Type: {orderType.toUpperCase()}<br />
                {selectedTable && <>Table: {selectedTable.table_number}<br /></>}
              </div>

              <table className="w-full mb-3 border-b border-dashed border-black pb-2">
                <thead>
                  <tr className="border-b border-dashed border-black font-bold">
                    <th className="text-left py-1">Item</th>
                    <th className="text-center py-1">Qty</th>
                    <th className="text-right py-1">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length > 0 ? cart.map((item) => (
                    <tr key={item.id}>
                      <td className="py-1 max-w-[150px] truncate">{item.name}</td>
                      <td className="text-center py-1">{item.quantity}</td>
                      <td className="text-right py-1">${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="text-center py-4 text-slate-400 font-semibold">Simulating Reprint (Empty Active Cart)</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="space-y-1 text-right font-bold text-xs">
                <div>Subtotal: ${subtotal.toFixed(2)}</div>
                {discount > 0 && <div className="text-red-600">Discount: -${discount.toFixed(2)}</div>}
                <div>Tax ({taxRate}%): ${tax.toFixed(2)}</div>
                <div className="text-sm border-t border-black pt-1">Total Paid: ${total.toFixed(2)}</div>
              </div>

              <div className="text-center mt-6 pt-3 border-t border-dashed border-black">
                Thank You For Dining With Us!<br />
                Powered by F-Ordering POS
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => {
                  setActiveModal(null);
                  setRecentOrder(null);
                }}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition"
              >
                Done / Next Order
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
