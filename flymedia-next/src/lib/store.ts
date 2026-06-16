import { create } from 'zustand';

export interface CartItem {
  id: string; // unique hash of item + variant + addons
  menuItemId: string;
  name: string;
  price: number; // base unit price including variant & addons
  quantity: number;
  notes?: string;
  variant?: {
    id: string;
    name: string;
    additional_price: number;
  };
  addons?: {
    id: string;
    name: string;
    price: number;
  }[];
}

export interface HeldOrder {
  id: string;
  timestamp: Date;
  items: CartItem[];
  discountRate: number;
  discountAmount: number;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  selectedTable: { id: string; table_number: string } | null;
  notes?: string;
}

interface POSState {
  cart: CartItem[];
  discountRate: number; // percentage (e.g. 10 for 10%)
  discountAmount: number; // flat cash value
  taxRate: number; // percentage (e.g. 8.25)
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  selectedTable: { id: string; table_number: string } | null;
  heldOrders: HeldOrder[];
  splitCount: number;
  activeHeldOrderId: string | null;
  
  // Cart Actions
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  
  // Modifiers
  setDiscount: (rate: number, amount: number) => void;
  setTaxRate: (rate: number) => void;
  setOrderType: (type: 'dine_in' | 'takeaway' | 'delivery') => void;
  selectTable: (table: { id: string; table_number: string } | null) => void;
  setSplitCount: (count: number) => void;
  setActiveHeldOrderId: (id: string | null) => void;

  // Hold / Resume Actions
  holdOrder: (notes?: string) => void;
  resumeOrder: (id: string) => void;
  deleteHeldOrder: (id: string) => void;

  // Helpers
  getTotals: () => {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  discountRate: 0,
  discountAmount: 0,
  taxRate: 8.25, // default
  orderType: 'dine_in',
  selectedTable: null,
  heldOrders: [],
  splitCount: 1,
  activeHeldOrderId: null,

  addToCart: (newItem) => {
    // Generate a unique id based on item selection, variant, and addons
    const variantStr = newItem.variant ? newItem.variant.id : '';
    const addonsStr = newItem.addons ? newItem.addons.map(a => a.id).sort().join(',') : '';
    const generatedId = `${newItem.menuItemId}-${variantStr}-${addonsStr}`;

    const existingIndex = get().cart.findIndex(item => item.id === generatedId);

    if (existingIndex > -1) {
      const updatedCart = [...get().cart];
      updatedCart[existingIndex].quantity += newItem.quantity;
      set({ cart: updatedCart });
    } else {
      set({ cart: [...get().cart, { ...newItem, id: generatedId }] });
    }
  },

  removeFromCart: (id) => {
    set({ cart: get().cart.filter(item => item.id !== id) });
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(id);
      return;
    }
    set({
      cart: get().cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ),
    });
  },

  clearCart: () => {
    set({
      cart: [],
      discountRate: 0,
      discountAmount: 0,
      selectedTable: null,
      splitCount: 1,
      activeHeldOrderId: null,
    });
  },

  setDiscount: (rate, amount) => {
    set({ discountRate: rate, discountAmount: amount });
  },

  setTaxRate: (rate) => {
    set({ taxRate: rate });
  },

  setOrderType: (type) => {
    set({ orderType: type, selectedTable: type !== 'dine_in' ? null : get().selectedTable });
  },

  selectTable: (table) => {
    set({ selectedTable: table, orderType: table ? 'dine_in' : get().orderType });
  },

  setSplitCount: (count) => {
    set({ splitCount: Math.max(1, count) });
  },

  setActiveHeldOrderId: (id) => {
    set({ activeHeldOrderId: id });
  },

  holdOrder: (notes) => {
    const activeCart = get().cart;
    if (activeCart.length === 0) return;

    const newHeld: HeldOrder = {
      id: `hold-${Date.now()}`,
      timestamp: new Date(),
      items: activeCart,
      discountRate: get().discountRate,
      discountAmount: get().discountAmount,
      orderType: get().orderType,
      selectedTable: get().selectedTable,
      notes,
    };

    set({
      heldOrders: [...get().heldOrders, newHeld],
      cart: [],
      discountRate: 0,
      discountAmount: 0,
      selectedTable: null,
      splitCount: 1,
      activeHeldOrderId: null,
    });
  },

  resumeOrder: (id) => {
    const target = get().heldOrders.find(o => o.id === id);
    if (!target) return;

    set({
      cart: target.items,
      discountRate: target.discountRate,
      discountAmount: target.discountAmount,
      orderType: target.orderType,
      selectedTable: target.selectedTable,
      heldOrders: get().heldOrders.filter(o => o.id !== id),
      activeHeldOrderId: id.startsWith('hold-') ? null : id, // If it's a dynamic DB order ID (UUID), save it
    });
  },

  deleteHeldOrder: (id) => {
    set({
      heldOrders: get().heldOrders.filter(o => o.id !== id),
    });
  },

  getTotals: () => {
    const subtotal = get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // Percentage discount takes priority or they stack
    const percentDiscountVal = (subtotal * get().discountRate) / 100;
    const totalDiscount = percentDiscountVal + get().discountAmount;
    
    const taxableAmount = Math.max(0, subtotal - totalDiscount);
    const tax = (taxableAmount * get().taxRate) / 100;
    const total = taxableAmount + tax;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(totalDiscount.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };
  },
}));
