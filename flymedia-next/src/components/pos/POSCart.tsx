import React from 'react';
import { Receipt, Trash2, ShoppingBag, DollarSign, X } from 'lucide-react';

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
  updateQuantity: (id: string, quantity: number) => void;
  setActiveModal: (modal: any) => void;
  allItems: any[];
  
  // Custom order type customization fields
  onOrderTypeClick?: () => void;
  orderType: string;
  customerName?: string;
  cartRef?: string;
  onClose?: () => void;
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
  updateQuantity,
  setActiveModal,
  allItems,
  onOrderTypeClick,
  orderType,
  customerName,
  cartRef,
  onClose,
}: POSCartProps) {
  const roles = session?.user?.roles || [];
  const isWaiter = roles.includes('Waiter');

  return (
    <aside className="w-full lg:w-96 h-full shrink-0 border-l border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex flex-col justify-between overflow-hidden shadow-2xl">
      {/* Header receipt metadata */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden p-2 rounded-xl text-slate-300 bg-slate-900 border border-slate-800 hover:text-white transition mr-1 flex items-center justify-center"
                title="Close Drawer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Receipt className="h-4.5 w-4.5 text-orange-400" /> Checkout & Receipt
            </h3>
          </div>
          <button
            onClick={clearCart}
            className="text-[10px] text-slate-400 hover:text-red-400 font-bold uppercase transition duration-150"
          >
            Clear All
          </button>
        </div>

        {/* Customer, Order Type & Hold columns buttons */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <button
            onClick={() => onOrderTypeClick?.()}
            className="rounded-xl border border-slate-800 bg-slate-950/50 py-2 px-1 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-900 hover:border-slate-700 transition flex flex-col items-center justify-center min-h-[46px] outline-none"
          >
            <span>Customer</span>
            <span className="text-[8.5px] text-orange-400 font-medium truncate max-w-[80px] mt-0.5">
              {customerName ? customerName : 'Add Guest'}
            </span>
          </button>
          <button
            onClick={() => onOrderTypeClick?.()}
            className="rounded-xl border border-slate-800 bg-slate-950/50 py-2 px-1 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-900 hover:border-slate-700 transition flex flex-col items-center justify-center min-h-[46px] outline-none"
          >
            <span className="capitalize">{orderType === 'dine_in' ? 'Dine-In' : orderType === 'takeaway' ? 'Take Away' : 'Delivery'}</span>
            <span className="text-[8.5px] text-orange-400 font-bold truncate max-w-[80px] mt-0.5">
              {orderType === 'dine_in' ? (selectedTable ? selectedTable.table_number : 'Select Table') : (cartRef || 'MA-001')}
            </span>
          </button>
          <button
            onClick={() => setActiveModal('resume')}
            className="rounded-xl border border-slate-800 bg-slate-950/50 py-2 px-1 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-900 hover:border-slate-700 transition flex flex-col items-center justify-center min-h-[46px] outline-none"
          >
            <span>Hold</span>
            <span className="text-[8.5px] text-orange-400 font-semibold mt-0.5">Queue</span>
          </button>
        </div>
      </div>

      {/* Scrollable Receipt items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/20">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-600 py-16">
            <ShoppingBag className="h-12 w-12 stroke-[1.5] mb-2 text-slate-800/80" />
            <p className="text-xs font-bold text-slate-500">Checkout cart is empty</p>
            <p className="text-[10px] mt-1 opacity-70">Add items from the menu grid</p>
          </div>
        ) : (
          cart.map((cartItem) => {
            // Resolve matching menu item to show thumbnail image and details
            const menuItem = allItems.find((i) => i.id === cartItem.menuItemId);

            // Resolve variant details dynamically
            const resolvedVariant = cartItem.variant
              ? (menuItem?.variants?.find((v: any) => v.id === cartItem.variant.id) || cartItem.variant)
              : null;

            // Resolve addons
            const addonsList = cartItem.addons || [];

            return (
              <div
                key={cartItem.id}
                className="flex items-start justify-between rounded-xl border border-slate-800 bg-slate-900/10 p-2.5 hover:border-slate-700/80 hover:bg-slate-900/20 transition-all duration-300"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-2">
                  {menuItem?.image_url ? (
                    <img
                      src={menuItem.image_url}
                      alt={cartItem.name}
                      className="h-10 w-10 rounded-lg object-cover shrink-0 mt-0.5 border border-slate-800/60"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center text-[9px] text-slate-650 shrink-0 mt-0.5">
                      No Img
                    </div>
                  )}

                  <div className="min-w-0 flex-1 pr-1.5">
                    <p className="text-xs font-bold text-white truncate">
                      {menuItem?.name || cartItem.name}
                      {resolvedVariant?.name && ` (${resolvedVariant.name})`}
                    </p>
                    {addonsList.length > 0 && (
                      <p className="text-[10px] text-slate-450 mt-0.5 leading-tight italic">
                        + {addonsList.map((a: any) => a.name).join(', ')}
                      </p>
                    )}
                    {cartItem.notes && (
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight italic">
                        Note: {cartItem.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-850 rounded-lg px-1.5 py-0.5">
                        <button
                          onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                          className="text-orange-400 hover:text-white transition px-1 font-bold text-[10px]"
                        >
                          -
                        </button>
                        <span className="text-[10px] font-extrabold text-white min-w-[12px] text-center">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                          className="text-orange-400 hover:text-white transition px-1 font-bold text-[10px]"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">
                        (${cartItem.price.toFixed(2)} each)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 mt-0.5">
                  <p className="text-xs font-bold text-slate-200">${(cartItem.price * cartItem.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => removeFromCart(cartItem.id)}
                    className="rounded-lg p-1 text-slate-600 hover:text-red-400 hover:bg-slate-900 transition-colors"
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
      <div className="p-4 border-t border-slate-805 bg-slate-950/40 space-y-2.5">
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

        {orderType === 'delivery' && (
          <div className="flex justify-between text-xs text-slate-400">
            <span>Delivery Fee</span>
            <span className="font-semibold text-white">$5.00</span>
          </div>
        )}

        <div className="flex justify-between border-t border-slate-800/80 pt-2.5 text-base font-black text-white">
          <span>Total Payable</span>
          <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent font-extrabold">${total.toFixed(2)}</span>
        </div>

        {isWaiter ? (
          <div className="grid grid-cols-2 gap-2 mt-3.5">
            <button
              onClick={() => setActiveModal('hold')}
              disabled={cart.length === 0}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-450 hover:to-orange-550 py-3 text-xs font-extrabold text-white transition disabled:opacity-50 flex justify-center items-center gap-1"
            >
              Send to Kitchen
            </button>
            <button
              onClick={() => {
                if (recentOrder) {
                  setActiveModal('receipt');
                } else {
                  alert('No orders placed in this session yet.');
                }
              }}
              className="rounded-xl border border-slate-850 bg-slate-900 hover:bg-slate-850 py-3 text-xs font-bold text-slate-300 hover:text-white transition"
            >
              Print Ticket
            </button>
          </div>
        ) : (
          <>
            {/* Quick billing utility modifiers */}
            <div className="grid grid-cols-3 gap-2 mt-3.5">
              <button
                onClick={() => setActiveModal('hold')}
                disabled={cart.length === 0}
                className="rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-900 py-2.5 text-[11px] font-bold text-slate-300 hover:text-white transition disabled:opacity-50"
              >
                Hold Bill
              </button>
              <button
                onClick={() => setActiveModal('split')}
                disabled={cart.length === 0}
                className="rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-900 py-2.5 text-[11px] font-bold text-slate-300 hover:text-white transition disabled:opacity-50"
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
                className="rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-900 py-2.5 text-[11px] font-bold text-slate-300 hover:text-white transition"
              >
                Print Ticket
              </button>
            </div>

            {/* Proceed Payment Main Button */}
            <button
              onClick={() => setActiveModal('checkout')}
              disabled={cart.length === 0}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-650 hover:from-emerald-450 hover:to-teal-600 py-3.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all mt-2 flex justify-center items-center gap-1.5"
            >
              <DollarSign className="h-4 w-4 animate-pulse" />
              Proceed to Payment
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
