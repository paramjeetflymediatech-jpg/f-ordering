'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Plus,
  Minus,
  ShoppingBag,
  MapPin,
  Phone,
  ArrowLeft,
  X,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Award,
  Menu as MenuIcon,
} from 'lucide-react';

interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  variant: any | null;
  addons: any[];
  notes?: string;
}

const getItemInitialsAndColor = (name: string) => {
  const words = name.trim().split(/\s+/);
  let initials = '';
  if (words.length > 0) {
    if (words.length >= 2) {
      initials = (words[0][0] + words[1][0]).toUpperCase();
    } else {
      const word = words[0];
      const match = word.match(/^([a-zA-Z])(.*?)(\d+)$/);
      if (match) {
        initials = (match[1] + match[3]).toUpperCase();
      } else {
        initials = word.substring(0, 2).toUpperCase();
      }
    }
  }

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-[#E07A5F]', // soft terracotta
    'bg-[#3D5A80]', // soft steel blue
    'bg-[#81B29A]', // soft sage green
    'bg-[#F2CC8F]', // soft mustard yellow
    'bg-[#98C1D9]', // soft ice blue
    'bg-[#A8DADC]', // soft mint
    'bg-[#457B9D]', // soft deep blue
  ];
  const color = colors[Math.abs(hash) % colors.length];
  return { initials, color };
};

// ─── Stripe Card Checkout Component ──────────────────────────────────────────
function StripeCardCheckout({
  storeId,
  amount,
  orderPayload,
  onSuccess,
  onError,
  cardError,
  submitting,
  setSubmitting,
}: {
  storeId: string;
  amount: number;
  orderPayload: any;
  onSuccess: (order: any) => void;
  onError: (msg: string) => void;
  cardError: string | null;
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
      // 1. Create PaymentIntent on server using the store owner's key
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

      // 2. Confirm card payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) { setSubmitting(false); return; }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        { payment_method: { card: cardElement } }
      );

      if (stripeError) {
        onError(stripeError.message || 'Card payment failed.');
        setSubmitting(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // 3. Submit order with stripe reference
        const orderRes = await fetch('/api/public/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...orderPayload,
            paymentMethod: 'card',
            stripePaymentIntentId: paymentIntent.id,
          }),
        });
        const orderData = await orderRes.json();
        if (orderData.success) {
          onSuccess(orderData.order);
        } else {
          onError(orderData.error || 'Order could not be saved after payment.');
        }
      }
    } catch (err: any) {
      onError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Card Details</p>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '14px',
                color: '#1e293b',
                fontFamily: 'system-ui, sans-serif',
                '::placeholder': { color: '#94a3b8' },
              },
              invalid: { color: '#ef4444' },
            },
          }}
        />
      </div>
      {cardError && (
        <p className="text-xs text-red-500 font-medium flex items-center gap-1">⚠️ {cardError}</p>
      )}
      <button
        type="button"
        onClick={handleCardPay}
        disabled={submitting || !stripe}
        className="w-full rounded-xl bg-gradient-to-r from-[#635BFF] to-[#7C73FF] py-3 text-xs font-bold text-white hover:opacity-90 transition shadow-lg disabled:opacity-50"
      >
        {submitting ? 'Processing Payment...' : `Pay $${amount.toFixed(2)} by Card`}
      </button>
    </div>
  );
}

