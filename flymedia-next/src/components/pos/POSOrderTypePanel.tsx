import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  ShoppingBag, 
  Utensils, 
  Truck, 
  Calendar, 
  Clock, 
  MapPin, 
  X, 
  Check, 
  User, 
  Phone, 
  Mail,
  Users
} from 'lucide-react';

interface POSOrderTypePanelProps {
  onBack: () => void;
  onSave: () => void;
  
  // Tables
  tables: any[];
  selectedTable: any;
  selectTable: (table: any) => void;

  // Active Store Order Type
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  setOrderType: (type: 'dine_in' | 'takeaway' | 'delivery') => void;

  // Form Fields States & Setters
  orderNotes: string;
  setOrderNotes: (val: string) => void;
  customerName: string;
  setCustomerName: (val: string) => void;
  customerPhone: string;
  setCustomerPhone: (val: string) => void;
  customerEmail: string;
  setCustomerEmail: (val: string) => void;
  cartRef: string;
  setCartRef: (val: string) => void;
  readyDate: string;
  setReadyDate: (val: string) => void;
  readyTime: string;
  setReadyTime: (val: string) => void;
  dineInCovers: string;
  setDineInCovers: (val: string) => void;

  // Delivery Address fields
  deliveryAddress: string;
  setDeliveryAddress: (val: string) => void;
  deliveryAddress2: string;
  setDeliveryAddress2: (val: string) => void;
  deliveryCity: string;
  setDeliveryCity: (val: string) => void;
  deliveryZip: string;
  setDeliveryZip: (val: string) => void;
  deliveryState: string;
  setDeliveryState: (val: string) => void;
  deliveryCountry: string;
  setDeliveryCountry: (val: string) => void;
}

