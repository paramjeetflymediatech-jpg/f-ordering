'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import {
  Clock,
  Utensils,
  ChefHat,
  ShoppingBag,
  Bell,
  RefreshCw,
  Check,
  History,
  Store,
  Filter,
  ArrowRight,
  RotateCcw,
  MapPin,
  User,
  Tv,
  ListCollapse,
  AlertTriangle,
  Sun,
  Moon,
  LogOut,
  X,
  Eye
} from 'lucide-react';

// Notification sound element is handled inside the component to comply with browser autoplay gesture policies

interface OrderItem {
  id: string;
  quantity: number;
  notes: string | null;
  unit_price?: string | number;
  price?: string | number;
  MenuItem?: {
    name: string;
    price: string | number;
    description?: string | null;
  } | null;
  name?: string;
  description?: string;
  menuItem?: {
    name: string;
    price: string | number;
    description?: string | null;
  } | null;
  variant?: {
    name: string;
  } | null;
  addons?: Array<{ name: string; price?: number }> | null;
}

interface Order {
  id: string;
  order_number: string;
  order_type: 'dine_in' | 'takeaway' | 'delivery' | 'qr_order';
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'on_hold';
  total_amount: string | number;
  subtotal?: string | number;
  discount_amount?: string | number;
  tax_amount?: string | number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  table_id?: string | null;
  RestaurantTable?: {
    table_number: string;
  } | null;
  customer?: {
    name: string;
    phone: string;
  } | null;
}