export default function PublicOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;

  // Store & Menu state
  const [store, setStore] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart & UI states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [activeModal, setActiveModal] = useState<'checkout' | 'success' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Checkout details
  const [customer, setCustomer] = useState<any>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('takeaway');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [recentOrder, setRecentOrder] = useState<any>(null);
  const [newAccount, setNewAccount] = useState<{ phone: string; tempPassword: string } | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [stripeStoreId, setStripeStoreId] = useState<string | null>(null);

  // Fetch Store Info and Menu by Organization Slug
  useEffect(() => {
    if (!orgSlug) return;

    const fetchStoreAndMenu = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Store Config by Org Slug
        const storeRes = await fetch(`/api/public/store?orgSlug=${orgSlug}`);
        const storeData = await storeRes.json();
        if (!storeRes.ok || !storeData.success) {
          throw new Error(storeData.error || 'Failed to load store information.');
        }
        setStore(storeData.store);
        setTables(storeData.tables || []);
        setStripeStoreId(storeData.store?.id || null);

        // Check if Stripe is configured for this store (lightweight — no PaymentIntent created)
        if (storeData.store?.id) {
          try {
            const cfgRes = await fetch(`/api/public/stripe/config?storeId=${storeData.store.id}`);
            const cfgData = await cfgRes.json();
            if (cfgData.enabled && cfgData.publishableKey) {
              setStripeEnabled(true);
              setStripePromise(loadStripe(cfgData.publishableKey));
            }
          } catch {
            // Stripe not configured — cash only
          }
        }

        // 2. Fetch Menu by Org Slug
        const menuRes = await fetch(`/api/public/menu?orgSlug=${orgSlug}`);
        const menuData = await menuRes.json();
        if (!menuRes.ok || !menuData.success) {
          throw new Error(menuData.error || 'Failed to load menu listing.');
        }
        setCategories(menuData.categories || []);

        // 3. Fetch logged in customer info if exists (for prefilling)
        try {
          const custRes = await fetch('/api/public/customer/me');
          const custData = await custRes.json();
          if (custRes.ok && custData.success && custData.customer) {
            setCustomer(custData.customer);
            setCustomerName(custData.customer.name);
            setCustomerPhone(custData.customer.phone);
            setCustomerEmail(custData.customer.email || '');
          }
        } catch (e) {
          // Ignore if not logged in
        }

      } catch (err: any) {
        setError(err.message || 'An error occurred while setting up the terminal.');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreAndMenu();
  }, [orgSlug]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/public/customer/logout', { method: 'POST' });
      if (res.ok) {
        setCustomer(null);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
      }
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-400 font-semibold tracking-wider">Loading Digital Menu...</p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100 text-center">
        <AlertCircle className="h-14 w-14 text-red-500 mb-4" />
        <h2 className="text-2xl font-black">Store Not Found</h2>
        <p className="mt-2 text-sm text-slate-400 max-w-sm">
          {error || 'The restaurant branch does not exist or may have been deactivated.'}
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 rounded-xl bg-slate-900 border border-slate-800 px-6 py-3 text-sm font-semibold hover:bg-slate-800 transition"
        >
          Return Home
        </button>
      </div>
    );
  }

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

  const getCartTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxRate = parseFloat(store.tax_rate) || 8.25;
    const tax = (subtotal * taxRate) / 100;
    return {
      subtotal,
      tax,
      total: subtotal + tax,
    };
  };

  const handleOpenItem = (item: any) => {
    setSelectedItem(item);
    setSelectedVariant(item.variants?.[0] || null);
    setSelectedAddons([]);
  };

  const handleToggleAddon = (addon: any) => {
    setSelectedAddons((prev) =>
      prev.some((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;

    let finalUnitPrice = parseFloat(selectedItem.price);
    if (selectedVariant) {
      finalUnitPrice += parseFloat(selectedVariant.additional_price || 0);
    }
    const addonPrice = selectedAddons.reduce((sum, addon) => sum + parseFloat(addon.price || 0), 0);
    finalUnitPrice += addonPrice;

    const cartItemId = `${selectedItem.id}-${selectedVariant?.id || 'none'}-${selectedAddons
      .map((a) => a.id)
      .sort()
      .join(',')}`;

    const existingIndex = cart.findIndex((item) => item.id === cartItemId);
    
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart((prev) => [
        ...prev,
        {
          id: cartItemId,
          menuItemId: selectedItem.id,
          name: selectedItem.name,
          price: finalUnitPrice,
          quantity: 1,
          variant: selectedVariant,
          addons: selectedAddons,
        },
      ]);
    }

    setSelectedItem(null);
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCart((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
      );
    }
  };

  const handleCashCheckout = async (cartItems: CartItem[], payload: any) => {
    const res = await fetch('/api/public/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, paymentMethod: 'cash' }),
    });
    const data = await res.json();
    if (data.success) {
      setRecentOrder(data.order);
      setNewAccount(data.newAccount || null);
      setCart([]);
      setDeliveryAddress('');
      setActiveModal('success');
    } else {
      alert(data.error || 'Failed to place order.');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    setCardError(null);

    try {
      const payload = {
        storeId: store.id,
        customerName,
        customerPhone,
        customerEmail,
        items: cart,
        orderType: orderType === 'dine_in' ? 'qr_order' : orderType,
        tableId: orderType === 'dine_in' ? selectedTableId : undefined,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
        notes: checkoutNotes,
      };

      if (paymentMethod === 'cash' || !stripeEnabled) {
        await handleCashCheckout(cart, payload);
      }
      // Card flow is handled inside StripeCardCheckout component
    } catch (err) {
      console.error(err);
      alert('Network error while processing order.');
    } finally {
      setSubmitting(false);
    }
  };

  const totals = getCartTotal();

  const categoriesWithFilteredItems = categories.map((cat) => {
    const matched = (cat.MenuItems || []).filter((item: any) => {
      const matchesCategory = selectedCategoryId === 'all' || item.category_id === selectedCategoryId;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    return { ...cat, filteredItems: matched };
  }).filter(cat => cat.filteredItems.length > 0);

  const primaryColor = store?.theme_primary_color || '#2A0E07';
  const accentColor = store?.theme_accent_color || '#C39A3C';
  const bgColor = store?.theme_bg_color || '#F9F6F0';
  const fontStyle = store?.theme_font || 'serif';
  const layoutStyle = store?.theme_layout || 'classic';

  const getFontFamily = (font: string) => {
    switch (font) {
      case 'sans':
        return 'system-ui, -apple-system, sans-serif';
      case 'playfair':
        return '"Playfair Display", Georgia, serif';
      default:
        return 'Poppins, Georgia, ui-serif, serif';
    }
  };

  return (
    <div
      className={`min-h-screen pb-24 lg:pb-0 ${
        layoutStyle === 'modern_dark' ? 'text-slate-100 font-sans' : 'text-slate-800 font-sans'
      }`}
      style={{
        backgroundColor: bgColor,
        fontFamily: getFontFamily(fontStyle),
      }}
    >
      
      {/* HEADER NAVBAR */}
      <header
        className="sticky top-0 z-40 px-6 py-4 shadow-md border-b"
        style={{
          backgroundColor: primaryColor,
          borderColor: `${primaryColor}dd`,
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo & Name */}
          <Link href={`/order-online/${orgSlug}/menu`} className="flex items-center gap-3">
            {store.Organization?.logo ? (
              <img src={store.Organization.logo} alt={store.Organization.name} className="h-16 max-h-20 w-auto object-contain" />
            ) : (
              <span className="font-serif text-lg font-extrabold tracking-widest text-white uppercase">
                {store.Organization?.name || store.name}
              </span>
            )}
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold">
            {store.website ? (
              <a href={store.website} className="text-white transition">
                Home
              </a>
            ) : (
              <Link href="/" className="text-white transition">
                Home
              </Link>
            )}
            <Link
              href={`/order-online/${orgSlug}/menu`}
              className="hover:text-white transition"
              style={{ color: accentColor }}
            >
              Menu
            </Link>
            {store.website ? (
              <a href={`${store.website.replace(/\/$/, '')}/#about`} className="text-white transition">
                About Us
              </a>
            ) : (
              <Link href={store.website?(`${store.website.replace(/\/$/, '')}/about`) : "/about"} className="text-white transition">
                About Us
              </Link>
            )}
            <Link href={`/order-online/${orgSlug}/book`} className="text-white transition">
              Book Table
            </Link>
            {customer ? (
              <>
                <Link
                  href={`/order-online/${orgSlug}/customer/profile`}
                  className="text-white transition flex items-center gap-1.5"
                >
                  <User className="h-4 w-4" /> Hi, {customer.name}
                </Link>
                {customer.loyaltyPoints !== undefined && (
                  <span
                    className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold border"
                    style={{
                      backgroundColor: `${accentColor}1a`,
                      color: accentColor,
                      borderColor: `${accentColor}26`,
                    }}
                  >
                    <Award className="h-3.5 w-3.5" /> {customer.loyaltyPoints} PTS
                  </span>
                )}
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition" title="Log Out">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link href={`/order-online/${orgSlug}/customer/login`} className="text-white transition flex items-center gap-1">
                  <LogIn className="h-4 w-4" /> Login
                </Link>
                <Link
                  href={`/order-online/${orgSlug}/customer/register`}
                  className="text-white px-3 py-1.5 rounded-lg transition text-xs font-bold uppercase tracking-wider hover:opacity-90"
                  style={{ backgroundColor: accentColor }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-xl text-white hover:bg-white/10 transition"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className={`w-72 h-full p-6 shadow-2xl flex flex-col justify-between ${
            layoutStyle === 'modern_dark' ? 'bg-[#0c101b] text-white border-l border-[#1e293b]/60' : 'bg-white text-slate-800'
          }`}>
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <span className="font-bold text-sm uppercase tracking-wider">Navigation</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:opacity-85">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-4 text-sm font-semibold">
                {store.website ? (
                  <a href={store.website} className="hover:opacity-80 py-1 transition">
                    Home
                  </a>
                ) : (
                  <Link href="/" onClick={() => setMobileMenuOpen(false)} className="hover:opacity-80 py-1 transition">
                    Home
                  </Link>
                )}
                <Link
                  href={`/order-online/${orgSlug}/menu`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:opacity-80 py-1 transition"
                  style={{ color: accentColor }}
                >
                  Menu
                </Link>
                {store.website ? (
                  <a href={`${store.website.replace(/\/$/, '')}/#about`} className="hover:opacity-80 py-1 transition">
                    About Us
                  </a>
                ) : (
                  <Link href={store.website?(`${store.website.replace(/\/$/, '')}/about`) : "/about"} onClick={() => setMobileMenuOpen(false)} className="hover:opacity-80 py-1 transition">
                    About Us
                  </Link>
                )}
                <Link href={`/order-online/${orgSlug}/book`} onClick={() => setMobileMenuOpen(false)} className="hover:opacity-80 py-1 transition">
                  Book Table
                </Link>
              </nav>
            </div>

            <div className="pt-6 border-t border-slate-200/80">
              {customer ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-xs font-bold">{customer.name}</p>
                      {customer.loyaltyPoints !== undefined && (
                        <p className="text-[10px] font-semibold text-amber-500 uppercase">{customer.loyaltyPoints} PTS</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-950/20 border border-red-900/15 py-2.5 text-xs font-bold text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/order-online/${orgSlug}/customer/login`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-xl border border-slate-200 py-2.5 text-xs font-bold"
                  >
                    Login
                  </Link>
                  <Link
                    href={`/order-online/${orgSlug}/customer/register`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                    style={{ backgroundColor: accentColor }}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE CATEGORIES HORIZONTAL SLIDER */}
      <div 
        className={`lg:hidden border-b px-6 py-3 overflow-x-auto whitespace-nowrap flex gap-2 custom-scrollbar ${
          layoutStyle === 'modern_dark'
            ? 'bg-[#0c101b] border-[#1e293b]/60'
            : 'bg-white border-slate-200'
        }`}
      >
        <button
          onClick={() => setSelectedCategoryId('all')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 ${
            selectedCategoryId === 'all'
              ? 'text-white'
              : layoutStyle === 'modern_dark'
              ? 'text-slate-400 bg-slate-900/40 border border-[#1e293b]'
              : 'text-slate-600 bg-slate-50 border border-slate-100'
          }`}
          style={selectedCategoryId === 'all' ? { backgroundColor: primaryColor } : undefined}
        >
          All Items
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 ${
              selectedCategoryId === cat.id
                ? 'text-white'
                : layoutStyle === 'modern_dark'
                ? 'text-slate-400 bg-slate-900/40 border border-[#1e293b]'
                : 'text-slate-600 bg-slate-50 border border-slate-100'
            }`}
            style={selectedCategoryId === cat.id ? { backgroundColor: primaryColor } : undefined}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* BODY LAYOUT */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* COLUMN 1: CATEGORY SIDEBAR (LEFT) */}
        <div className="w-64 shrink-0 hidden lg:block">
          <div
            className={`sticky top-24 border rounded-2xl p-4 shadow-sm space-y-1 ${
              layoutStyle === 'modern_dark'
                ? 'bg-[#0c101b]/80 border-[#1e293b]/60 text-white shadow-xl shadow-slate-950/20'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Categories</h3>
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                selectedCategoryId === 'all'
                  ? 'text-white font-extrabold'
                  : layoutStyle === 'modern_dark'
                  ? 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              style={selectedCategoryId === 'all' ? { backgroundColor: primaryColor } : undefined}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  selectedCategoryId === cat.id
                    ? 'text-white border-l-4 font-extrabold'
                    : layoutStyle === 'modern_dark'
                    ? 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
                style={
                  selectedCategoryId === cat.id
                    ? { backgroundColor: primaryColor, borderLeftColor: accentColor }
                    : undefined
                }
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* COLUMN 2: MENU CATALOG (CENTER) */}
        <div className="flex-1 space-y-6">
          {/* Order Type & Search Bar */}
          <div
            className={`border rounded-2xl p-6 shadow-sm ${
              layoutStyle === 'modern_dark'
                ? 'bg-[#0c101b]/80 border-[#1e293b]/60 text-white shadow-xl shadow-slate-950/20'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <h3 className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Select Order Type</h3>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setOrderType('takeaway')}
                className={`p-4 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                  orderType === 'takeaway'
                    ? 'border-transparent text-white font-extrabold shadow-md'
                    : layoutStyle === 'modern_dark'
                    ? 'border-[#1e293b] text-slate-405 hover:border-slate-700 bg-slate-950/40'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                style={orderType === 'takeaway' ? { backgroundColor: primaryColor } : undefined}
              >
                <span className="text-sm uppercase tracking-wide">Take Away</span>
                <span className={`text-[10px] mt-1 ${orderType === 'takeaway' ? 'text-white/80' : 'text-slate-500'}`}>Open 05:00 PM - 10:00 PM</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`p-4 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                  orderType === 'delivery'
                    ? 'border-transparent text-white font-extrabold shadow-md'
                    : layoutStyle === 'modern_dark'
                    ? 'border-[#1e293b] text-slate-405 hover:border-slate-700 bg-slate-950/40'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                style={orderType === 'delivery' ? { backgroundColor: primaryColor } : undefined}
              >
                <span className="text-sm uppercase tracking-wide">Delivery</span>
                <span className={`text-[10px] mt-1 ${orderType === 'delivery' ? 'text-white/80' : 'text-slate-500'}`}>Open 05:00 PM - 10:00 PM</span>
              </button>
            </div>

            <div className="relative mt-6 max-w-md mx-auto">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-450" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition ${
                  layoutStyle === 'modern_dark'
                    ? 'border-[#1e293b] bg-slate-950 text-white focus:border-slate-700 focus:bg-slate-950/90'
                    : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-slate-400 focus:bg-white'
                }`}
              />
            </div>
          </div>

          {/* Menu Sections */}
          {categoriesWithFilteredItems.length === 0 ? (
            <div
              className={`text-center py-12 border rounded-2xl ${
                layoutStyle === 'modern_dark'
                  ? 'bg-[#0c101b]/80 border-[#1e293b]/60 text-slate-400 shadow-xl'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <p className="font-semibold">No food items found matching your filter.</p>
            </div>
          ) : (
            categoriesWithFilteredItems.map((cat) => (
              <div
                key={cat.id}
                className={`border rounded-2xl shadow-sm overflow-hidden mb-6 ${
                  layoutStyle === 'modern_dark'
                    ? 'bg-[#0c101b]/80 border-[#1e293b]/60 text-white shadow-xl shadow-slate-950/20'
                    : 'bg-white border-slate-200 text-slate-805'
                }`}
              >
                <div
                  className="px-4 py-3 border-b flex justify-between items-center"
                  style={{
                    backgroundColor: primaryColor,
                    borderColor: `${primaryColor}dd`,
                  }}
                >
                  <h2 className="font-black tracking-widest text-white text-sm uppercase" style={{ fontFamily: fontStyle === 'playfair' ? '"Playfair Display", serif' : 'inherit' }}>
                    {cat.name}
                  </h2>
                </div>
                <div className={`divide-y ${layoutStyle === 'modern_dark' ? 'divide-[#1e293b]/40' : 'divide-slate-100'}`}>
                  {cat.filteredItems.map((item: any) => {
                    const { initials, color } = getItemInitialsAndColor(item.name);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleOpenItem(item)}
                        className={`flex items-center gap-4 p-4 transition cursor-pointer ${
                          layoutStyle === 'modern_dark' ? 'hover:bg-slate-900/20' : 'hover:bg-slate-50/50'
                        }`}
                      >
                        {/* Thumbnail / Initials */}
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-16 w-16 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className={`h-16 w-16 rounded-xl text-white font-extrabold flex items-center justify-center shrink-0 ${color}`}>
                            {initials}
                          </div>
                        )}

                        {/* Middle Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold text-sm ${layoutStyle === 'modern_dark' ? 'text-white' : 'text-slate-800'}`} style={{ fontFamily: fontStyle === 'playfair' ? '"Playfair Display", serif' : 'inherit' }}>{item.name}</h3>
                          <p className={`text-xs mt-1 line-clamp-2 ${layoutStyle === 'modern_dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            {item.description || ''}
                          </p>
                        </div>

                        {/* Price & Quantity Selector */}
                        <div className="flex items-center gap-6 shrink-0">
                          <span className={`font-extrabold text-sm ${layoutStyle === 'modern_dark' ? 'text-white' : 'text-slate-800'}`}>
                            ${parseFloat(item.price).toFixed(2)}
                          </span>

                          <div className="flex items-center gap-2">
                            {(() => {
                              const cartItems = cart.filter((c) => c.menuItemId === item.id);
                              const totalQty = cartItems.reduce((s, c) => s + c.quantity, 0);

                              if (totalQty > 0) {
                                return (
                                  <div
                                    className="flex items-center gap-2 border border-slate-200 rounded-lg p-1 bg-slate-50"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => {
                                        if (cartItems.length > 0) {
                                          updateQuantity(cartItems[0].id, cartItems[0].quantity - 1);
                                        }
                                      }}
                                      className="p-1 hover:text-red-500 transition text-slate-500"
                                    >
                                      <Minus className="h-3.5 w-3.5" />
                                    </button>
                                    <span className="text-xs font-bold text-slate-800 w-5 text-center">{totalQty}</span>
                                    <button
                                      onClick={() => {
                                        if (item.variants && item.variants.length > 0) {
                                          handleOpenItem(item);
                                        } else {
                                          updateQuantity(cartItems[0].id, cartItems[0].quantity + 1);
                                        }
                                      }}
                                      className="p-1 hover:text-[#2A0E07] transition text-slate-500"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                );
                              } else {
                                return (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if ((item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0)) {
                                        handleOpenItem(item);
                                      } else {
                                        setCart((prev) => [
                                          ...prev,
                                          {
                                            id: `${item.id}-none-`,
                                            menuItemId: item.id,
                                            name: item.name,
                                            price: parseFloat(item.price),
                                            quantity: 1,
                                            variant: null,
                                            addons: [],
                                          },
                                        ]);
                                      }
                                    }}
                                    className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold transition hover:opacity-90"
                                    style={{
                                      backgroundColor: `${accentColor}12`,
                                      borderColor: `${accentColor}40`,
                                      color: accentColor,
                                    }}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add
                                  </button>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* COLUMN 3: DESKTOP CART PANEL (RIGHT) */}
        <div className="w-full lg:w-80 shrink-0 hidden lg:block">
          <div
            className={`sticky top-24 border rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[80vh] ${
              layoutStyle === 'modern_dark'
                ? 'bg-[#0c101b]/80 border-[#1e293b]/60 text-white shadow-xl shadow-slate-950/20'
                : 'bg-white border-slate-200 text-slate-805'
            }`}
          >
            <div
              className={`p-4 border-b flex items-center justify-between ${
                layoutStyle === 'modern_dark' ? 'border-[#1e293b]/60 bg-slate-950/50' : 'border-slate-100 bg-slate-50'
              }`}
            >
              <h2 className={`text-xs font-bold flex items-center gap-2 ${layoutStyle === 'modern_dark' ? 'text-white' : 'text-slate-705'}`}>
                <ShoppingBag className="h-4 w-4" style={{ color: accentColor }} />
                Your Cart ({cart.reduce((s, c) => s + c.quantity, 0)})
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-slate-400 hover:text-red-500 font-bold transition"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className={`flex-1 overflow-y-auto p-4 space-y-4 max-h-[40vh] divide-y ${layoutStyle === 'modern_dark' ? 'divide-[#1e293b]/40' : 'divide-slate-100'}`}>
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  <ShoppingBag className="h-8 w-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                  Your cart is currently empty
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex justify-between items-center ${idx > 0 ? 'pt-3' : ''}`}
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <p className={`text-xs font-bold truncate ${layoutStyle === 'modern_dark' ? 'text-white' : 'text-slate-700'}`}>{item.name}</p>
                      {item.variant && (
                        <p className="text-[10px] mt-0.5 font-semibold" style={{ color: accentColor }}>Variant: {item.variant.name}</p>
                      )}
                      {item.addons.length > 0 && (
                        <p className={`text-[10px] truncate mt-0.5 font-semibold ${layoutStyle === 'modern_dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          Addons: {item.addons.map((a) => a.name).join(', ')}
                        </p>
                      )}
                      <p className={`text-xs font-black mt-1 ${layoutStyle === 'modern_dark' ? 'text-white' : 'text-slate-805'}`}>${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    
                    <div className={`flex items-center gap-1.5 border rounded-lg p-0.5 ${layoutStyle === 'modern_dark' ? 'border-[#1e293b] bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className={`rounded p-0.5 text-slate-450 ${layoutStyle === 'modern_dark' ? 'hover:bg-slate-900' : 'hover:bg-slate-100'}`}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className={`text-xs font-bold w-4 text-center ${layoutStyle === 'modern_dark' ? 'text-white' : 'text-slate-800'}`}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className={`rounded p-0.5 text-slate-450 ${layoutStyle === 'modern_dark' ? 'hover:bg-slate-900' : 'hover:bg-slate-100'}`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div
              className={`p-4 border-t space-y-3 ${
                layoutStyle === 'modern_dark' ? 'border-[#1e293b]/60 bg-slate-950/50' : 'border-slate-100 bg-slate-50'
              }`}
            >
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>Subtotal</span>
                <span className={layoutStyle === 'modern_dark' ? 'text-white' : 'text-slate-800'}>${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>Tax ({parseFloat(store.tax_rate).toFixed(2)}%)</span>
                <span className={layoutStyle === 'modern_dark' ? 'text-white' : 'text-slate-800'}>${totals.tax.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between border-t pt-2 text-sm font-black ${layoutStyle === 'modern_dark' ? 'border-[#1e293b]/60 text-white' : 'border-slate-200 text-slate-805'}`}>
                <span>Grand Total</span>
                <span>${totals.total.toFixed(2)}</span>
              </div>

              <button
                onClick={() => setActiveModal('checkout')}
                disabled={cart.length === 0}
                className="w-full mt-4 rounded-xl py-3 text-xs font-bold text-white transition disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg"
                style={{
                  backgroundColor: primaryColor,
                  boxShadow: `0 4px 14px 0 ${primaryColor}22`
                }}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* MOBILE FLOATING CART BAR */}
      {cart.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30 border-t p-4 flex items-center justify-between lg:hidden backdrop-blur-md bg-opacity-95"
          style={{
            backgroundColor: primaryColor,
            borderColor: `${primaryColor}dd`
          }}
        >
          <div>
            <p className="text-[10px] text-white/70 font-bold uppercase">Active Cart</p>
            <p className="text-base font-black text-white mt-0.5">${totals.total.toFixed(2)}</p>
          </div>
          <button
            onClick={() => setActiveModal('checkout')}
            className="rounded-xl px-6 py-3 text-xs font-bold text-white transition shadow-md"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 4px 12px 0 ${accentColor}33`
            }}
          >
            Checkout ({cart.reduce((s, c) => s + c.quantity, 0)})
          </button>
        </div>
      )}

      {/* CUSTOMIZATION DIALOG */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xl">
            <div className="relative h-48 bg-slate-100 flex items-center justify-center border-b border-slate-200">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-10 rounded-full bg-white/80 p-2 text-slate-500 hover:text-slate-800 border border-slate-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
              {selectedItem.image_url ? (
                <img src={selectedItem.image_url} alt="detail" className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-400 font-extrabold text-lg flex flex-col items-center gap-2">
                  <span className={`h-16 w-16 rounded-xl text-white font-extrabold flex items-center justify-center shadow-md ${getItemInitialsAndColor(selectedItem.name).color}`}>
                    {getItemInitialsAndColor(selectedItem.name).initials}
                  </span>
                  <span>{selectedItem.name}</span>
                </div>
              )}
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[50vh]">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800">{selectedItem.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{selectedItem.description}</p>
              </div>

              {selectedItem.variants && selectedItem.variants.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Variant</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedItem.variants.map((v: any) => {
                      const isSelected = selectedVariant?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                            isSelected
                              ? 'border-[#C39A3C] bg-[#C39A3C]/10 text-[#2A0E07]'
                              : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <p>{v.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            +${parseFloat(v.additional_price).toFixed(2)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedItem.addons && selectedItem.addons.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Add-ons (Optional)</h4>
                  <div className="space-y-2">
                    {selectedItem.addons.map((addon: any) => {
                      const isSelected = selectedAddons.some((a) => a.id === addon.id);
                      return (
                        <div
                          key={addon.id}
                          onClick={() => handleToggleAddon(addon)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                            isSelected
                              ? 'border-[#C39A3C] bg-[#C39A3C]/5 text-[#2A0E07]'
                              : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <span>{addon.name}</span>
                          <span className="font-bold text-slate-600">+${parseFloat(addon.price).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Final Price</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">
                  ${(
                    parseFloat(selectedItem.price) +
                    parseFloat(selectedVariant?.additional_price || 0) +
                    selectedAddons.reduce((sum, a) => sum + parseFloat(a.price || 0), 0)
                  ).toFixed(2)}
                </p>
              </div>
              
              <button
                onClick={handleAddToCart}
                className="rounded-xl bg-[#2A0E07] px-6 py-3 text-xs font-bold text-white hover:bg-[#3E1A10] transition shadow-lg shadow-[#2A0E07]/20"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT DIALOG */}
      {activeModal === 'checkout' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl my-4 flex flex-col" style={{ maxHeight: 'calc(100dvh - 2rem)' }}>

            {/* ── Header ── */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" style={{ color: accentColor }} />
                Checkout
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-700 transition rounded-full hover:bg-slate-100 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

              {/* Order summary strip */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-semibold">
                  {cart.reduce((s, c) => s + c.quantity, 0)} item{cart.reduce((s, c) => s + c.quantity, 0) !== 1 ? 's' : ''}
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="text-slate-400">Tax {parseFloat(store.tax_rate).toFixed(1)}%</span>
                </div>
                <span className="text-sm font-black text-slate-800">${totals.total.toFixed(2)}</span>
              </div>

              {/* Customer status */}
              {customer ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="text-slate-700 font-semibold">{customer.name}</span>
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">Loyalty ✓</span>
                  </div>
                  <button type="button" onClick={handleLogout} className="text-[10px] text-red-500 hover:text-red-400 font-bold shrink-0">
                    Guest Order
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex items-center justify-between gap-2">
                  <span className="text-slate-500">Guest checkout</span>
                  <div className="flex gap-3">
                    <Link href={`/order-online/${orgSlug}/customer/login`} className="font-bold underline" style={{ color: accentColor }}>Log In</Link>
                    <Link href={`/order-online/${orgSlug}/customer/register`} className="font-bold underline" style={{ color: accentColor }}>Sign Up</Link>
                  </div>
                </div>
              )}

              {/* Name + Phone row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name *</label>
                  <input
                    type="text" required placeholder="John Doe"
                    value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone *</label>
                  <input
                    type="tel" required placeholder="+1 555-0100"
                    value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Email */}
              {!customer && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Email * <span className="text-amber-500 normal-case font-normal">— to receive your order confirmation</span>
                  </label>
                  <input
                    type="email" required placeholder="john@example.com"
                    value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition"
                  />
                </div>
              )}

              {/* Order Type */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Mode *</label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {(['dine_in', 'takeaway', 'delivery'] as const).map((mode) => (
                    <button
                      key={mode} type="button"
                      onClick={() => setOrderType(mode)}
                      className={`py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wide transition ${
                        orderType === mode
                          ? 'border-slate-800 bg-slate-800 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {mode === 'dine_in' ? 'Dine In' : mode === 'takeaway' ? 'Takeaway' : 'Delivery'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table select (dine in) */}
              {orderType === 'dine_in' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Table *</label>
                  <select
                    required value={selectedTableId} onChange={(e) => setSelectedTableId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition"
                  >
                    <option value="">-- Choose Table --</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id} disabled={t.status === 'occupied'}>
                        {t.table_number} ({t.seating_capacity} seats){t.status === 'occupied' ? ' • Occupied' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Delivery address */}
              {orderType === 'delivery' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivery Address *</label>
                  <textarea
                    required placeholder="Enter complete delivery address..."
                    value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 h-14 outline-none resize-none focus:border-slate-400 focus:bg-white transition"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kitchen Notes</label>
                <textarea
                  placeholder="Allergies, special requests..."
                  value={checkoutNotes} onChange={(e) => setCheckoutNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 h-12 outline-none resize-none focus:border-slate-400 focus:bg-white transition"
                />
              </div>

              {/* Payment Method */}
              {stripeEnabled && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {(['cash', 'card'] as const).map((method) => (
                      <button
                        key={method} type="button"
                        onClick={() => { setPaymentMethod(method); setCardError(null); }}
                        className={`py-2.5 rounded-lg border text-[11px] font-bold uppercase tracking-wide transition flex items-center justify-center gap-1.5 ${
                          paymentMethod === method
                            ? 'border-slate-800 bg-slate-800 text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {method === 'card' ? '💳 Card' : '💵 Cash'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stripe Card Element */}
              {stripeEnabled && paymentMethod === 'card' && stripePromise && (
                <Elements stripe={stripePromise}>
                  <StripeCardCheckout
                    storeId={stripeStoreId!}
                    amount={totals.total}
                    orderPayload={{
                      storeId: store.id,
                      customerName,
                      customerPhone,
                      customerEmail,
                      items: cart,
                      orderType: orderType === 'dine_in' ? 'qr_order' : orderType,
                      tableId: orderType === 'dine_in' ? selectedTableId : undefined,
                      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
                      notes: checkoutNotes,
                    }}
                    onSuccess={(order: any, accountInfo?: any) => {
                      setRecentOrder(order);
                      setNewAccount(accountInfo || null);
                      setCart([]);
                      setDeliveryAddress('');
                      setActiveModal('success');
                    }}
                    onError={(msg: string) => setCardError(msg)}
                    cardError={cardError}
                    submitting={submitting}
                    setSubmitting={setSubmitting}
                  />
                </Elements>
              )}
            </div>

            {/* ── Footer (sticky) ── */}
            <div className="shrink-0 px-5 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-800">
                <span>Total (incl. tax)</span>
                <span className="text-base">${totals.total.toFixed(2)}</span>
              </div>
              {(!stripeEnabled || paymentMethod === 'cash') && (
                <button
                  type="button"
                  onClick={handleCheckout as any}
                  disabled={submitting || cart.length === 0}
                  className="w-full rounded-xl py-3 text-xs font-bold text-white transition shadow-lg disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  {submitting ? 'Placing Order...' : 'Place Order & Pay at Counter'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL */}
      {activeModal === 'success' && recentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="bg-emerald-50 px-6 pt-8 pb-6 text-center border-b border-emerald-100">
              <CheckCircle className="h-14 w-14 text-emerald-500 mx-auto mb-3 animate-bounce" />
              <h3 className="text-base font-extrabold text-slate-800">Order Placed!</h3>
              <p className="text-xs text-slate-500 mt-1">Sent to kitchen · {recentOrder.orderNumber}</p>
            </div>

            <div className="p-5 space-y-3">
              {/* Order summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs font-semibold">
                <div className="flex justify-between text-slate-500">
                  <span>Total Paid</span>
                  <span className="text-slate-800 font-extrabold">${parseFloat(recentOrder.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Status</span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700 uppercase font-black">{recentOrder.status}</span>
                </div>
              </div>

              {/* New account credentials — shown only for first-time guest orders */}
              {newAccount && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600 text-lg">🎉</span>
                    <div>
                      <p className="text-xs font-extrabold text-amber-800">Account Auto-Created!</p>
                      <p className="text-[10px] text-amber-600 mt-0.5">Save these credentials to log in next time</p>
                    </div>
                  </div>
                  <div className="bg-white border border-amber-200 rounded-lg p-3 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">Phone (Login ID)</span>
                      <span className="font-bold text-slate-800 font-mono">{newAccount.phone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">Temp Password</span>
                      <span className="font-black text-amber-700 font-mono tracking-widest bg-amber-100 px-2 py-0.5 rounded">{newAccount.tempPassword}</span>
                    </div>
                  </div>
                  <Link
                    href={`/order-online/${orgSlug}/customer/login`}
                    className="block text-center text-[11px] font-bold text-amber-700 hover:text-amber-900 underline"
                  >
                    Log in now to earn loyalty points →
                  </Link>
                </div>
              )}

              <button
                onClick={() => { setActiveModal(null); setNewAccount(null); }}
                className="w-full rounded-xl bg-slate-800 py-3 text-xs font-bold text-white hover:bg-slate-700 transition"
              >
                Continue Browsing Menu
              </button>
            </div>
          </div>
        </div>
      )}

    <footer 
        className="py-6 border-t text-center text-[10px] text-slate-400 flex flex-col justify-center gap-3"
        style={{ borderColor: `${primaryColor}1a` }}
      >
        <div className=' '> 
         <p>© {new Date().getFullYear()} {store?.Organization?.name || store?.name || 'Restaurant'}. Powered by Ordering System.</p>
        
        <div className="flex justify-center gap-3 mt-2 text-[9px] font-semibold text-slate-405">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:underline">Terms & Conditions</a>
        </div></div>
      </footer>
    </div>
  );
}