export function POSOrderTypePanel({
  onBack,
  onSave,
  tables,
  selectedTable,
  selectTable,
  orderType,
  setOrderType,
  orderNotes,
  setOrderNotes,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerEmail,
  setCustomerEmail,
  cartRef,
  setCartRef,
  readyDate,
  setReadyDate,
  readyTime,
  setReadyTime,
  dineInCovers,
  setDineInCovers,
  deliveryAddress,
  setDeliveryAddress,
  deliveryAddress2,
  setDeliveryAddress2,
  deliveryCity,
  setDeliveryCity,
  deliveryZip,
  setDeliveryZip,
  deliveryState,
  setDeliveryState,
  deliveryCountry,
  setDeliveryCountry,
}: POSOrderTypePanelProps) {
  const [deliveryTab, setDeliveryTab] = useState<'address' | 'cost'>('address');

  // Prefill current date/time if empty
  React.useEffect(() => {
    if (!readyDate) {
      const today = new Date().toISOString().split('T')[0];
      setReadyDate(today);
    }
    if (!readyTime) {
      const hours = String(new Date().getHours()).padStart(2, '0');
      const mins = String(new Date().getMinutes()).padStart(2, '0');
      setReadyTime(`${hours}:${mins}`);
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#080b11] select-none p-6 space-y-6">
      
      {/* ── 1. HEADER ROW ── */}
      <div className="flex items-center justify-between border-b border-[#1e293b]/60 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-[#1e293b] px-4 py-2.5 text-xs font-bold text-slate-350 hover:bg-slate-800 transition shadow"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Items
        </button>
        <h2 className="text-base font-black text-white tracking-wide">
          Order Customization & Type
        </h2>
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-5 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-emerald-500/10 transition"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>

      {/* ── 2. ORDER TYPE SELECTION TABS ── */}
      <div className="grid grid-cols-3 gap-3">
        {(['takeaway', 'dine_in', 'delivery'] as const).map((type) => {
          const isSelected = orderType === type;
          let label = '';
          let Icon = ShoppingBag;
          let color = '';

          if (type === 'takeaway') {
            label = 'Take Away';
            Icon = ShoppingBag;
            color = 'hover:border-cyan-500/30 active:bg-cyan-500/10';
          } else if (type === 'dine_in') {
            label = 'Dine-In';
            Icon = Utensils;
            color = 'hover:border-amber-500/30 active:bg-amber-500/10';
          } else {
            label = 'Delivery';
            Icon = Truck;
            color = 'hover:border-indigo-500/30 active:bg-indigo-500/10';
          }

          return (
            <button
              key={type}
              type="button"
              onClick={() => setOrderType(type)}
              className={`rounded-xl border p-4 flex flex-col items-center justify-center gap-2 transition duration-150 ${
                isSelected
                  ? 'border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b] shadow-lg shadow-[#f59e0b]/5 font-black scale-[1.02]'
                  : `border-[#1e293b] bg-[#0c101b] text-slate-400 hover:text-white ${color}`
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-extrabold tracking-wide uppercase">{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. MAIN FORM BODY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* LEFT COLUMN: Customer Contacts & Notes */}
        <div className="space-y-4 rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 shadow-xl">
          
          {/* Order Notes / Comments */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Order Notes / Special Comments
              </label>
              {orderNotes && (
                <button
                  type="button"
                  onClick={() => setOrderNotes('')}
                  className="text-[9px] text-red-400 font-bold hover:underline uppercase"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              placeholder="e.g. Cut in halves, no pickles, deliver before 8pm..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full rounded-xl border border-[#1e293b] bg-slate-950 px-3 py-2 text-xs text-white h-20 outline-none resize-none focus:border-[#f59e0b] transition leading-normal"
            />
          </div>

          <hr className="border-[#1e293b]/50" />

          {/* Customer Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <User className="h-3 w-3 text-slate-500" /> Customer Name
            </label>
            <input
              type="text"
              placeholder="e.g. Warrick Jordan"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-xl border border-[#1e293b] bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition"
            />
          </div>

          {/* Customer Mobile */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Phone className="h-3 w-3 text-slate-500" /> Mobile Number
            </label>
            <div className="flex gap-2">
              <div className="rounded-xl border border-[#1e293b] bg-slate-950 px-3 py-2 text-xs text-slate-400 font-bold flex items-center justify-center">
                +61
              </div>
              <input
                type="tel"
                placeholder="e.g. 0412345678"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full rounded-xl border border-[#1e293b] bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition"
              />
            </div>
          </div>

          {/* Customer Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Mail className="h-3 w-3 text-slate-500" /> Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. guest@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full rounded-xl border border-[#1e293b] bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition"
            />
          </div>

          {/* Ready By Dates */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-500" /> Ready Date
              </label>
              <input
                type="date"
                value={readyDate}
                onChange={(e) => setReadyDate(e.target.value)}
                className="w-full rounded-xl border border-[#1e293b] bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-[#f59e0b] transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-500" /> Ready Time
              </label>
              <input
                type="time"
                value={readyTime}
                onChange={(e) => setReadyTime(e.target.value)}
                className="w-full rounded-xl border border-[#1e293b] bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-[#f59e0b] transition"
              />
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Conditional Setup (Dine-In Tables, Cart Refs, Delivery Address) */}
        <div className="space-y-4">
          
          {/* A. DINE-IN TYPE FORM DETAILS */}
          {orderType === 'dine_in' && (
            <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 shadow-xl space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Table Number
                  </label>
                  <input
                    type="text"
                    disabled
                    placeholder="Click grid to select"
                    value={selectedTable ? selectedTable.table_number : 'No Table Selected'}
                    className="w-full rounded-xl border border-[#1e293b] bg-slate-950 px-3 py-2.5 text-xs text-[#f59e0b] font-black outline-none border-dashed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Users className="h-3 w-3 text-slate-500" /> Covers (Guests)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dineInCovers}
                    onChange={(e) => setDineInCovers(e.target.value)}
                    className="w-full rounded-xl border border-[#1e293b] bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition font-bold"
                  />
                </div>
              </div>

              {/* Table Grid Selection Box */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Select Seating Floor Table
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                  {tables.map((t) => {
                    const isSelected = selectedTable?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => selectTable(t)}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center outline-none ${
                          isSelected
                            ? 'border-[#f59e0b] bg-[#f59e0b]/10 text-white shadow-md'
                            : t.status === 'occupied'
                            ? 'border-red-950 bg-red-950/10 text-red-400 hover:bg-red-950/20'
                            : t.status === 'reserved'
                            ? 'border-orange-950 bg-orange-950/10 text-orange-400 hover:bg-orange-950/20'
                            : 'border-[#1e293b] bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-white'
                        }`}
                      >
                        <span className="font-extrabold text-xs">{t.table_number}</span>
                        <span className="text-[8px] text-slate-500 font-semibold mt-0.5 uppercase">
                          Cap: {t.seating_capacity}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* B. TAKE AWAY / DELIVERY TYPE DETAILS */}
          {orderType !== 'dine_in' && (
            <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 shadow-xl space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Cart Ref. / Order Slip reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. MA-001, Takeout-04..."
                  value={cartRef}
                  onChange={(e) => setCartRef(e.target.value)}
                  className="w-full rounded-xl border border-[#1e293b] bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#f59e0b] transition font-bold"
                />
              </div>
            </div>
          )}

          {/* C. DELIVERY SPECIFIC DETAILS (DELIVERY ADDRESS) */}
          {orderType === 'delivery' && (
            <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 shadow-xl space-y-4 flex flex-col justify-start">
              
              {/* Delivery Tabs */}
              <div className="flex border-b border-[#1e293b]/60">
                <button
                  type="button"
                  onClick={() => setDeliveryTab('address')}
                  className={`pb-2 px-4 text-xs font-bold transition outline-none ${
                    deliveryTab === 'address'
                      ? 'border-b-2 border-[#f59e0b] text-[#f59e0b]'
                      : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  Delivery Address
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryTab('cost')}
                  className={`pb-2 px-4 text-xs font-bold transition outline-none ${
                    deliveryTab === 'cost'
                      ? 'border-b-2 border-[#f59e0b] text-[#f59e0b]'
                      : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  Calculate Cost
                </button>
              </div>

              {deliveryTab === 'address' ? (
                <div className="space-y-3 pt-1">
                  
                  {/* Address Line 1 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-500" /> Street Address*
                      </label>
                      {deliveryAddress && (
                        <button
                          type="button"
                          onClick={() => setDeliveryAddress('')}
                          className="text-[8.5px] text-red-400 font-bold hover:underline uppercase"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 34A, XYZ Street (Mandatory)"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full rounded-xl border border-[#1e293b] bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-[#f59e0b] transition font-semibold"
                    />
                  </div>

                  {/* Address Line 2 */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Add. Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Unit 4, Building B"
                      value={deliveryAddress2}
                      onChange={(e) => setDeliveryAddress2(e.target.value)}
                      className="w-full rounded-xl border border-[#1e293b] bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-[#f59e0b] transition"
                    />
                  </div>

                  {/* Suburb/City & ZipCode */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Suburb / City
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Warners Bay"
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                        className="w-full rounded-xl border border-[#1e293b] bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-[#f59e0b] transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Zip Code*
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 2282"
                        value={deliveryZip}
                        onChange={(e) => setDeliveryZip(e.target.value)}
                        className="w-full rounded-xl border border-[#1e293b] bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-[#f59e0b] transition font-bold"
                      />
                    </div>
                  </div>

                  {/* State & Country */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        State*
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. NSW"
                        value={deliveryState}
                        onChange={(e) => setDeliveryState(e.target.value)}
                        className="w-full rounded-xl border border-[#1e293b] bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-[#f59e0b] transition font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Country*
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Australia"
                        value={deliveryCountry}
                        onChange={(e) => setDeliveryCountry(e.target.value)}
                        className="w-full rounded-xl border border-[#1e293b] bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-[#f59e0b] transition font-semibold"
                      />
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-[#1e293b] rounded-xl text-xs text-slate-500 font-semibold leading-relaxed">
                  <Truck className="h-7 w-7 text-indigo-400 mx-auto mb-2" />
                  Delivery Charge: <span className="text-white font-bold">$5.00</span><br />
                  Flat rate calculation applied globally.
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
