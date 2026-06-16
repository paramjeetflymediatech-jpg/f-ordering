import React from 'react';
import { Receipt, Trash2, ShoppingBag, DollarSign } from 'lucide-react';

interface POSCartProps {
  cart: any[];
  selectedTable: any;
  tables: any[];
  session: any;
  subtotal: number;
  discount: number;
  discountRate: number;
  discountAmount: number;
  taxRate: number;
  tax: number;
  total: number;
  splitCount: number;
  recentOrder: any;
  clearCart: () => void;
  removeFromCart: (id: string) => void;
  setActiveModal: (modal: any) => void;
  allItems: any[];
}

export function POSCart({
  cart,
  selectedTable,
  tables,
  session,
  subtotal,
  discount,
  discountRate,
  discountAmount,
  taxRate,
  tax,
  total,
  splitCount,
  recentOrder,
  clearCart,
  removeFromCart,
  setActiveModal,
  allItems,
}: POSCartProps) {
  return (
    <aside className="w-96 shrink-0 border-l border-[#1e293b]/60 bg-[#0c101b] flex flex-col justify-between overflow-hidden shadow-2xl">
      {/* Header receipt metadata */}
      <div className="p-4 border-b border-[#1e293b]/60 bg-[#0f1524]/60">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
            <Receipt className="h-4.5 w-4.5 text-[#f59e0b]" /> Checkout & Receipt
          </h3>
          <button
            onClick={clearCart}
            className="text-[10px] text-slate-400 hover:text-red-400 font-bold uppercase"
          >
            Clear All
          </button>
        </div>

        {/* Table indicator card */}
        <div className="rounded-xl border border-[#1e293b] bg-slate-950/40 p-3 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-wider">
              {selectedTable ? selectedTable.table_number : 'Table Non-Selected'}
            </p>
            <p className="text-[9px] text-slate-500 mt-0.5">
              Guests: {selectedTable ? (tables.find((t) => t.id === selectedTable.id)?.seating_capacity || 4) : 0} • Dine In
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-white">Server</p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[80px]">{session?.user?.name || 'Sarah C.'}</p>
          </div>
        </div>
      </div>

      {/* Scrollable Receipt items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/20">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-600 py-16">
            <ShoppingBag className="h-12 w-12 stroke-[1.5] mb-2 text-[#1e293b]" />
            <p className="text-xs font-bold">Checkout cart is empty</p>
            <p className="text-[10px] mt-1 opacity-70">Add items from the menu grid</p>
          </div>
        ) : (
          cart.map((cartItem) => {
            // Resolve matching menu item to show thumbnail image
            const menuItem = allItems.find((i) => i.id === cartItem.menuItemId);

            return (
              <div
                key={cartItem.id}
                className="flex items-center justify-between rounded-xl border border-[#1e293b]/60 bg-[#0f1524]/40 p-2.5 hover:border-slate-800 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  {menuItem?.image_url ? (
                    <img
                      src={menuItem.image_url}
                      alt={cartItem.name}
                      className="h-10 w-10 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-[9px] text-slate-600 shrink-0">
                      No Img
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{cartItem.name}</p>
                    <p className="text-[10px] text-[#f59e0b] mt-0.5 font-semibold">
                      {cartItem.quantity}x <span className="text-slate-500 font-normal">(${cartItem.price.toFixed(2)})</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-xs font-bold text-white">${(cartItem.price * cartItem.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => removeFromCart(cartItem.id)}
                    className="rounded-lg p-1 text-slate-600 hover:text-red-400 hover:bg-slate-900 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pricing calculations footer */}
      <div className="p-4 border-t border-[#1e293b]/60 bg-[#0c101b] space-y-2.5">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Subtotal</span>
          <span className="font-semibold text-white">${subtotal.toFixed(2)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-xs text-red-400 font-semibold">
            <span>Discount ({discountRate}% + ${discountAmount})</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-xs text-slate-400">
          <span>Tax ({taxRate}%)</span>
          <span className="font-semibold text-white">${tax.toFixed(2)}</span>
        </div>

        <div className="flex justify-between border-t border-[#1e293b]/60 pt-2.5 text-base font-black text-white">
          <span>Total Payable</span>
          <span className="text-[#f59e0b]">${total.toFixed(2)}</span>
        </div>

        {/* Quick billing utility modifiers */}
        <div className="grid grid-cols-3 gap-2 mt-3.5">
          <button
            onClick={() => setActiveModal('hold')}
            disabled={cart.length === 0}
            className="rounded-xl border border-[#1e293b] bg-slate-900 py-2.5 text-[11px] font-bold text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
          >
            Hold Bill
          </button>
          <button
            onClick={() => setActiveModal('split')}
            disabled={cart.length === 0}
            className="rounded-xl border border-[#1e293b] bg-slate-900 py-2.5 text-[11px] font-bold text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
          >
            Split ({splitCount})
          </button>
          <button
            onClick={() => {
              if (recentOrder) {
                setActiveModal('receipt');
              } else {
                alert('No orders placed in this session yet.');
              }
            }}
            className="rounded-xl border border-[#1e293b] bg-slate-900 py-2.5 text-[11px] font-bold text-slate-300 hover:bg-slate-800 transition"
          >
            Print Ticket
          </button>
        </div>

        {/* Proceed Payment Main Button */}
        <button
          onClick={() => setActiveModal('checkout')}
          disabled={cart.length === 0}
          className="w-full rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 py-3.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/10 transition duration-150 disabled:opacity-50 mt-2 flex justify-center items-center gap-1.5"
        >
          <DollarSign className="h-4 w-4" />
          Proceed to Payment
        </button>
      </div>
    </aside>
  );
}
