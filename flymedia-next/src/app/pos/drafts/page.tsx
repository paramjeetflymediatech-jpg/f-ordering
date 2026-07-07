'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { usePOSStore } from '../../../lib/store';
import { POSSidebar } from '../../../components/pos/POSSidebar';
import {
  FolderOpen,
  Search,
  Clock,
  Trash2,
  Play,
  GitMerge,
  Users,
  MapPin,
  ShoppingCart,
  DollarSign,
  Receipt,
  Utensils,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';

export default function POSDraftsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const [drafts, setDrafts] = useState<any[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = (localStorage.getItem('pos-theme') || localStorage.getItem('dashboard-theme')) as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'dine_in' | 'takeaway' | 'delivery'>('all');
  const [selectedDraft, setSelectedDraft] = useState<any | null>(null);
  const [checkedDraftIds, setCheckedDraftIds] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState<string>('');

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        const formattedHeld = data.heldOrders.map((order: any) => ({
          id: order.id,
          timestamp: new Date(order.createdAt),
          items: order.items.map((oi: any) => ({
            id: `${oi.menu_item_id}-${oi.variant_id || ''}-${(oi.addons || []).map((a: any) => a.id).sort().join(',')}`,
            menuItemId: oi.menu_item_id,
            name: oi.MenuItem?.name || 'Dish Item',
            price: parseFloat(oi.unit_price),
            quantity: oi.quantity,
            notes: oi.notes,
            addons: oi.addons || [],
            variant: oi.variant_id ? { id: oi.variant_id, name: '', additional_price: 0 } : undefined,
          })),
          discountRate: 0,
          discountAmount: parseFloat(order.discount_amount) || 0,
          orderType: order.order_type,
          selectedTable: order.RestaurantTable
            ? { id: order.table_id, table_number: order.RestaurantTable.table_number }
            : null,
          notes: order.items[0]?.notes || undefined,
          customer: order.customer ? {
            name: order.customer.name,
            phone: order.customer.phone,
            email: order.customer.email,
          } : null,
          total: parseFloat(order.total_amount),
          subtotal: parseFloat(order.subtotal),
          tax: parseFloat(order.tax_amount),
        }));

        setDrafts(formattedHeld);

        // Sync the Zustand store count as well
        usePOSStore.setState({ heldOrders: formattedHeld });
      }
    } catch (err) {
      console.error('Failed to fetch drafts list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDrafts();
      fetch('/api/dashboard/profile')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setLogoUrl(data.organization?.logo || '');
          }
        })
        .catch((err) => console.error('Error fetching drafts profile logo:', err));
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#070b12] via-[#080d16] to-[#0c1220]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-[#f59e0b] mx-auto"></div>
          <p className="mt-4 text-slate-400 font-semibold tracking-wider">Syncing Drafts Dashboard...</p>
        </div>
      </div>
    );
  }

  // Filter drafts based on search and selected type
  const filteredDrafts = drafts.filter((d) => {
    const rawNotes = d.notes || '';
    const customerInfo = d.customer ? `${d.customer.name} ${d.customer.phone} ${d.customer.email}` : '';
    const tableInfo = d.selectedTable ? d.selectedTable.table_number : '';
    
    const matchesSearch =
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rawNotes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerInfo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tableInfo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || d.orderType === selectedType;

    return matchesSearch && matchesType;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setCheckedDraftIds(filteredDrafts.map((d) => d.id));
    } else {
      setCheckedDraftIds([]);
    }
  };

  const handleToggleCheck = (id: string) => {
    setCheckedDraftIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteDraft = async (id: string) => {
    if (!confirm('Are you sure you want to void this draft order?')) return;

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        if (selectedDraft?.id === id) {
          setSelectedDraft(null);
        }
        setCheckedDraftIds((prev) => prev.filter((item) => item !== id));
        fetchDrafts();
      } else {
        alert(data.message || 'Failed to void draft.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error voiding draft.');
    }
  };

  const handleResumeDraft = (id: string) => {
    const order = drafts.find((d) => d.id === id);
    if (order) {
      // Set the active held order in Zustand store
      usePOSStore.setState({
        cart: order.items,
        discountRate: 0,
        discountAmount: order.discountAmount,
        orderType: order.orderType,
        selectedTable: order.selectedTable,
        activeHeldOrderId: order.id,
      });

      // Redirect to POS terminal
      router.push('/pos');
    }
  };

  const handleMergeDrafts = async () => {
    if (checkedDraftIds.length < 2) return;
    if (!confirm(`Are you sure you want to merge these ${checkedDraftIds.length} draft bills into one?`)) return;

    const draftsToMerge = drafts.filter((d) => checkedDraftIds.includes(d.id));

    // Combine items
    const mergedItems: any[] = [];
    const mergedNotesList: string[] = [];

    for (const draft of draftsToMerge) {
      if (draft.notes) {
        // Remove prefixes when merging to keep it clean
        const cleanNotes = draft.notes.replace(/Delivery Address: |Notes: |Ready By: |Cart Ref: /g, '');
        if (cleanNotes) {
          mergedNotesList.push(cleanNotes);
        }
      }
      for (const item of draft.items) {
        const variantId = item.variant?.id || '';
        const addonsStr = item.addons ? item.addons.map((a: any) => a.id).sort().join(',') : '';
        const uniqueId = `${item.menuItemId}-${variantId}-${addonsStr}`;

        const existingIndex = mergedItems.findIndex((mi) => {
          const mvId = mi.variant?.id || '';
          const maStr = mi.addons ? mi.addons.map((a: any) => a.id).sort().join(',') : '';
          const mUniqueId = `${mi.menuItemId}-${mvId}-${maStr}`;
          return mUniqueId === uniqueId;
        });

        if (existingIndex > -1) {
          mergedItems[existingIndex].quantity += item.quantity;
        } else {
          mergedItems.push({
            ...item,
            id: uniqueId,
          });
        }
      }
    }

    try {
      // Delete old draft orders from the database
      for (const id of checkedDraftIds) {
        await fetch(`/api/orders/${id}`, {
          method: 'DELETE',
        });
      }

      // Determine a smart fallback order type
      let finalOrderType: 'dine_in' | 'takeaway' | 'delivery' = 'dine_in';
      let finalTable = null;
      if (draftsToMerge.some((d) => d.orderType === 'delivery')) {
        finalOrderType = 'delivery';
      } else if (draftsToMerge.some((d) => d.orderType === 'takeaway')) {
        finalOrderType = 'takeaway';
      } else {
        finalOrderType = 'dine_in';
        const firstTable = draftsToMerge.find((d) => d.orderType === 'dine_in' && d.selectedTable);
        if (firstTable) {
          finalTable = firstTable.selectedTable;
        }
      }

      const combinedNotes = mergedNotesList.length > 0 ? mergedNotesList.join(', ') : '';

      // Initialize POS store state with the merged details
      usePOSStore.setState({
        cart: mergedItems,
        orderType: finalOrderType,
        selectedTable: finalTable,
        discountRate: 0,
        discountAmount: 0,
        splitCount: 1,
        activeHeldOrderId: null, // Merged cart is saved as new active session
      });

      // Clear selection and redirect
      setCheckedDraftIds([]);
      router.push('/pos');
    } catch (error) {
      console.error('Error merging drafts:', error);
      alert('Failed to complete drafts merge.');
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'dine_in':
        return <Utensils className="h-3.5 w-3.5" />;
      case 'takeaway':
        return <ShoppingBag className="h-3.5 w-3.5" />;
      case 'delivery':
        return <Truck className="h-3.5 w-3.5" />;
      default:
        return <ShoppingCart className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className={`flex h-screen w-screen transition-colors duration-300 font-sans text-slate-100 overflow-hidden select-none ${theme === 'light' ? 'light-theme bg-[#f8fafc]' : 'bg-gradient-to-br from-[#070b12] via-[#080d16] to-[#0c1220]'}`}>
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <POSSidebar
        session={session}
        heldOrdersCount={drafts.length}
        activeTab="drafts"
        logoUrl={logoUrl}
      />

      {/* 2. MAIN WORKSPACE AREA */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: Drafts List */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800 bg-transparent">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-[#1e293b]/60 bg-[#0f1524]/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-[#f59e0b] shrink-0" /> Active Drafts & Held Bills
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Manage, edit, or merge restaurant tab drafts prior to final checkouts.
              </p>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              {checkedDraftIds.length >= 2 && (
                <button
                  onClick={handleMergeDrafts}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 px-3.5 py-2.5 text-xs sm:text-sm font-black text-slate-950 transition shadow-lg shadow-cyan-500/10 animate-fade-in"
                >
                  <GitMerge className="h-4 w-4" />
                  Merge ({checkedDraftIds.length})
                </button>
              )}
              
             
            </div>
          </div>

          {/* Filters & Search */}
          <div className="p-4 border-b border-[#1e293b]/60 bg-[#0f1524]/10 flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex gap-1.5">
              {(['all', 'dine_in', 'takeaway', 'delivery'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`rounded-lg px-3.5 py-2 text-sm font-bold transition duration-150 capitalize ${
                    selectedType === type
                      ? 'bg-[#1a2336] text-[#f59e0b] border-l border-[#f59e0b]'
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                  }`}
                >
                  {type === 'all' ? 'All Drafts' : type.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search table, customer, note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#1e293b] bg-slate-950/80 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-[#f59e0b] transition placeholder-slate-500"
              />
            </div>
          </div>

          {/* Drafts Grid list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
            {loading ? (
              <div className="text-center py-24">
                <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-[#f59e0b] mx-auto"></div>
                <p className="mt-3 text-sm text-slate-500 font-semibold tracking-wider">Syncing drafts log...</p>
              </div>
            ) : filteredDrafts.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-[#1e293b]/40 rounded-2xl bg-slate-950/10">
                <FolderOpen className="h-10 w-10 text-slate-650 mx-auto" />
                <p className="mt-3 text-sm text-slate-500 font-bold">No draft orders found</p>
                <p className="text-xs text-slate-600 mt-1">Held bills list is clean or matching filters returned empty.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDrafts.map((d) => {
                  const isSelected = selectedDraft?.id === d.id;
                  const isChecked = checkedDraftIds.includes(d.id);
                  
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDraft(d)}
                      className={`group rounded-2xl border p-6 transition cursor-pointer flex flex-col justify-between space-y-3 bg-[#0c101b]/50 hover:bg-[#0c101b]/80 relative ${
                        isSelected 
                          ? 'border-[#f59e0b] shadow-lg shadow-[#f59e0b]/5 bg-[#0f1524]/60' 
                          : 'border-[#1e293b]/60'
                      }`}
                    >
                      {/* Checkbox Overlay */}
                      <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCheck(d.id)}
                          className="h-4.5 w-4.5 rounded border-[#1e293b] bg-slate-950 text-[#f59e0b] focus:ring-[#f59e0b]/30 accent-[#f59e0b] cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-lg px-2 py-0.5 text-[11px] font-black uppercase flex items-center gap-1 ${
                            d.orderType === 'delivery' 
                              ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/50' 
                              : d.orderType === 'takeaway' 
                              ? 'bg-cyan-950 text-cyan-400 border border-cyan-900/50' 
                              : 'bg-amber-950 text-amber-400 border border-amber-900/50'
                          }`}>
                            {getOrderTypeIcon(d.orderType)}
                            {d.orderType.replace('_', ' ')}
                          </span>

                          <span className="text-xs font-bold text-slate-500">
                            {d.selectedTable ? `Table ${d.selectedTable.table_number}` : 'Reference Draft'}
                          </span>
                        </div>

                        <h3 className="text-sm font-black text-white truncate max-w-[200px] pt-1">
                          {d.customer?.name || 'Walk-in Guest'}
                        </h3>
                        {d.customer?.phone && (
                          <p className="text-xs text-slate-400 font-semibold">{d.customer.phone}</p>
                        )}
                      </div>

                      {/* Preview Items */}
                      <div className="border-t border-[#1e293b]/40 pt-3 text-xs text-slate-400 truncate max-w-[280px]">
                        {d.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>

                      <div className="flex items-center justify-between border-t border-[#1e293b]/40 pt-3">
                        <p className="text-xs text-slate-500 font-bold flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          {new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-base font-black text-[#f59e0b]">
                          ${d.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Detail Drawer / Action Panel */}
        <div className="w-96 shrink-0 bg-[#0c101b]/40 backdrop-blur-md border-l border-slate-800 flex flex-col justify-between overflow-hidden shadow-2xl">
          <button
                onClick={() => router.push('/pos')}
                className="flex max-w-fit items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition shadow-sm"
              >
                <X className="h-4 w-4" />
                Close
              </button>
          {selectedDraft ? (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Detail Header */}
              <div className="p-6 border-b border-[#1e293b]/60 bg-[#0f1524]/60">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Draft Detail Log</span>
                    <h2 className="text-base font-black text-white mt-0.5">
                      Draft Reference Code
                    </h2>
                    <p className="text-xs font-mono text-slate-500 mt-0.5 truncate max-w-[280px]">{selectedDraft.id}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteDraft(selectedDraft.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-900 transition border border-transparent hover:border-red-950/20"
                    title="Void Draft Order"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                {/* Customer Contact Details Card */}
                <div className="rounded-xl border border-[#1e293b] bg-slate-950/50 p-4 mt-4 space-y-2 text-sm font-semibold text-slate-400">
                  <div className="flex justify-between">
                    <span className="text-slate-550">Customer</span>
                    <span className="text-white font-extrabold">{selectedDraft.customer?.name || 'Walk-in Guest'}</span>
                  </div>
                  {selectedDraft.customer?.phone && (
                    <div className="flex justify-between">
                      <span className="text-slate-550">Mobile</span>
                      <span className="text-slate-300 font-bold">{selectedDraft.customer.phone}</span>
                    </div>
                  )}
                  {selectedDraft.customer?.email && (
                    <div className="flex justify-between">
                      <span className="text-slate-550">Email</span>
                      <span className="text-slate-300 truncate max-w-[150px]">{selectedDraft.customer.email}</span>
                    </div>
                  )}
                  {selectedDraft.selectedTable && (
                    <div className="flex justify-between">
                      <span className="text-slate-550">Dining Table</span>
                      <span className="text-[#f59e0b] font-black">{selectedDraft.selectedTable.table_number}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items Preview Scroll */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ordered Items Breakdown</p>
                
                <div className="space-y-3">
                  {selectedDraft.items.map((oi: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[#1e293b]/60 bg-[#0f1524]/20 p-4 flex justify-between items-start gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white leading-normal">
                          {oi.name}
                        </p>
                        {oi.variant?.name && (
                          <p className="text-xs text-[#f59e0b] font-medium leading-none mt-1">Size: {oi.variant.name}</p>
                        )}
                        {oi.addons && oi.addons.length > 0 && (
                          <p className="text-xs text-slate-400 italic mt-0.5 leading-tight">
                            + {oi.addons.map((a: any) => a.name).join(', ')}
                          </p>
                        )}
                        {oi.notes && (
                          <p className="text-xs text-slate-500 italic mt-1 leading-tight">
                            Kitchen Note: {oi.notes}
                          </p>
                        )}
                        <span className="text-xs text-slate-500 font-bold block mt-1.5">
                          {oi.quantity}x @ ${oi.price.toFixed(2)} each
                        </span>
                      </div>
                      <span className="text-sm font-bold text-white shrink-0 mt-0.5">
                        ${(oi.price * oi.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals & Quick Actions Drawer Footer */}
              <div className="p-6 border-t border-[#1e293b]/60 bg-[#0c101b] space-y-4">
                <div className="space-y-2 text-sm font-semibold text-slate-400">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-white">${selectedDraft.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedDraft.discountAmount > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>Discount</span>
                      <span>-${selectedDraft.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span className="text-white">${selectedDraft.tax.toFixed(2)}</span>
                  </div>
                  {selectedDraft.orderType === 'delivery' && (
                    <div className="flex justify-between">
                      <span>Delivery Surcharge</span>
                      <span className="text-white">$5.00</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-white border-t border-[#1e293b]/60 pt-2.5 mt-2">
                    <span>Total Estimated</span>
                    <span className="text-[#f59e0b]">${selectedDraft.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => {
                      alert('Simulating Kitchen Docket Printing Success.');
                    }}
                    className="rounded-xl border border-[#1e293b] bg-slate-900 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
                  >
                    <Receipt className="h-4 w-4 text-[#f59e0b]" />
                    Print Docket
                  </button>
                  <button
                    onClick={() => handleResumeDraft(selectedDraft.id)}
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 py-3 text-sm font-black text-slate-950 transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Resume Bill
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-600 p-6">
              <ShoppingCart className="h-12 w-12 stroke-[1.5] mb-2 text-[#1e293b]" />
              <p className="text-sm font-bold">No draft selected</p>
              <p className="text-xs mt-1 opacity-70">Click any draft card to inspect items list, billing details, and resume/merge tickets.</p>
            </div>
          )}
         
        </div>

      </div>
    </div>
  );
}