export default function KDSPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const isCapacitor = (window as any).Capacitor !== undefined;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(isCapacitor || isMobileUA);
  }, []);

  // Audio system state for notification chime
  const [audioBlocked, setAudioBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const audio = new Audio('/ringbellnoti.mp3');
    audioRef.current = audio;

    // Test playback to see if browser blocks it
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      setAudioBlocked(false);
    }).catch(() => {
      setAudioBlocked(true);
    });

    const unlockAudio = () => {
      if (audio) {
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
          setAudioBlocked(false);
          // Successfully unlocked! Remove listeners
          window.removeEventListener('click', unlockAudio);
          window.removeEventListener('touchstart', unlockAudio);
          window.removeEventListener('keydown', unlockAudio);
        }).catch((e) => {
          console.warn("Failed to unlock audio element:", e);
          setAudioBlocked(true);
        });
      }
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const playNotificationSound = () => {
    try {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch((err) => {
          console.warn("Audio play blocked by browser autoplay policy or unsupported:", err);
          setAudioBlocked(true);
        });
      }
    } catch (err) {
      console.warn("Failed to play notification sound:", err);
    }
  };
  
  // Auth state & Store state
  const [storeId, setStoreId] = useState<string | null>(null);
  const [unreadKDSCount, setUnreadKDSCount] = useState(0);
  const [stores, setStores] = useState<any[]>([]);
  const [storeName, setStoreName] = useState<string>('Kitchen Console');
  const [loadingStores, setLoadingStores] = useState(false);
  const [showStoreSelector, setShowStoreSelector] = useState(false);

  // KDS Orders state
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // UI states
  const [filterType, setFilterType] = useState<'all' | 'dine_in' | 'takeaway' | 'delivery'>('all');
  const [showHistory, setShowHistory] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({}); // track item strikethroughs
  const [socketConnected, setSocketConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);

  // Socket reference
  const socketRef = useRef<Socket | null>(null);

  // Theme state for KDS Light/Dark Mode
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

  // Authenticate user & Redirect if needed
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    } else if (sessionStatus === 'authenticated' && session?.user) {
      const roles = (session.user as any).roles || [];
      const hasAccess = ['Super Admin', 'Restaurant Owner', 'Manager', 'Cashier', 'Kitchen Staff', 'Waiter'].some(r => roles.includes(r));
      if (!hasAccess) {
        setErrorMsg('Access Denied: You do not have permissions to view the Kitchen Display System.');
      }
    }
  }, [sessionStatus, session, router]);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine Store Context
  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user) {
      const userStoreId = (session.user as any).store_id;
      
      // Try to read storeId from URL query string
      let activeId = userStoreId;
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlStoreId = params.get('storeId');
        if (urlStoreId) {
          // If the user has a restricted store_id in session, they shouldn't view other stores
          if (userStoreId && userStoreId !== urlStoreId) {
            setErrorMsg('Unauthorized store access');
            return;
          }
          activeId = urlStoreId;
        }
      }

      if (activeId) {
        setStoreId(activeId);
        // Fetch store name and restrict list if user is restricted
        fetchStoresList(activeId, !!userStoreId);
      } else {
        // No pre-assigned store_id (e.g. Org owner / Admin), fetch stores
        fetchStoresList();
      }
    }
  }, [sessionStatus, session]);

  const fetchStoresList = async (preselectedId?: string, isRestricted = false) => {
    setLoadingStores(true);
    try {
      const res = await fetch('/api/dashboard/locations');
      const data = await res.json();
      if (data.success && data.locations) {
        if (preselectedId) {
          const selected = data.locations.find((l: any) => l.id === preselectedId);
          if (selected) {
            setStoreName(selected.name);
            if (isRestricted) {
              setStores([selected]); // Restrict list to only this store (hides Switch Store)
            } else {
              setStores(data.locations); // Let admins switch locations
            }
          } else {
            setStores(data.locations);
          }
        } else {
          setStores(data.locations);
          // If only 1 store, auto-select
          if (data.locations.length === 1) {
            setStoreId(data.locations[0].id);
            setStoreName(data.locations[0].name);
          } else if (data.locations.length > 1) {
            setShowStoreSelector(true);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load stores:", err);
    } finally {
      setLoadingStores(false);
    }
  };

  // Connect Socket.IO and load KDS data once storeId is resolved
  useEffect(() => {
    if (!storeId) return;

    // Fetch initial orders
    fetchKDSOrders();

    // Setup polling fallback (every 15s)
    const pollInterval = setInterval(() => {
      fetchKDSOrders(true); // silent reload in background
    }, 15000);

    // Setup Socket.IO Client
    const socket = io({
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[KDS Socket] Connected, joining store:', storeId);
      setSocketConnected(true);
      socket.emit('join_store', storeId);
    });

    socket.on('disconnect', () => {
      console.log('[KDS Socket] Disconnected');
      setSocketConnected(false);
    });

    // Handle new incoming kitchen ticket
    socket.on('kitchen_new_order', (newOrder: any) => {
      console.log('[KDS Socket] New order received:', newOrder);
      playNotificationSound();
      setUnreadKDSCount((c) => c + 1);
      
      // Normalize items key to lowercase to match backend schema
      const normalizedOrder = {
        ...newOrder,
        items: newOrder.items || newOrder.Items || [],
      };
      
      // Prepend to active list if not already present
      setActiveOrders((prev) => {
        if (prev.some((o) => o.id === normalizedOrder.id)) return prev;
        return [...prev, normalizedOrder];
      });

      // Fetch fresh list from database to ensure all includes (like MenuItem description) are properly loaded
      fetchKDSOrders(true);
    });

    // Handle updates from other operators
    socket.on('order_status_changed', (data: { orderId: string; status: string }) => {
      console.log('[KDS Socket] Order status updated remotely:', data);
      
      // Fetch fresh list to reflect full SQL joins/includes correctly
      fetchKDSOrders(true);
    });

    return () => {
      clearInterval(pollInterval);
      if (socket) {
        socket.disconnect();
      }
    };
  }, [storeId]);

  const fetchKDSOrders = async (silent = false) => {
    if (!storeId) return;
    if (!silent) setLoadingOrders(true);
    try {
      const res = await fetch(`/api/orders/kds?storeId=${storeId}`);
      const data = await res.json();
      if (data.success) {
        setActiveOrders(data.activeOrders || []);
        setCompletedOrders(data.completedOrders || []);
        setErrorMsg(null);
      } else {
        setErrorMsg(data.message || 'Failed to query active kitchen tickets.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to connect to active orders API.');
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, currentStatus: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      
      if (data.success) {
        // Emit Socket update to sync cashier and other kitchen terminals
        if (socketRef.current) {
          socketRef.current.emit('order_status_update', {
            storeId,
            orderId,
            status: nextStatus
          });
        }
        
        // Refresh items list
        await fetchKDSOrders(true);
      } else {
        alert(data.message || 'Failed to update order status.');
      }
    } catch (err) {
      console.error("Status update failed:", err);
      alert('Network error while updating status.');
    }
  };

  // Toggle item checklist status
  const toggleItemCheck = (itemId: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Get elapsed minutes since order creation
  const getElapsedMinutes = (createdAtStr: string) => {
    const created = new Date(createdAtStr);
    const diffMs = currentTime.getTime() - created.getTime();
    return Math.floor(diffMs / 60000);
  };

  // Format active cooking timer
  const formatTimer = (createdAtStr: string) => {
    const created = new Date(createdAtStr);
    const diffMs = currentTime.getTime() - created.getTime();
    if (diffMs < 0) return '00:00';
    
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const getTimerColorClass = (createdAtStr: string) => {
    const elapsed = getElapsedMinutes(createdAtStr);
    if (elapsed >= 20) return 'text-rose-500 font-extrabold animate-pulse';
    if (elapsed >= 10) return 'text-amber-500 font-bold';
    return 'text-emerald-400 font-medium';
  };

  // Calculate Consolidated Prep Summary across active items (Pending and Preparing)
  const getPrepSummary = () => {
    const summary: Record<string, { quantity: number; variantNames: Set<string> }> = {};
    
    activeOrders
      .filter((order) => ['pending', 'accepted', 'preparing'].includes(order.status))
      .filter((order) => filterType === 'all' || order.order_type === filterType)
      .forEach((order) => {
        order.items.forEach((item) => {
          const itemName = item.MenuItem?.name || item.name || item.menuItem?.name || 'Unknown Item';
          const variantSuffix = item.variant?.name ? ` (${item.variant.name})` : '';
          const key = `${itemName}${variantSuffix}`;
          
          if (!summary[key]) {
            summary[key] = { quantity: 0, variantNames: new Set() };
          }
          
          // Check if this item instance is not checked off
          if (!checkedItems[item.id]) {
            summary[key].quantity += item.quantity;
          }
        });
      });

    return Object.entries(summary)
      .filter(([_, data]) => data.quantity > 0)
      .map(([name, data]) => ({ name, quantity: data.quantity }));
  };

  const prepSummary = getPrepSummary();

  // Filtered orders list
  const filteredActiveOrders = activeOrders.filter(
    (order) => filterType === 'all' || order.order_type === filterType
  );

  // Group columns
  const pendingCol = filteredActiveOrders.filter((o) => o.status === 'pending');
  const preparingCol = filteredActiveOrders.filter((o) => ['accepted', 'preparing'].includes(o.status));
  const readyCol = filteredActiveOrders.filter((o) => o.status === 'ready');

  // Order Type badge helper
  const getOrderTypeDetails = (type: string) => {
    switch (type) {
      case 'dine_in':
        return { label: 'Dine-In', bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' };
      case 'takeaway':
        return { label: 'Takeaway', bg: 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' };
      case 'delivery':
        return { label: 'Delivery', bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20' };
      case 'qr_order':
        return { label: 'QR Table', bg: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20' };
      default:
        return { label: 'Order', bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20' };
    }
  };

  const renderOrderCard = (order: Order) => {
    const typeDetails = getOrderTypeDetails(order.order_type);
    const timerColor = getTimerColorClass(order.createdAt);
    const elapsedMinutes = getElapsedMinutes(order.createdAt);
    
    return (
      <div
        key={order.id}
        className={`rounded-xl border bg-white dark:bg-[#0d1321] p-4 flex flex-col justify-between shadow-md transition duration-200 hover:border-slate-400 dark:hover:border-slate-700/80 ${
          order.status === 'pending'
            ? 'border-cyan-300 dark:border-cyan-900/40 hover:shadow-cyan-950/10'
            : elapsedMinutes >= 20
            ? 'border-rose-400 dark:border-rose-900/80 shadow-rose-950/10'
            : 'border-slate-200 dark:border-[#1e293b]/60'
        }`}
      >
        {/* Header info */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-900">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-extrabold text-slate-800 dark:text-white text-xs">{order.order_number}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDetailOrder(order);
              }}
              className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white transition ml-1"
              title="View Order Details"
            >
              <Eye className="h-3 w-3" />
            </button>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${typeDetails.bg}`}>
              {typeDetails.label}
            </span>
            
            {/* Table Number details */}
            {order.RestaurantTable && (
              <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">
                Table {order.RestaurantTable.table_number}
              </span>
            )}

            {/* Billing Amount */}
            <span className="text-[9.5px] font-extrabold bg-amber-500/10 text-amber-650 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
              ${parseFloat(order.total_amount as string || '0').toFixed(2)}
            </span>
          </div>
          
          {/* Timer since order creation */}
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <span className={`font-mono text-xs ${timerColor}`}>
              {formatTimer(order.createdAt)}
            </span>
          </div>
        </div>

        {/* Customer Details and Notes */}
        {(order.customer || order.items.some(i => i.notes)) && (
          <div className="py-2 text-[10px] text-slate-600 dark:text-slate-400 flex flex-col gap-1 border-b border-slate-200 dark:border-slate-900 bg-slate-100/50 dark:bg-slate-900/20 px-2 rounded-lg mt-1.5">
            {order.customer && (
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <User className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                {order.customer.name} ({order.customer.phone})
              </span>
            )}
            {/* Find first notes in items or order if any */}
            {order.items.find(i => i.notes)?.notes && (
              <span className="text-amber-600 dark:text-amber-500 font-medium italic flex items-start gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>Notes: {order.items.find(i => i.notes)?.notes}</span>
              </span>
            )}
          </div>
        )}

        {/* Items details */}
        <div className="py-3.5 space-y-3.5">
          {order.items.map((item) => {
            const isChecked = !!checkedItems[item.id];
            
            return (
              <div
                key={item.id}
                onClick={() => toggleItemCheck(item.id)}
                className="group cursor-pointer select-none flex items-start justify-between gap-3 text-xs hover:bg-slate-100 dark:hover:bg-slate-900/40 p-1.5 rounded transition"
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox selector */}
                  <div className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition shrink-0 ${
                    isChecked 
                      ? 'bg-emerald-600 border-emerald-500 text-white' 
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 group-hover:border-slate-400 dark:group-hover:border-slate-500'
                  }`}>
                    {isChecked && <Check className="h-3.5 w-3.5 stroke-[4]" />}
                  </div>
                  
                  {/* Details text */}
                  <div className="flex flex-col flex-1">
                    <span className={`font-semibold text-sm transition ${
                      isChecked ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {item.MenuItem?.name || item.name || item.menuItem?.name || 'Dish Item'}
                      {item.variant?.name && (
                        <span className="text-[10px] font-medium text-slate-650 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800/60 ml-1.5">
                          {item.variant.name}
                        </span>
                      )}
                    </span>
                    
                    {/* MenuItem description */}
                    {(item.MenuItem?.description || item.description || item.menuItem?.description) && (
                      <p className={`text-[11.5px] mt-0.5 leading-normal transition ${
                        isChecked ? 'line-through text-slate-400/80 dark:text-slate-600' : 'text-slate-550 dark:text-slate-400'
                      }`}>
                        {item.MenuItem?.description || item.description || item.menuItem?.description}
                      </p>
                    )}
                    
                    {/* Render Addons */}
                    {item.addons && item.addons.length > 0 && (
                      <div className={`text-[10px] flex flex-wrap gap-1 mt-1.5 transition ${
                        isChecked ? 'line-through text-slate-400 dark:text-slate-650' : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {item.addons.map((addon, aIdx) => (
                          <span key={aIdx} className="bg-slate-100 dark:bg-slate-900/60 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800/40">
                            + {addon.name}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Item Note */}
                    {item.notes && !order.customer && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-500/80 italic mt-0.5">
                        * {item.notes}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Quantity */}
                <span className={`font-mono text-sm font-black transition ${
                  isChecked ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-white'
                }`}>
                  x{item.quantity}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions based on Column */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-900 flex items-center justify-between">
          {order.status === 'pending' && (
            <button
              onClick={() => handleUpdateStatus(order.id, 'pending', 'preparing')}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-extrabold text-white py-2.5 transition shadow-md shadow-blue-600/10"
            >
              <span>Accept Ticket</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}

          {['accepted', 'preparing'].includes(order.status) && (
            <button
              onClick={() => handleUpdateStatus(order.id, 'preparing', 'ready')}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-extrabold text-slate-950 py-2.5 transition shadow-md shadow-amber-500/10"
            >
              <span>Mark Ready</span>
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            </button>
          )}

          {order.status === 'ready' && (
            <button
              onClick={() => handleUpdateStatus(order.id, 'ready', 'completed')}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white py-2.5 transition shadow-md shadow-emerald-600/10"
            >
              <span>Complete & Serve</span>
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            </button>
          )}
        </div>

      </div>
    );
  };

  if (sessionStatus === 'loading' || loadingStores) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#f59e0b] border-t-transparent"></div>
        <p className="mt-4 text-xs font-bold text-slate-400 tracking-wider uppercase">Loading Kitchen System...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white p-4">
        <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-rose-950/40 border border-rose-800/30 mb-4">
          <AlertTriangle className="h-6 w-6 text-rose-500 animate-bounce" />
        </div>
        <h2 className="text-base font-bold text-white mb-2">Kitchen Console Error</h2>
        <p className="text-slate-400 text-xs font-semibold text-center max-w-sm">{errorMsg}</p>
        <button
          onClick={() => {
            setErrorMsg(null);
            if (storeId) {
              fetchKDSOrders();
            } else {
              window.location.reload();
            }
          }}
          className="mt-6 px-4 py-2 bg-slate-900 border border-[#1e293b] hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans select-none overflow-x-hidden transition-colors duration-300 ${
      theme === 'light' 
        ? 'light-theme bg-[#f8fafc] text-slate-800' 
        : 'dark bg-slate-950 text-white'
    }`}>

      {/* Autoplay blocked notification banner */}
      {audioBlocked && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs px-6 py-2.5 flex items-center justify-between font-bold animate-pulse z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#f59e0b]" />
            <span>Sound notifications are muted by your browser\'s security policy. Click anywhere or click Enable Sound to unmute.</span>
          </div>
          <button 
            onClick={() => {
              // Trigger a click gesture which will unlock
              setAudioBlocked(false);
            }}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-[10px] font-black uppercase transition shrink-0"
          >
            Enable Sound
          </button>
        </div>
      )}
      
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-200 dark:border-[#1e293b]/60 bg-white/80 dark:bg-[#080d19]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-lg relative z-20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/30">
            <Tv className="h-5 w-5 text-purple-600 dark:text-purple-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-wide text-slate-800 dark:text-white">{storeName}</h1>
              <span className="text-[10px] text-slate-500 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">KDS V2</span>
            </div>
            <p className="text-[11px] text-slate-550 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className={`h-2 w-2 rounded-full ${socketConnected ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`}></span>
              {socketConnected ? 'Live Connection Established' : 'Sync Offline (Polling Fallback)'}
            </p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center gap-3">
          {/* Order Type Filter Pills */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-[#030712] border border-slate-200 dark:border-[#1e293b] p-1">
            {(['all', 'dine_in', 'takeaway', 'delivery'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize ${
                  filterType === type
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-700/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {type === 'dine_in' ? 'Dine In' : type}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <button
            onClick={() => fetchKDSOrders()}
            disabled={loadingOrders}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-[#1e293b] bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition disabled:opacity-50"
            title="Refresh Display"
          >
            <RefreshCw className={`h-4 w-4 ${loadingOrders ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-[#1e293b] bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 text-slate-500" />
            ) : (
              <Sun className="h-4 w-4 text-[#f59e0b]" />
            )}
          </button>

          <button
            onClick={() => setUnreadKDSCount(0)}
            className={`p-2.5 rounded-xl border transition relative ${
              unreadKDSCount > 0
                ? 'border-rose-300 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                : 'border-slate-200 dark:border-[#1e293b] bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
            title="Unread Kitchen Tickets Notifications"
          >
            <Bell className={`h-4 w-4 ${unreadKDSCount > 0 ? 'animate-bounce' : ''}`} />
            {unreadKDSCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[8px] font-bold text-white shadow-md">
                {unreadKDSCount}
              </span>
            )}
          </button>

          {!isMobile && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-950/40 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition ${
              showHistory
                ? 'bg-purple-100 dark:bg-purple-950/40 border-purple-300 dark:border-purple-500 text-purple-700 dark:text-purple-300'
                : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-[#1e293b] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Recalls</span>
            {completedOrders.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-600 text-[10px] font-black text-white">
                {completedOrders.length}
              </span>
            )}
          </button>

          {stores.length > 1 && (
            <button
              onClick={() => setShowStoreSelector(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1e293b] bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
            >
              <Store className="h-3.5 w-3.5 text-[#f59e0b]" />
              <span>Switch Store</span>
            </button>
          )}

          {/* Local ticking clock */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-sm font-semibold">
            <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ────────────────────────────────────────────────── */}
      <main className="flex-1 p-6 flex flex-col lg:flex-row gap-6 overflow-hidden relative z-10">
        
        {/* Left pane: Kanban Cooking Grid */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Active Prep Summary box */}
          {prepSummary.length > 0 && (
            <div className="rounded-2xl border border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-[#050b18]/60 p-4 backdrop-blur-md shadow-inner flex flex-wrap items-center gap-3 max-h-28 overflow-y-auto custom-scrollbar">
              <span className="text-xs font-black text-blue-700 dark:text-blue-400 tracking-wider uppercase flex items-center gap-1.5 mr-2">
                <ChefHat className="h-4 w-4 text-[#f59e0b]" /> Active Prep Summary:
              </span>
              {prepSummary.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-blue-100/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 px-3 py-1.5 flex items-center gap-2 text-xs"
                >
                  <span className="font-mono font-black text-[#f59e0b] bg-white dark:bg-slate-950/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                    x{item.quantity}
                  </span>
                  <span className="font-semibold text-blue-900 dark:text-slate-300">{item.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Grid of Columns */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden pb-4">
            
            {/* Column 1: Pending (New tickets) */}
            <div className="flex flex-col h-full rounded-2xl bg-slate-100 dark:bg-[#090e18]/80 border border-slate-200 dark:border-[#1e293b]/50 shadow-lg overflow-hidden">
              <div className="bg-cyan-50/50 dark:bg-cyan-950/30 border-b border-cyan-100 dark:border-cyan-950/60 p-4 flex items-center justify-between">
                <h2 className="text-sm font-black text-cyan-700 dark:text-cyan-400 tracking-wide uppercase flex items-center gap-2">
                  <Bell className="h-4 w-4 text-cyan-500 dark:text-cyan-400 animate-bounce" /> New Orders
                </h2>
                <span className="rounded-full bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/40 px-2.5 py-0.5 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
                  {pendingCol.length}
                </span>
              </div>
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {pendingCol.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-xs">
                    <Utensils className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                    <span>No new tickets</span>
                  </div>
                ) : (
                  pendingCol.map((order) => renderOrderCard(order))
                )}
              </div>
            </div>

            {/* Column 2: Preparing (Active cooking) */}
            <div className="flex flex-col h-full rounded-2xl bg-slate-100 dark:bg-[#090e18]/80 border border-slate-200 dark:border-[#1e293b]/50 shadow-lg overflow-hidden">
              <div className="bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-950/60 p-4 flex items-center justify-between">
                <h2 className="text-sm font-black text-amber-800 dark:text-amber-400 tracking-wide uppercase flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-amber-500 dark:text-amber-400" /> Active Cooking
                </h2>
                <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/40 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-800 dark:text-amber-400">
                  {preparingCol.length}
                </span>
              </div>
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {preparingCol.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-xs">
                    <Utensils className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                    <span>No active preparations</span>
                  </div>
                ) : (
                  preparingCol.map((order) => renderOrderCard(order))
                )}
              </div>
            </div>

            {/* Column 3: Ready (Counter / Ready to serve) */}
            <div className="flex flex-col h-full rounded-2xl bg-slate-100 dark:bg-[#090e18]/80 border border-slate-200 dark:border-[#1e293b]/50 shadow-lg overflow-hidden">
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-950/60 p-4 flex items-center justify-between">
                <h2 className="text-sm font-black text-emerald-800 dark:text-emerald-400 tracking-wide uppercase flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> Ready to Serve
                </h2>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-400">
                  {readyCol.length}
                </span>
              </div>
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {readyCol.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-xs">
                    <Utensils className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                    <span>No pending handovers</span>
                  </div>
                ) : (
                  readyCol.map((order) => renderOrderCard(order))
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Drawer panel: Recently Completed History (slide in/out layout) */}
        {showHistory && (
          <aside className="w-80 rounded-2xl border border-purple-200 dark:border-purple-900/30 bg-purple-50 dark:bg-[#0d0a1b] p-4 flex flex-col shadow-2xl relative z-10 transition duration-300 ease-in-out shrink-0">
            <div className="flex items-center justify-between pb-3 border-b border-purple-200 dark:border-purple-950/60 mb-4">
              <h2 className="text-xs font-black tracking-wider uppercase text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <History className="h-4 w-4" /> Served Log (Last 1 hr)
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-bold font-mono px-2 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-900"
              >
                Close
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {completedOrders.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-xs">
                  <span>No served orders recently</span>
                </div>
              ) : (
                completedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#141226]/80 border border-purple-100 dark:border-purple-950/40 space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-xs text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                          <span>{order.order_number}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDetailOrder(order);
                            }}
                            className="p-1 rounded bg-purple-100/50 hover:bg-purple-200/50 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 hover:text-purple-900 dark:text-purple-355 dark:hover:text-white transition"
                            title="View Order Details"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                          <span className="text-[9px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/20 px-1.5 py-0.5 rounded">
                            ${parseFloat(order.total_amount as string || '0').toFixed(2)}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          Served: {new Date(order.updatedAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'completed', 'preparing')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-800 text-[10px] font-black text-purple-700 dark:text-purple-300 transition"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Recall</span>
                      </button>
                    </div>

                    <div className="border-t border-purple-100 dark:border-purple-950/40 pt-2 space-y-2">
                      {order.items.map((item) => {
                        const itemDescription = item.MenuItem?.description || item.description || item.menuItem?.description;
                        return (
                          <div key={item.id} className="text-xs flex flex-col text-slate-700 dark:text-slate-350">
                            <div className="flex justify-between font-semibold">
                              <span>
                                x{item.quantity} {item.MenuItem?.name || item.name || item.menuItem?.name || 'Dish Item'}
                                {item.variant?.name && (
                                  <span className="text-[9px] font-medium text-slate-600 bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-800 ml-1.5">
                                    {item.variant.name}
                                  </span>
                                )}
                              </span>
                            </div>
                            
                            {/* MenuItem description */}
                            {itemDescription && (
                              <p className="text-[10.5px] text-slate-500 dark:text-slate-450 leading-normal mt-0.5 italic">
                                {itemDescription}
                              </p>
                            )}

                            {/* Render Addons in served log */}
                            {item.addons && item.addons.length > 0 && (
                              <div className="text-[9.5px] flex flex-wrap gap-1 mt-1 text-slate-500 dark:text-slate-400">
                                {item.addons.map((addon, aIdx) => (
                                  <span key={aIdx} className="bg-slate-100 dark:bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800/40">
                                    + {addon.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

      </main>

      {/* ── STORE SELECTOR OVERLAY ─────────────────────────────────────── */}
      {showStoreSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-[#1e293b] bg-white dark:bg-[#0c101b] p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 mb-4">
              <Store className="h-5 w-5 text-amber-600 dark:text-[#f59e0b]" />
            </div>
            
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Select Kitchen Location</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-6">
              This organization runs multiple outlet kitchens. Choose the kitchen screen you wish to launch.
            </p>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {stores.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setStoreId(s.id);
                    setStoreName(s.name);
                    setShowStoreSelector(false);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 hover:border-slate-350 dark:hover:border-slate-800 text-left transition"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-white">{s.name}</div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" /> {s.address}, {s.city || ''}
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-slate-500 dark:text-slate-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* ── ORDER DETAIL MODAL ────────────────────────────────────────── */}
      {selectedDetailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-900 p-5 bg-slate-50 dark:bg-slate-950/40">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-black text-slate-800 dark:text-white">
                  Order Details: {selectedDetailOrder.order_number}
                </h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${getOrderTypeDetails(selectedDetailOrder.order_type).bg}`}>
                  {getOrderTypeDetails(selectedDetailOrder.order_type).label}
                </span>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded border ${
                  selectedDetailOrder.status === 'pending'
                    ? 'border-cyan-300 dark:border-cyan-900/40 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400'
                    : selectedDetailOrder.status === 'ready'
                    ? 'border-emerald-300 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                    : 'border-amber-300 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                }`}>
                  {selectedDetailOrder.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedDetailOrder(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              
              {/* Order Metadata Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-100 dark:border-slate-900/60 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block font-semibold uppercase tracking-wider text-[9px]">Received At</span>
                  <span className="font-bold text-slate-750 dark:text-slate-200">{new Date(selectedDetailOrder.createdAt).toLocaleTimeString()} ({new Date(selectedDetailOrder.createdAt).toLocaleDateString()})</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block font-semibold uppercase tracking-wider text-[9px]">Elapsed Time</span>
                  <span className={`font-bold font-mono ${getTimerColorClass(selectedDetailOrder.createdAt)}`}>
                    {formatTimer(selectedDetailOrder.createdAt)}
                  </span>
                </div>
                {selectedDetailOrder.RestaurantTable && (
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block font-semibold uppercase tracking-wider text-[9px]">Dining Table</span>
                    <span className="font-bold text-slate-750 dark:text-slate-200">Table {selectedDetailOrder.RestaurantTable.table_number}</span>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              {selectedDetailOrder.customer && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Customer Information
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-900/40 text-xs space-y-1">
                    <p className="font-bold text-slate-750 dark:text-slate-200">{selectedDetailOrder.customer.name}</p>
                    <p className="text-slate-500 dark:text-slate-400">Phone: {selectedDetailOrder.customer.phone}</p>
                    {(selectedDetailOrder.customer as any).email && (
                      <p className="text-slate-500 dark:text-slate-400">Email: {(selectedDetailOrder.customer as any).email}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items Details */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Utensils className="h-3.5 w-3.5" /> Items Checklist
                </h4>
                <div className="border border-slate-250/60 dark:border-slate-900 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-900">
                  {selectedDetailOrder.items.map((item) => {
                    const isChecked = !!checkedItems[item.id];
                    const itemDescription = item.MenuItem?.description || item.description || item.menuItem?.description;
                    
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleItemCheck(item.id)}
                        className="p-4 flex items-start justify-between gap-4 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-900/20 transition"
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <div className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition shrink-0 ${
                            isChecked 
                              ? 'bg-emerald-600 border-emerald-500 text-white' 
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950'
                          }`}>
                            {isChecked && <Check className="h-3.5 w-3.5 stroke-[4]" />}
                          </div>

                          <div className="flex flex-col">
                            <span className={`font-bold text-sm ${
                              isChecked ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
                            }`}>
                              {item.MenuItem?.name || item.name || item.menuItem?.name || 'Dish Item'}
                              {item.variant?.name && (
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-250 dark:border-slate-800 ml-2">
                                  {item.variant.name}
                                </span>
                              )}
                            </span>

                            {itemDescription && (
                              <p className={`text-xs mt-1 leading-relaxed ${
                                isChecked ? 'line-through text-slate-400/80 dark:text-slate-600' : 'text-slate-550 dark:text-slate-400'
                              }`}>
                                {itemDescription}
                              </p>
                            )}

                            {/* Render Addons */}
                            {item.addons && item.addons.length > 0 && (
                              <div className="text-[10px] flex flex-wrap gap-1 mt-2">
                                {item.addons.map((addon, aIdx) => (
                                  <span key={aIdx} className="bg-slate-100 dark:bg-slate-900/60 px-1.5 py-0.5 rounded text-slate-650 dark:text-slate-400 border border-slate-250 dark:border-slate-850">
                                    + {addon.name}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Item notes */}
                            {item.notes && (
                              <span className="text-xs text-amber-650 dark:text-amber-500/80 italic mt-2 flex items-start gap-1 font-medium">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <span>Note: {item.notes}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity & Unit Price */}
                        <div className="text-right shrink-0 font-medium">
                          <span className={`font-mono text-sm font-black block ${
                            isChecked ? 'text-slate-400 dark:text-slate-500' : 'text-slate-850 dark:text-white'
                          }`}>
                            x{item.quantity}
                          </span>
                          <span className="text-[10.5px] text-slate-450 dark:text-slate-500 font-mono mt-0.5 block">
                            ${parseFloat(item.unit_price as any || item.price as any || '0').toFixed(2)} ea
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Billing Summary */}
              <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-205 dark:border-slate-900 rounded-xl p-4.5 space-y-2.5 text-xs text-slate-550 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">${parseFloat(selectedDetailOrder.subtotal as any || '0').toFixed(2)}</span>
                </div>
                {parseFloat(selectedDetailOrder.discount_amount as any) > 0 && (
                  <div className="flex justify-between text-rose-600 dark:text-rose-450">
                    <span>Discount:</span>
                    <span className="font-mono">-${parseFloat(selectedDetailOrder.discount_amount as any).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">${parseFloat(selectedDetailOrder.tax_amount as any || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2.5 border-t border-slate-200 dark:border-slate-900 text-sm font-extrabold text-slate-850 dark:text-white">
                  <span>Total Bill Amount:</span>
                  <span className="font-mono text-amber-500">${parseFloat(selectedDetailOrder.total_amount as any || '0').toFixed(2)}</span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 flex justify-between gap-3">
              <button
                onClick={() => setSelectedDetailOrder(null)}
                className="w-1/3 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 py-3 text-xs font-extrabold text-slate-650 dark:text-slate-350 transition"
              >
                Close Details
              </button>
              
              {selectedDetailOrder.status === 'pending' && (
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedDetailOrder.id, 'pending', 'preparing');
                    setSelectedDetailOrder(null);
                  }}
                  className="w-2/3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-extrabold text-white py-3 transition shadow-md shadow-blue-600/10"
                >
                  <span>Accept Ticket</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}

              {['accepted', 'preparing'].includes(selectedDetailOrder.status) && (
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedDetailOrder.id, 'preparing', 'ready');
                    setSelectedDetailOrder(null);
                  }}
                  className="w-2/3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-extrabold text-slate-950 py-3 transition shadow-md shadow-amber-500/10"
                >
                  <span>Mark Ready</span>
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </button>
              )}

              {selectedDetailOrder.status === 'ready' && (
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedDetailOrder.id, 'ready', 'completed');
                    setSelectedDetailOrder(null);
                  }}
                  className="w-2/3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white py-3 transition shadow-md shadow-emerald-600/10"
                >
                  <span>Complete & Serve</span>
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Icon helper
function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
