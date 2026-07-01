'use client';

import React, { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { usePOSStore } from '../../lib/store';
import { io } from 'socket.io-client';

// Import Modular POS Components
import { POSSidebar } from '../../components/pos/POSSidebar';
import { POSHeader } from '../../components/pos/POSHeader';
import { POSTableGrid } from '../../components/pos/POSTableGrid';
import { POSMenuGrid } from '../../components/pos/POSMenuGrid';
import { POSCart } from '../../components/pos/POSCart';
import { POSModals } from '../../components/pos/POSModals';
import { POSOrderTypePanel } from '../../components/pos/POSOrderTypePanel';
import { Sparkline, DailySalesTrendChart, CategorySalesChart } from '../../components/pos/POSCharts';

import { Clock, TrendingUp, LayoutGrid, LineChart, Utensils, FolderOpen, Settings, ShoppingBag, X } from 'lucide-react';

export default function POSPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Socket.IO client setup for real-time kitchen syncing
  const socketRef = useRef<any>(null);
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const storeId = (session.user as any).store_id;
      if (storeId) {
        const socket = io({
          transports: ['websocket', 'polling']
        });
        socketRef.current = socket;
        socket.on('connect', () => {
          console.log('[POS Socket] Connected, joining store room:', storeId);
          socket.emit('join_store', storeId);
        });
        return () => {
          socket.disconnect();
        };
      }
    }
  }, [session, status]);

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

  const [viewMode, setViewMode] = useState<'menu' | 'order_type'>('menu');
  const [posTab, setPosTab] = useState<'analytics' | 'tables' | 'menu'>('analytics');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
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
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  
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
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'card' | 'upi'>('cash');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [holdNotes, setHoldNotes] = useState('');
  const [recentOrder, setRecentOrder] = useState<any>(null);

  // Stripe state for POS card payments
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [stripeStoreId, setStripeStoreId] = useState<string | null>(null);
  const [posCardError, setPosCardError] = useState<string | null>(null);
  const [posStripeSubmitting, setPosStripeSubmitting] = useState(false);

  // Seed default settings modifiers
  const [inputTaxRate, setInputTaxRate] = useState<number>(taxRate);

  // Theme state for POS Light/Dark Mode
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = (localStorage.getItem('pos-theme') || localStorage.getItem('dashboard-theme')) as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('pos-theme', nextTheme);
    localStorage.setItem('dashboard-theme', nextTheme);
  };

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

      fetch('/api/dashboard/profile')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setLogoUrl(data.organization?.logo || '');
            setCompanyName(data.organization?.name || '');
          }
        })
        .catch((err) => console.error('Error fetching POS profile logo:', err));

      // Fetch Stripe config for POS card payments
      fetch('/api/pos/stripe-config')
        .then((r) => r.json())
        .then((cfg) => {
          if (cfg.enabled && cfg.publishableKey) {
            setStripeEnabled(true);
            setStripePromise(loadStripe(cfg.publishableKey));
            // Capture store_id from session for PaymentIntent creation
            const storeId = (session?.user as any)?.store_id;
            if (storeId) setStripeStoreId(storeId);
          }
        })
        .catch(() => {}); // Stripe not configured — silently skip
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
  const handleCheckoutSubmit = async (stripePaymentIntentId?: string) => {
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
          stripePaymentIntentId: stripePaymentIntentId || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRecentOrder(data.order);
        
        // Emit Socket event to notify KDS instantly
        if (socketRef.current) {
          const storeId = (session?.user as any)?.store_id;
          if (storeId) {
            socketRef.current.emit('new_order', {
              storeId,
              order: data.order,
            });
          }
        }
        
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
      // Transition immediately to the Menu Tab!
      setPosTab('menu');
    }
  };

  return (
    <div className={`flex h-screen w-screen transition-colors duration-300 font-sans text-slate-100 overflow-hidden select-none ${theme === 'light' ? 'light-theme bg-[#f8fafc]' : 'bg-gradient-to-br from-[#070b12] via-[#080d16] to-[#0c1220]'}`}>
      
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <POSSidebar
        session={session}
        heldOrdersCount={heldOrders.length}
        setActiveModal={setActiveModal}
        logoUrl={logoUrl}
      />

      {/* 2. MIDDLE DASHBOARD CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-transparent pb-16 md:pb-0">
        
        {/* TOP ROW HEADER */}
        <POSHeader session={session} logoUrl={logoUrl} companyName={companyName} theme={theme} toggleTheme={toggleTheme} />

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
          <div className="flex-1 flex flex-col justify-start">
            
            {/* STYLISH TAB HEADER BAR */}
            <div className="flex border-b border-slate-800 bg-[#070b13]/40 backdrop-blur-md px-4 sm:px-6 py-1 sticky top-0 z-10 select-none items-center justify-between shrink-0 shadow-sm overflow-x-auto scrollbar-none">
              <div className="flex gap-1.5 shrink-0 overflow-x-auto scrollbar-none whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setPosTab('analytics')}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider transition border-b-2 -mb-[6px] shrink-0 ${
                    posTab === 'analytics'
                      ? 'border-[#f59e0b] text-[#f59e0b]'
                      : 'border-transparent text-slate-500 hover:text-slate-350'
                  }`}
                >
                  <LineChart className="h-4 w-4" />
                  Sales Analytics
                </button>
                <button
                  type="button"
                  onClick={() => setPosTab('tables')}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider transition border-b-2 -mb-[6px] shrink-0 ${
                    posTab === 'tables'
                      ? 'border-[#f59e0b] text-[#f59e0b]'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Tables Map
                </button>
                <button
                  type="button"
                  onClick={() => setPosTab('menu')}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider transition border-b-2 -mb-[6px] shrink-0 ${
                    posTab === 'menu'
                      ? 'border-[#f59e0b] text-[#f59e0b]'
                      : 'border-transparent text-slate-500 hover:text-slate-350'
                  }`}
                >
                  <Utensils className="h-4 w-4" />
                  Order Menu
                </button>
               
              </div>

              {/* Real-time status update tag */}
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-900/40 border border-slate-800 px-3 py-1 rounded-full uppercase tracking-wider shrink-0 ml-4">
                <Clock className="h-3.5 w-3.5 text-[#f59e0b] animate-spin" style={{ animationDuration: '60s' }} />
                Auto-Sync Active
              </div>
            </div>

            {posTab === 'tables' && (
              <div className="p-6 space-y-6 flex-1 flex flex-col animate-fade-in">
                <POSTableGrid
                  tables={tables}
                  selectedTable={selectedTable}
                  handleTableSelection={handleTableSelection}
                  getDummyTableBill={getDummyTableBill}
                  setActiveModal={setActiveModal}
                />
              </div>
            )}

            {posTab === 'menu' && (
              <div className="p-6 space-y-6 flex-1 flex flex-col animate-fade-in">
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
            )}

            {posTab === 'analytics' && (
              <div className="p-6 space-y-6 flex-1 flex flex-col animate-fade-in">
                {/* A. ORDER STATISTICS */}
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">
                    Order Statistics
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    <div className="rounded-2xl border border-slate-800/80 bg-[#0c101b]/60 backdrop-blur-md p-4 flex items-center justify-between shadow-xl">
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Total Orders</p>
                        <p className="text-2xl font-black text-white mt-1">
                          {stats?.totalOrders !== undefined ? stats.totalOrders : (recentOrder ? 1 : 0)}
                        </p>
                        <span className="text-[10px] font-semibold text-[#f59e0b] bg-[#f59e0b]/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                          Active store total
                        </span>
                      </div>
                      <Sparkline points={stats?.sparklines?.orders || [0, 0, 0, 0, 0, 0, 0, 0]} strokeColor="#f59e0b" />
                    </div>

                    <div className="rounded-2xl border border-slate-800/80 bg-[#0c101b]/60 backdrop-blur-md p-4 flex items-center justify-between shadow-xl">
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Active Orders</p>
                        <p className="text-2xl font-black text-white mt-1">
                          {stats?.activeOrders !== undefined ? stats.activeOrders : 0}
                        </p>
                        <span className="text-[10px] font-semibold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                          Live tables
                        </span>
                      </div>
                      <Sparkline points={stats?.sparklines?.orders ? stats.sparklines.orders.map((o: number) => Math.round(o * 0.15 + 10)) : [0, 0, 0, 0, 0, 0, 0, 0]} strokeColor="#06b6d4" />
                    </div>

                    <div className="rounded-2xl border border-slate-800/80 bg-[#0c101b]/60 backdrop-blur-md p-4 flex items-center justify-between shadow-xl">
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Pending Billing</p>
                        <p className="text-2xl font-black text-white mt-1">
                          {stats?.pendingBilling !== undefined ? stats.pendingBilling : heldOrders.length}
                        </p>
                        <span className="text-[10px] font-semibold text-purple-500 bg-purple-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                          Held bills
                        </span>
                      </div>
                      <Sparkline points={stats?.sparklines?.pending || [0, 0, 0, 0, 0, 0, 0, 0]} strokeColor="#a855f7" />
                    </div>

                    <div className="rounded-2xl border border-slate-800/80 bg-[#0c101b]/60 backdrop-blur-md p-4 flex items-center justify-between shadow-xl">
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Today's Sales</p>
                        <p className="text-2xl font-black text-white mt-1">
                          ${((stats?.todaySales !== undefined ? stats.todaySales : 0) + subtotal).toFixed(2)}
                        </p>
                        <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                          Live checkout sales
                        </span>
                      </div>
                      <Sparkline points={stats?.sparklines?.sales || [0, 0, 0, 0, 0, 0, 0, 0]} strokeColor="#10b981" />
                    </div>

                  </div>
                </div>

                {/* C. SALES ANALYTICS PLOTS ROW */}
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">
                    Sales Analytics
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Daily Sales Curve (7 columns) */}
                    <div className="lg:col-span-7 rounded-2xl border border-slate-800/80 bg-[#0c101b]/60 backdrop-blur-md p-4 shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white">Daily Sales Trend</h3>
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#f59e0b]" /> Refresh interval 10m
                        </span>
                      </div>
                      <DailySalesTrendChart data={stats?.salesTrend} />
                    </div>

                    {/* Category Sales Donut (5 columns) */}
                    <div className="lg:col-span-5 rounded-2xl border border-slate-800/80 bg-[#0c101b]/60 backdrop-blur-md p-4 shadow-xl flex flex-col justify-between">
                      <h3 className="text-sm font-bold text-white mb-3">Category Sales</h3>
                      <CategorySalesChart data={stats?.categorySales} totalSales={stats?.todaySales} />
                    </div>

                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 3. ACTIVE CART & RECEIPT SIDE PANEL (RIGHT SIDEBAR) */}
      <div className="hidden lg:flex shrink-0">
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
      </div>

      {/* Mobile Cart Overlay Drawer */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm lg:hidden">
          <div className="w-full max-w-md h-full flex flex-col bg-[#0c101b] border-l border-slate-800 animate-fade-in">
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
              onClose={() => setIsMobileCartOpen(false)}
            />
          </div>
        </div>
      )}

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
        stripeEnabled={stripeEnabled}
        stripePromise={stripePromise}
        stripeStoreId={stripeStoreId}
        posCardError={posCardError}
        setPosCardError={setPosCardError}
        posStripeSubmitting={posStripeSubmitting}
        setPosStripeSubmitting={setPosStripeSubmitting}
      />

      {/* Mobile Bottom Navigation Bar (hidden on md and larger) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-[#0c101b] border-t border-[#1e293b]/60 flex items-center justify-around px-4">
        <button
          type="button"
          onClick={() => {
            setPosTab('tables');
            setViewMode('menu');
          }}
          className={`flex flex-col items-center justify-center py-1 transition ${
            posTab === 'tables' ? 'text-[#f59e0b]' : 'text-slate-400'
          }`}
        >
          <LayoutGrid className="h-5 w-5" />
          <span className="text-[9px] font-bold mt-1">Tables</span>
        </button>
        
        <button
          type="button"
          onClick={() => {
            setPosTab('menu');
            setViewMode('menu');
          }}
          className={`flex flex-col items-center justify-center py-1 transition ${
            posTab === 'menu' ? 'text-[#f59e0b]' : 'text-slate-400'
          }`}
        >
          <Utensils className="h-5 w-5" />
          <span className="text-[9px] font-bold mt-1">Menu</span>
        </button>

        {/* Floating Mobile Cart trigger button */}
        <button
          type="button"
          onClick={() => setIsMobileCartOpen(true)}
          className="relative flex flex-col items-center justify-center py-1 text-slate-400"
        >
          <div className="relative">
            <ShoppingBag className="h-5 w-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#f59e0b] text-[8.5px] font-black text-slate-950 animate-pulse">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold mt-1">Cart</span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/pos/drafts')}
          className="flex flex-col items-center justify-center py-1 text-slate-400"
        >
          <div className="relative">
            <FolderOpen className="h-5 w-5" />
            {heldOrders.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#f59e0b] text-[8.5px] font-black text-slate-950">
                {heldOrders.length}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold mt-1">Drafts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModal('settings')}
          className="flex flex-col items-center justify-center py-1 text-slate-400"
        >
          <Settings className="h-5 w-5" />
          <span className="text-[9px] font-bold mt-1">Settings</span>
        </button>
      </div>

    </div>
  );
}
