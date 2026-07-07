import React, { useState } from 'react';
import {
  X,
  Clock,
  Trash2,
  CheckCircle,
  Settings,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// ─── POS Stripe Card Component ──────────────────────────────────────────────
function POSStripeCard({
  storeId,
  amount,
  onSuccess,
  onError,
  submitting,
  setSubmitting,
}: {
  storeId: string;
  amount: number;
  onSuccess: (intentId: string) => void;
  onError: (msg: string) => void;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const handleCardPay = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    onError('');
    try {
      const res = await fetch('/api/public/stripe/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, amount, currency: 'aud' }),
      });
      const data = await res.json();
      if (!data.clientSecret) {
        onError(data.error || 'Could not initiate payment.');
        setSubmitting(false);
        return;
      }
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) { setSubmitting(false); return; }

      const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        onError(error.message || 'Card declined.');
        setSubmitting(false);
        return;
      }
      if (paymentIntent?.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
    } catch {
      onError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[#1e293b] bg-slate-950 p-3">
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Card Details</p>
        <CardElement
          options={{
            style: {
              base: { fontSize: '14px', color: '#ffffff', fontFamily: 'system-ui, sans-serif', '::placeholder': { color: '#475569' } },
              invalid: { color: '#f87171' },
            },
          }}
        />
      </div>
      <button
        type="button"
        onClick={handleCardPay}
        disabled={submitting || !stripe}
        className="w-full rounded-xl bg-gradient-to-r from-[#635BFF] to-[#7C73FF] py-3 text-xs font-extrabold text-white hover:opacity-90 transition shadow-lg disabled:opacity-50"
      >
        {submitting ? 'Processing...' : `Charge $${amount.toFixed(2)} to Card`}
      </button>
    </div>
  );
}

interface POSModalsProps {
  activeModal: 'checkout' | 'hold' | 'resume' | 'split' | 'receipt' | 'table' | 'inventory' | 'settings' | null;
  setActiveModal: (modal: any) => void;
  selectedPayment: 'cash' | 'card' | 'upi';
  setSelectedPayment: (mode: any) => void;
  checkoutNotes: string;
  setCheckoutNotes: (notes: string) => void;
  handleCheckoutSubmit: (stripePaymentIntentId?: string) => void;
  total: number;
  subtotal: number;
  discount: number;
  tax: number;
  taxRate: number;
  recentOrder: any;
  setRecentOrder: (order: any) => void;
  clearCart: () => void;
  session: any;
  orderType: string;
  selectedTable: any;
  tables: any[];
  selectTable: (table: any) => void;
  inputTaxRate: number;
  setInputTaxRate: (rate: number) => void;
  handleSaveSettings: () => void;
  heldOrders: any[];
  resumeOrder: (id: string) => void;
  deleteHeldOrder: (id: string) => void;
  splitCount: number;
  setSplitCount: (count: number) => void;
  holdOrder: (notes?: string) => void;
  holdNotes: string;
  setHoldNotes: (notes: string) => void;
  fetchTables?: () => void;
  // Stripe
  stripeEnabled?: boolean;
  stripePromise?: ReturnType<typeof import('@stripe/stripe-js').loadStripe> | null;
  stripeStoreId?: string | null;
  posCardError?: string | null;
  setPosCardError?: (msg: string | null) => void;
  posStripeSubmitting?: boolean;
  setPosStripeSubmitting?: (v: boolean) => void;
}

export function POSModals({
  activeModal,
  setActiveModal,
  selectedPayment,
  setSelectedPayment,
  checkoutNotes,
  setCheckoutNotes,
  handleCheckoutSubmit,
  total,
  subtotal,
  discount,
  tax,
  taxRate,
  recentOrder,
  setRecentOrder,
  clearCart,
  session,
  orderType,
  selectedTable,
  tables,
  selectTable,
  inputTaxRate,
  setInputTaxRate,
  handleSaveSettings,
  heldOrders,
  resumeOrder,
  deleteHeldOrder,
  splitCount,
  setSplitCount,
  holdOrder,
  holdNotes,
  setHoldNotes,
  fetchTables,
  stripeEnabled,
  stripePromise,
  stripeStoreId,
  posCardError,
  setPosCardError,
  posStripeSubmitting,
  setPosStripeSubmitting,
}: POSModalsProps) {
  const getDummyTableBill = (table: any) => {
    if (table.status !== 'occupied' && table.status !== 'reserved') return null;
    let hash = 0;
    for (let i = 0; i < table.table_number.length; i++) {
      hash += table.table_number.charCodeAt(i);
    }
    const amount = (hash % 150) + 35.5;
    return amount.toFixed(2);
  };

  return (
    <>
      {/* 1. PAYMENT CHECKOUT DIALOG */}
      {activeModal === 'checkout' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#1e293b] bg-[#0c101b] p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-2">
              <h3 className="text-base font-black text-white">
                Select Payment Mode
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {(['cash', 'card', 'upi'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setSelectedPayment(mode);
                      if (setPosCardError) setPosCardError(null);
                    }}
                    className={`rounded-xl border p-3.5 text-xs font-bold capitalize transition duration-150 ${
                      selectedPayment === mode
                        ? 'border-[#f59e0b] shadow-md shadow-[#f59e0b]/5'
                        : 'border-[#1e293b] '
                    }`}
                  >
                    {mode === 'card' && stripeEnabled ? '💳 Card (Stripe)' : `${mode} Payment`}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Order Note / Special Requests
                </label>
                <textarea
                  placeholder="Kitchen prep details, allergy notifications..."
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  className="w-full mt-2 rounded-xl border border-[#1e293b] bg-slate-950 px-3 py-2 text-xs text-white h-16 outline-none resize-none focus:border-[#f59e0b] transition"
                />
              </div>

              <div className="rounded-xl border border-[#1e293b] bg-slate-950/60 p-4 text-xs space-y-2 mt-4">
                <div className="flex justify-between font-bold text-slate-400">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-400">
                  <span>Tax & Modifiers</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-white text-sm border-t border-[#1e293b]/60 pt-2">
                  <span>Total Payable</span>
                  <span className="text-[#f59e0b]">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Stripe Card Element — shown when card is selected and Stripe is enabled */}
              {selectedPayment === 'card' && stripeEnabled && stripePromise && stripeStoreId ? (
                <Elements stripe={stripePromise}>
                  <POSStripeCard
                    storeId={stripeStoreId}
                    amount={total}
                    onSuccess={(intentId) => {
                      handleCheckoutSubmit(intentId);
                    }}
                    onError={(msg) => { if (setPosCardError) setPosCardError(msg); }}
                    submitting={posStripeSubmitting ?? false}
                    setSubmitting={(v) => { if (setPosStripeSubmitting) setPosStripeSubmitting(v); }}
                  />
                  {posCardError && (
                    <p className="text-xs text-red-400 font-medium">⚠️ {posCardError}</p>
                  )}
                </Elements>
              ) : (
                <button
                  onClick={() => handleCheckoutSubmit()}
                  className="w-full mt-6 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:from-[#f59e0b]/90 hover:to-[#ea580c]/90 py-3 text-xs font-extrabold text-slate-950 shadow-md shadow-[#f59e0b]/10 transition"
                >
                  Finalize & Print Receipt
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. HOLD ORDER NOTES DIALOG */}
      {activeModal === 'hold' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#1e293b] bg-[#0c101b] p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-2">
              <h3 className="text-base font-black text-white">
                Hold Active Cart
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Hold Reference / Label Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 4 Order, Cust Joe..."
                  value={holdNotes}
                  onChange={(e) => setHoldNotes(e.target.value)}
                  className="w-full mt-2 rounded-xl border border-[#1e293b] bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition"
                />
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-1/2 rounded-xl bg-slate-900 py-3 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    holdOrder(holdNotes);
                    setHoldNotes('');
                    setActiveModal(null);
                  }}
                  className="w-1/2 rounded-xl bg-[#f59e0b] py-3 text-xs font-bold text-slate-950 hover:bg-[#f59e0b]/80 transition"
                >
                  Hold Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. RESUME HELD ORDER QUEUE DIALOG */}
      {activeModal === 'resume' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#1e293b] bg-[#0c101b] p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-2">
              <h3 className="text-base font-black text-white">
                Resume Held Orders
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto pr-1 space-y-3">
              {heldOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-semibold border border-dashed border-[#1e293b] rounded-xl text-xs">
                  No active orders currently held in queue.
                </div>
              ) : (
                heldOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-[#1e293b] bg-slate-950 p-4 flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {order.status === 'pending' ? (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-[8px] font-bold text-blue-400 uppercase tracking-wider">Online</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-[8px] font-bold text-amber-400 uppercase tracking-wider">Held</span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[8px] font-bold text-slate-400 uppercase tracking-wider">{order.orderType || 'Order'}</span>
                      </div>
                      <p className="font-extrabold text-white">
                        Label: {order.notes || order.orderNumber || 'Unnamed Order'}
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(order.timestamp).toLocaleTimeString()} • {order.items.length} items
                      </p>
                      {order.selectedTable && (
                        <p className="text-[9.5px] text-[#f59e0b] font-bold mt-0.5">
                          Assigned: {order.selectedTable.table_number}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          resumeOrder(order.id);
                          setActiveModal(null);
                        }}
                        className="rounded-lg bg-[#f59e0b] px-3.5 py-2 text-[10px] font-extrabold text-slate-950 hover:bg-[#f59e0b]/80 transition"
                      >
                        Resume
                      </button>
                      <button
                        onClick={() => deleteHeldOrder(order.id)}
                        className="rounded-lg bg-red-950/40 p-2 text-red-400 border border-red-950/50 hover:bg-red-900/30 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-xl bg-slate-900 border border-slate-800 px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition"
              >
                Closess
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SPLIT BILL COUNT MODIFIER */}
      {activeModal === 'split' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#1e293b] bg-[#0c101b] p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-2">
              <h3 className="text-base font-black text-white">
                Split Customer Bill
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Number of Splits / Persons
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => setSplitCount(splitCount - 1)}
                    className="rounded-xl bg-slate-950 border border-[#1e293b] px-4 py-2 font-bold text-white text-base hover:bg-slate-900 transition"
                  >
                    -
                  </button>
                  <span className="text-base font-black text-white min-w-[30px] text-center">
                    {splitCount}
                  </span>
                  <button
                    onClick={() => setSplitCount(splitCount + 1)}
                    className="rounded-xl bg-slate-950 border border-[#1e293b] px-4 py-2 font-bold text-white text-base hover:bg-slate-900 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-[#1e293b] bg-slate-950/60 p-4 text-xs space-y-2 mt-4 leading-normal">
                <div className="flex justify-between text-slate-400 font-bold">
                  <span>Grand Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-black text-sm border-t border-[#1e293b]/60 pt-2">
                  <span>Per Person Split</span>
                  <span className="text-[#f59e0b]">${(total / splitCount).toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setActiveModal(null)}
                  className="rounded-xl bg-[#f59e0b] px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-[#f59e0b]/80 transition"
                >
                  Apply Split
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TABLE SELECTOR DIALOG (LEGACY BACKUP) */}
      {activeModal === 'table' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#1e293b] bg-[#0c101b] p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-2">
              <h3 className="text-base font-black text-white">
                Dine-In Floor Tables
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

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
                    className={`p-3 rounded-xl border text-center transition ${
                      isSelected
                        ? 'border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b]'
                        : t.status === 'occupied'
                        ? 'border-red-900 bg-red-950/10 text-red-400'
                        : t.status === 'reserved'
                        ? 'border-[#ea580c] bg-[#ea580c]/10 text-[#ea580c]'
                        : 'border-[#1e293b] bg-slate-950 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <p className="font-bold text-xs">{t.table_number}</p>
                    <p className="text-[9px] text-slate-500 mt-1 capitalize">
                      {t.status} • {t.seating_capacity} seats {getDummyTableBill(t) && ` • $${getDummyTableBill(t)}`}
                    </p>
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
                className="text-[10px] font-bold text-red-400 hover:underline uppercase"
              >
                Clear Selection
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-800 transition"
              >
                Close list
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. SYSTEM INVENTORY ALERT PREVIEW */}
      {activeModal === 'inventory' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#1e293b] bg-[#0c101b] p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-2">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" /> Stock depletion warning
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed">
              <p className="text-slate-400 font-medium">
                The KDS (Kitchen Display System) reported critical depletion for ingredients:
              </p>

              <div className="rounded-xl border border-red-950/30 bg-red-950/10 p-3 space-y-2 text-red-400 font-semibold">
                <div>- Burger Buns: 3 units left (Restock Immediately)</div>
                <div>- Truffle Parmesan Extracts: 0 units left (Menu Item Hidden)</div>
                <div>- Fresh Mint Leaves: 8 units left (Refill Recommended)</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-800 transition"
              >
                Close Stock Alerts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. SYSTEM SETTINGS DIALOG */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#1e293b] bg-[#0c101b] p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1e293b] pb-2">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Settings className="h-4.5 w-4.5 text-[#f59e0b]" /> POS System Configuration
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Store Default Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={inputTaxRate}
                  onChange={(e) => setInputTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full mt-2 rounded-xl border border-[#1e293b] bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-[#f59e0b] transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Terminal Mode
                </label>
                <div className="mt-2 text-xs font-bold text-slate-500 bg-slate-950 border border-[#1e293b] p-3 rounded-xl">
                  Branch Mode: <span className="text-emerald-400 font-black">ACTIVE</span><br />
                  Host Socket IP: <span className="text-slate-300 font-semibold">127.0.0.1:3000</span>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-1/2 rounded-xl bg-slate-900 py-3 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition"
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="w-1/2 rounded-xl bg-[#f59e0b] py-3 text-xs font-bold text-slate-950 hover:bg-[#f59e0b]/80 transition"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. EPSON THERMAL RECEIPT DIALOG */}
      {activeModal === 'receipt' && recentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#1e293b] bg-[#0c101b] p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-sm font-black text-white text-center pb-2 flex justify-center gap-2 items-center">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              Receipt Printed Successfully
            </h3>

            {/* Simulated thermal receipt paper slip */}
            <div className="mt-4 rounded-lg bg-white p-4 text-black font-mono text-[10.5px] shadow-inner border border-slate-200 leading-normal">
              <div className="text-center font-bold text-[13px] mb-0.5 uppercase tracking-wide">
                TABLETASTE FOODS
              </div>
              <div className="text-center mb-3 text-[10px]">
                100 Silicon Valley Way, Suite A<br />
                Ph: +1 555-0199
              </div>

              <div className="border-b border-dashed border-black pb-2 mb-2">
                Order Reference: {recentOrder.orderNumber}<br />
                Timestamp: {new Date().toLocaleString()}<br />
                Terminal Cashier: {session?.user?.name || 'Sarah Connor'}<br />
                Order Type: {orderType.toUpperCase()}<br />
                {selectedTable && <>Table Assignment: {selectedTable.table_number}<br /></>}
              </div>

              <table className="w-full mb-3 border-b border-dashed border-black pb-2">
                <thead>
                  <tr className="border-b border-dashed border-black font-bold">
                    <th className="text-left py-1">Item</th>
                    <th className="text-center py-1">Qty</th>
                    <th className="text-right py-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrder.Items && recentOrder.Items.length > 0 ? (
                    recentOrder.Items.map((item: any) => (
                      <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="py-1.5 align-top">
                          <div className="font-bold">{item.MenuItem?.name || 'Dish Item'}</div>
                          {item.addons && item.addons.length > 0 && (
                            <div className="text-[9px] text-slate-500 italic mt-0.5 leading-none">
                              + {item.addons.map((a: any) => a.name).join(', ')}
                            </div>
                          )}
                          {item.notes && (
                            <div className="text-[9px] text-slate-500 italic mt-0.5 leading-none">
                              Note: {item.notes}
                            </div>
                          )}
                        </td>
                        <td className="text-center py-1.5 align-top">{item.quantity}</td>
                        <td className="text-right py-1.5 align-top">${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center py-3 text-slate-400">Order items printed</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="space-y-0.5 text-right font-bold">
                <div>Subtotal: ${parseFloat(recentOrder.subtotal || subtotal).toFixed(2)}</div>
                {parseFloat(recentOrder.discount || discount) > 0 && (
                  <div className="text-red-600">Discount: -${parseFloat(recentOrder.discount || discount).toFixed(2)}</div>
                )}
                <div>Tax ({recentOrder.taxRate || taxRate}%): ${parseFloat(recentOrder.tax || tax).toFixed(2)}</div>
                <div className="text-xs border-t border-black pt-1.5 font-black mt-1">
                  Amount Paid: ${parseFloat(recentOrder.total || total).toFixed(2)}
                </div>
              </div>

              <div className="text-center mt-5 pt-3.5 border-t border-dashed border-black text-[9.5px]">
                THANK YOU FOR DINING WITH US!<br />
                Powered by TableTaste POS SaaS
              </div>
            </div>

            <div className="mt-5 flex justify-center">
              <button
                onClick={() => {
                  setActiveModal(null);
                  setRecentOrder(null);
                  if (fetchTables) {
                    fetchTables();
                  }
                }}
                className="w-full rounded-xl bg-emerald-500 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
              >
                Clear Screen & Next Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
