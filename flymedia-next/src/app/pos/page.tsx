'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { usePOSStore } from '../../lib/store';

// Import Modular POS Components
import { POSSidebar } from '../../components/pos/POSSidebar';
import { POSHeader } from '../../components/pos/POSHeader';
import { POSTableGrid } from '../../components/pos/POSTableGrid';
import { POSMenuGrid } from '../../components/pos/POSMenuGrid';
import { POSCart } from '../../components/pos/POSCart';
import { POSModals } from '../../components/pos/POSModals';
import { POSOrderTypePanel } from '../../components/pos/POSOrderTypePanel';
import { Sparkline, DailySalesTrendChart, CategorySalesChart } from '../../components/pos/POSCharts';

import { Clock, TrendingUp } from 'lucide-react';

export default function POSPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Load POS State from Zustand
  const {
    cart,
    discountRate,
    discountAmount,
    taxRate,
    orderType,
    selectedTable,
    heldOrders,
    splitCount,
    activeHeldOrderId,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setTaxRate,
    selectTable,
    setSplitCount,
    resumeOrder,
    getTotals,
    setOrderType,
  } = usePOSStore();

  // Component States
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tables, setTables] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Order Type & Customization form states
  const [viewMode, setViewMode] = useState<'menu' | 'order_type'>('menu');
  const [orderNotes, setOrderNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [cartRef, setCartRef] = useState('MA-001');
  const [readyDate, setReadyDate] = useState('');
  const [readyTime, setReadyTime] = useState('');
  const [dineInCovers, setDineInCovers] = useState('1');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryAddress2, setDeliveryAddress2] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryZip, setDeliveryZip] = useState('');
  const [deliveryState, setDeliveryState] = useState('NSW');
  const [deliveryCountry, setDeliveryCountry] = useState('Australia');
  
  // Track active cart state for each table dynamically
  const [tableCarts, setTableCarts] = useState<Record<string, any[]>>({});
  const lastSelectedTableRef = React.useRef<any>(null);

  useEffect(() => {
    if (lastSelectedTableRef.current?.id !== selectedTable?.id) {
      lastSelectedTableRef.current = selectedTable;
      return;
    }

    if (selectedTable) {
      setTableCarts((prev) => ({
        ...prev,
        [selectedTable.id]: cart,
      }));
    }
  }, [cart, selectedTable]);

  // Custom states for newly added features
  const [activeModal, setActiveModal] = useState<'checkout' | 'hold' | 'resume' | 'split' | 'receipt' | 'table' | 'inventory' | 'settings' | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'card' | 'upi' | 'wallet'>('cash');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [holdNotes, setHoldNotes] = useState('');
  const [recentOrder, setRecentOrder] = useState<any>(null);

  // Seed default settings modifiers
  const [inputTaxRate, setInputTaxRate] = useState<number>(taxRate);

  const fetchTables = () => {
    fetch('/api/tables')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTables(data.tables);
        }
      });
  };

  const fetchStats = () => {
    fetch('/api/pos/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
        }
      })
      .catch((err) => console.error('Error fetching stats:', err));
  };

  const fetchHeldOrders = () => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
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
          }));

          usePOSStore.setState({ heldOrders: formattedHeld });
        }
      })
      .catch((err) => console.error('Error fetching held orders:', err));
  };

  const handleClearCart = () => {
    clearCart();
    setOrderNotes('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCartRef('MA-001');
    setReadyDate('');
    setReadyTime('');
    setDineInCovers('1');
    setDeliveryAddress('');
    setDeliveryAddress2('');
    setDeliveryCity('');
    setDeliveryZip('');
    setDeliveryState('NSW');
    setDeliveryCountry('Australia');
    setViewMode('menu');
  };

  const handleResumeOrder = (id: string) => {
    const order = heldOrders.find((o) => o.id === id);
    if (order) {
      if (order.customer) {
        setCustomerName(order.customer.name || '');
        setCustomerPhone(order.customer.phone || '');
        setCustomerEmail(order.customer.email || '');
      } else {
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
      }

      const rawNotes = order.notes || '';
      let parsedNotes = rawNotes;
      let parsedAddress = '';
      let parsedCartRef = '';
      let parsedReadyBy = '';

      const parts = rawNotes.split(' | ');
      for (const part of parts) {
        if (part.startsWith('Delivery Address: ')) {
          parsedAddress = part.replace('Delivery Address: ', '');
        } else if (part.startsWith('Ready By: ')) {
          parsedReadyBy = part.replace('Ready By: ', '');
        } else if (part.startsWith('Cart Ref: ')) {
          parsedCartRef = part.replace('Cart Ref: ', '');
        } else if (part.startsWith('Notes: ')) {
          parsedNotes = part.replace('Notes: ', '');
        }
      }

      setOrderNotes(parsedNotes);
      setCartRef(parsedCartRef || 'MA-001');

      if (parsedReadyBy) {
        const [datePart, timePart] = parsedReadyBy.split(' ');
        if (datePart) setReadyDate(datePart);
        if (timePart) setReadyTime(timePart);
      } else {
        setReadyDate('');
        setReadyTime('');
      }

      if (parsedAddress) {
        setDeliveryAddress(parsedAddress);
        setDeliveryAddress2('');
        setDeliveryCity('');
        setDeliveryZip('');
        setDeliveryState('NSW');
        setDeliveryCountry('Australia');
      } else {
        setDeliveryAddress('');
        setDeliveryAddress2('');
        setDeliveryCity('');
        setDeliveryZip('');
        setDeliveryState('NSW');
        setDeliveryCountry('Australia');
      }

      resumeOrder(id);
    }
  };

  const lastResumedOrderIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (activeHeldOrderId && heldOrders.length > 0) {
      if (lastResumedOrderIdRef.current === activeHeldOrderId) {
        return;
      }
      lastResumedOrderIdRef.current = activeHeldOrderId;

      const order = heldOrders.find((o) => o.id === activeHeldOrderId);
      if (order) {
        if (order.customer) {
          setCustomerName(order.customer.name || '');
          setCustomerPhone(order.customer.phone || '');
          setCustomerEmail(order.customer.email || '');
        } else {
          setCustomerName('');
          setCustomerPhone('');
          setCustomerEmail('');
        }

        const rawNotes = order.notes || '';
        let parsedNotes = rawNotes;
        let parsedAddress = '';
        let parsedCartRef = '';
        let parsedReadyBy = '';

        const parts = rawNotes.split(' | ');
        for (const part of parts) {
          if (part.startsWith('Delivery Address: ')) {
            parsedAddress = part.replace('Delivery Address: ', '');
          } else if (part.startsWith('Ready By: ')) {
            parsedReadyBy = part.replace('Ready By: ', '');
          } else if (part.startsWith('Cart Ref: ')) {
            parsedCartRef = part.replace('Cart Ref: ', '');
          } else if (part.startsWith('Notes: ')) {
            parsedNotes = part.replace('Notes: ', '');
          }
        }

        setOrderNotes(parsedNotes);
        setCartRef(parsedCartRef || 'MA-001');

        if (parsedReadyBy) {
          const [datePart, timePart] = parsedReadyBy.split(' ');
          if (datePart) setReadyDate(datePart);
          if (timePart) setReadyTime(timePart);
        } else {
          setReadyDate('');
          setReadyTime('');
        }

        if (parsedAddress) {
          setDeliveryAddress(parsedAddress);
          setDeliveryAddress2('');
          setDeliveryCity('');
          setDeliveryZip('');
          setDeliveryState('NSW');
          setDeliveryCountry('Australia');
        } else {
          setDeliveryAddress('');
          setDeliveryAddress2('');
          setDeliveryCity('');
          setDeliveryZip('');
          setDeliveryState('NSW');
          setDeliveryCountry('Australia');
        }
      }
    } else if (!activeHeldOrderId) {
      lastResumedOrderIdRef.current = null;
    }
  }, [activeHeldOrderId, heldOrders]);

  // Fetch Menu, Tables, Stats, and Held Orders on mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/menu')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCategories(data.categories);
          }
        });

      fetchTables();
      fetchStats();
      fetchHeldOrders();
    }
  }, [status]);

  // Handle settings save
  const handleSaveSettings = () => {
    setTaxRate(inputTaxRate);
    setActiveModal(null);
  };

  // Sync initial tax rate input on load
  useEffect(() => {
    setInputTaxRate(taxRate);
  }, [taxRate]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b11]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-[#f59e0b] mx-auto"></div>
          <p className="mt-4 text-slate-400 font-semibold tracking-wider">Initializing TABLETASTE POS...</p>
        </div>
      </div>
    );
  }

  // Get totals calculation from Zustand
  const { subtotal, discount, tax, total } = getTotals();

  // Flatten items for search & display
  const allItems = categories.flatMap((cat) =>
    (cat.MenuItems || []).map((item: any) => ({
      ...item,
      categoryName: cat.name,
    }))
  );

  const filteredItems = allItems.filter((item) => {
    const matchesCategory = selectedCategoryId === 'all' || item.category_id === selectedCategoryId;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Quantity lookup helpers
  const getItemQty = (itemId: string) => {
    return cart.find((item) => item.menuItemId === itemId)?.quantity || 0;
  };

  // Checkout handling
  const handleCheckoutSubmit = async () => {
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
          heldOrderId: activeHeldOrderId || undefined,
          notes: orderNotes || checkoutNotes || undefined,
          customerName,
          customerPhone,
          customerEmail,
          deliveryAddress: deliveryAddress ? `${deliveryAddress}${deliveryAddress2 ? `, ${deliveryAddress2}` : ''}, ${deliveryCity}, ${deliveryZip}, ${deliveryState}, ${deliveryCountry}` : undefined,
          cartRef,
          readyBy: readyDate && readyTime ? `${readyDate} ${readyTime}` : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRecentOrder(data.order);
        
        // Clear local table cart state on checkout success
        if (selectedTable) {
          setTableCarts((prev) => {
            const copy = { ...prev };
            delete copy[selectedTable.id];
            return copy;
          });
        }

        handleClearCart();
        fetchTables(); // Refresh table statuses in POS screen
        fetchStats();  // Refresh stats dynamically in POS screen
        fetchHeldOrders(); // Refresh held orders list in POS screen
        setActiveModal('receipt');
      } else {
        alert(data.message || 'Checkout failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during checkout.');
    }
  };

  // Persistent Hold Order handling
  const handleHoldOrder = async (notes?: string) => {
    if (cart.length === 0) return;

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
          discountRate,
          discountAmount,
          taxRate,
          status: 'on_hold',
          notes: notes || orderNotes || undefined,
          customerName,
          customerPhone,
          customerEmail,
          deliveryAddress: deliveryAddress ? `${deliveryAddress}${deliveryAddress2 ? `, ${deliveryAddress2}` : ''}, ${deliveryCity}, ${deliveryZip}, ${deliveryState}, ${deliveryCountry}` : undefined,
          cartRef,
          readyBy: readyDate && readyTime ? `${readyDate} ${readyTime}` : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        handleClearCart();
        fetchTables();
        fetchStats();
        fetchHeldOrders();
      } else {
        alert(data.message || 'Failed to hold order.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while holding order.');
    }
  };

  // Persistent Delete/Cancel Held Order handling
  const handleDeleteHeldOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchHeldOrders();
        fetchStats();
        fetchTables();
      } else {
        alert(data.message || 'Failed to cancel held order.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while cancelling held order.');
    }
  };

  const getDummyTableBill = (table: any) => {
    if (table.status !== 'occupied' && table.status !== 'reserved') return null;
    
    // If the table has an active cart, calculate the total from it
    if (tableCarts[table.id]) {
      const subtotal = tableCarts[table.id].reduce((sum, item) => sum + item.price * item.quantity, 0);
      const tax = (subtotal * taxRate) / 100;
      return (subtotal + tax).toFixed(2);
    }

    if (allItems.length > 0) {
      const index1 = (table.table_number.charCodeAt(0) || 0) % allItems.length;
      const index2 = ((table.table_number.charCodeAt(table.table_number.length - 1) || 0) + 1) % allItems.length;

      const item1 = allItems[index1];
      const item2 = allItems[index2 % allItems.length];

      const price1 = parseFloat(item1.price) || 0;
      const price2 = parseFloat(item2.price) || 0;

      let subtotal = price1 * 2;
      if (item1.id !== item2.id) {
        subtotal += price2 * 1;
      }

      const tax = (subtotal * taxRate) / 100;
      return (subtotal + tax).toFixed(2);
    }

    let hash = 0;
    for (let i = 0; i < table.table_number.length; i++) {
      hash += table.table_number.charCodeAt(i);
    }
    const amount = (hash % 150) + 35.5;
    return amount.toFixed(2);
  };

  const handleTableSelection = (table: any) => {
    if (selectedTable && selectedTable.id === table.id) {
      selectTable(null);
      usePOSStore.setState({ cart: [] });
    } else {
      selectTable({
        id: table.id,
        table_number: table.table_number,
      });

      // Load table's cart if already stored, otherwise initialize it
      if (tableCarts[table.id]) {
        usePOSStore.setState({
          cart: tableCarts[table.id],
          discountRate: 0,
          discountAmount: 0,
          splitCount: 1,
        });
      } else {
        if ((table.status === 'occupied' || table.status === 'reserved') && allItems.length > 0) {
          const index1 = (table.table_number.charCodeAt(0) || 0) % allItems.length;
          const index2 = ((table.table_number.charCodeAt(table.table_number.length - 1) || 0) + 1) % allItems.length;

          const item1 = allItems[index1];
          const item2 = allItems[index2 % allItems.length];

          const dummyCartItems = [
            {
              id: `${item1.id}--`,
              menuItemId: item1.id,
              name: item1.name,
              price: parseFloat(item1.price),
              quantity: 2,
            }
          ];

          if (item1.id !== item2.id) {
            dummyCartItems.push({
              id: `${item2.id}--`,
              menuItemId: item2.id,
              name: item2.name,
              price: parseFloat(item2.price),
              quantity: 1,
            });
          }

          usePOSStore.setState({
            cart: dummyCartItems,
            discountRate: 0,
            discountAmount: 0,
            splitCount: 1,
          });

          setTableCarts((prev) => ({
            ...prev,
            [table.id]: dummyCartItems,
          }));
        } else {
          usePOSStore.setState({ cart: [] });
          setTableCarts((prev) => ({
            ...prev,
            [table.id]: [],
          }));
        }
      }
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#080b11] font-sans text-slate-100 overflow-hidden select-none">
      
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <POSSidebar
        session={session}
        heldOrdersCount={heldOrders.length}
        setActiveModal={setActiveModal}
      />

      {/* 2. MIDDLE DASHBOARD CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#080b11]">
        
        {/* TOP ROW HEADER */}
        <POSHeader session={session} />

        {viewMode === 'order_type' ? (
          <POSOrderTypePanel
            onBack={() => setViewMode('menu')}
            onSave={() => setViewMode('menu')}
            tables={tables}
            selectedTable={selectedTable}
            selectTable={selectTable}
            orderType={orderType}
            setOrderType={setOrderType}
            orderNotes={orderNotes}
            setOrderNotes={setOrderNotes}
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            customerEmail={customerEmail}
            setCustomerEmail={setCustomerEmail}
            cartRef={cartRef}
            setCartRef={setCartRef}
            readyDate={readyDate}
            setReadyDate={setReadyDate}
            readyTime={readyTime}
            setReadyTime={setReadyTime}
            dineInCovers={dineInCovers}
            setDineInCovers={setDineInCovers}
            deliveryAddress={deliveryAddress}
            setDeliveryAddress={setDeliveryAddress}
            deliveryAddress2={deliveryAddress2}
            setDeliveryAddress2={setDeliveryAddress2}
            deliveryCity={deliveryCity}
            setDeliveryCity={setDeliveryCity}
            deliveryZip={deliveryZip}
            setDeliveryZip={setDeliveryZip}
            deliveryState={deliveryState}
            setDeliveryState={setDeliveryState}
            deliveryCountry={deliveryCountry}
            setDeliveryCountry={setDeliveryCountry}
          />
        ) : (
          /* MAIN BODY AREA */
          <div className="p-6 space-y-6 flex-1 flex flex-col justify-start">
            
            {/* A. ORDER STATISTICS */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3.5">
                Order Statistics
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0f1524] p-4 flex items-center justify-between shadow-xl">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">Total Orders</p>
                    <p className="text-2xl font-black text-white mt-1">
                      {stats?.totalOrders !== undefined ? stats.totalOrders : (284 + (recentOrder ? 1 : 0))}
                    </p>
                    <span className="text-[10px] font-semibold text-[#f59e0b] bg-[#f59e0b]/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                      +8.5% today
                    </span>
                  </div>
                  <Sparkline points={stats?.sparklines?.orders || [35, 45, 30, 55, 40, 75, 88, 85]} strokeColor="#f59e0b" />
                </div>

                <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0f1524] p-4 flex items-center justify-between shadow-xl">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">Active Orders</p>
                    <p className="text-2xl font-black text-white mt-1">
                      {stats?.activeOrders !== undefined ? stats.activeOrders : 22}
                    </p>
                    <span className="text-[10px] font-semibold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                      Live tables
                    </span>
                  </div>
                  <Sparkline points={stats?.sparklines?.orders ? stats.sparklines.orders.map((o: number) => Math.round(o * 0.15 + 10)) : [12, 18, 10, 22, 14, 25, 20, 22]} strokeColor="#06b6d4" />
                </div>

                <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0f1524] p-4 flex items-center justify-between shadow-xl">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">Pending Billing</p>
                    <p className="text-2xl font-black text-white mt-1">
                      {stats?.pendingBilling !== undefined ? stats.pendingBilling : (7 + heldOrders.length)}
                    </p>
                    <span className="text-[10px] font-semibold text-purple-500 bg-purple-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                      Held bills
                    </span>
                  </div>
                  <Sparkline points={stats?.sparklines?.pending || [4, 8, 3, 10, 5, 8, 7, 9]} strokeColor="#a855f7" />
                </div>

                <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0f1524] p-4 flex items-center justify-between shadow-xl">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">Today's Sales</p>
                    <p className="text-2xl font-black text-white mt-1">
                      ${((stats?.todaySales !== undefined ? stats.todaySales : 4850.50) + subtotal).toFixed(2)}
                    </p>
                    <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                      +12% yesterday
                    </span>
                  </div>
                  <Sparkline points={stats?.sparklines?.sales || [1500, 2500, 1800, 3400, 2600, 4200, 4850.5]} strokeColor="#10b981" />
                </div>

              </div>
            </div>

            {/* B. ACTIVE TABLES & MENU GRID ROW */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* ACTIVE TABLES OVERVIEW (5 Columns) */}
              <POSTableGrid
                tables={tables}
                selectedTable={selectedTable}
                handleTableSelection={handleTableSelection}
                getDummyTableBill={getDummyTableBill}
                setActiveModal={setActiveModal}
              />

              {/* PRODUCT MENU GRID (7 Columns) */}
              <POSMenuGrid
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                setSelectedCategoryId={setSelectedCategoryId}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filteredItems={filteredItems}
                getItemQty={getItemQty}
                addToCart={addToCart}
                updateQuantity={updateQuantity}
                cart={cart}
              />

            </div>

            {/* C. SALES ANALYTICS PLOTS ROW */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3.5">
                Sales Analytics
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Daily Sales Curve (7 columns) */}
                <div className="lg:col-span-7 rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-4 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white">Daily Sales Trend</h3>
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-[#f59e0b]" /> Refresh interval 10m
                    </span>
                  </div>
                  <DailySalesTrendChart data={stats?.salesTrend} />
                </div>

                {/* Category Sales Donut (5 columns) */}
                <div className="lg:col-span-5 rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-4 shadow-xl flex flex-col justify-between">
                  <h3 className="text-sm font-bold text-white mb-3">Category Sales</h3>
                  <CategorySalesChart data={stats?.categorySales} totalSales={stats?.todaySales} />
                </div>

              </div>
            </div>

          </div>
        )}

      </div>

      {/* 3. ACTIVE CART & RECEIPT SIDE PANEL (RIGHT SIDEBAR) */}
      <POSCart
        cart={cart}
        selectedTable={selectedTable}
        tables={tables}
        session={session}
        subtotal={subtotal}
        discount={discount}
        discountRate={discountRate}
        discountAmount={discountAmount}
        taxRate={taxRate}
        tax={tax}
        total={total}
        splitCount={splitCount}
        recentOrder={recentOrder}
        clearCart={handleClearCart}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        setActiveModal={setActiveModal}
        allItems={allItems}
        onOrderTypeClick={() => setViewMode('order_type')}
        orderType={orderType}
        customerName={customerName}
        cartRef={cartRef}
      />

      {/* ========================================================================= */}
      {/* DIALOG MODALS POPUPS */}
      <POSModals
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        selectedPayment={selectedPayment}
        setSelectedPayment={setSelectedPayment}
        checkoutNotes={checkoutNotes}
        setCheckoutNotes={setCheckoutNotes}
        handleCheckoutSubmit={handleCheckoutSubmit}
        total={total}
        subtotal={subtotal}
        discount={discount}
        tax={tax}
        taxRate={taxRate}
        recentOrder={recentOrder}
        setRecentOrder={setRecentOrder}
        clearCart={handleClearCart}
        session={session}
        orderType={orderType}
        selectedTable={selectedTable}
        tables={tables}
        selectTable={selectTable}
        inputTaxRate={inputTaxRate}
        setInputTaxRate={setInputTaxRate}
        handleSaveSettings={handleSaveSettings}
        heldOrders={heldOrders}
        resumeOrder={handleResumeOrder}
        deleteHeldOrder={handleDeleteHeldOrder}
        splitCount={splitCount}
        setSplitCount={setSplitCount}
        holdOrder={handleHoldOrder}
        holdNotes={holdNotes}
        setHoldNotes={setHoldNotes}
        fetchTables={fetchTables}
      />

    </div>
  );
}
