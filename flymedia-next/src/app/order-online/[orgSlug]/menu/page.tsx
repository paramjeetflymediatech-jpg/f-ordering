'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
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
  Info,
  Sparkles,
  Loader2,
  ChevronDown,
} from 'lucide-react';

interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  variant: any | null;
  addons: any[];
  bases?: any[];
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
  currency,
  orderPayload,
  onSuccess,
  onError,
  cardError,
  submitting,
  setSubmitting,
  customer,
}: {
  storeId: string;
  amount: number;
  currency: string;
  orderPayload: any;
  onSuccess: (order: any) => void;
  onError: (msg: string) => void;
  cardError: string | null;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  customer: any;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [useSaved, setUseSaved] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);

  // Fetch saved cards on mount
  useEffect(() => {
    if (customer && storeId) {
      setLoadingCards(true);
      fetch(`/api/public/customer/saved-cards?storeId=${storeId}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.cards && data.cards.length > 0) {
            setSavedCards(data.cards);
            setSelectedCardId(data.cards[0].id);
            setUseSaved(true);
          }
        })
        .catch((err) => console.error('Error fetching saved cards:', err))
        .finally(() => setLoadingCards(false));
    } else {
      setSavedCards([]);
      setUseSaved(false);
    }
  }, [customer, storeId]);

  const handleCardPay = async () => {
    if (orderPayload.orderType === 'delivery') {
      if (!orderPayload.deliveryAddress || !orderPayload.deliveryAddress.trim()) {
        onError('Please enter a valid delivery address.');
        return;
      }

      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(orderPayload.deliveryAddress)}&limit=1`,
          { headers: { 'User-Agent': 'FlymediaNextApp/1.0' } }
        );
        const geoData = await geoRes.json();
        let lat = undefined;
        let lng = undefined;
        let zipcode = undefined;

        if (geoData && geoData[0]) {
          lat = parseFloat(geoData[0].lat);
          lng = parseFloat(geoData[0].lon);
          const zipMatch = geoData[0].display_name.match(/\b\d{4,5}\b/);
          if (zipMatch) zipcode = zipMatch[0];
        }

        const valRes = await fetch('/api/public/store/validate-delivery-zone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: storeId,
            address: orderPayload.deliveryAddress,
            lat,
            lng,
            zipcode,
          }),
        });
        const valData = await valRes.json();
        if (!valData.success || !valData.allowed) {
          onError(valData.message || 'Delivery is not available to this address.');
          return;
        }
      } catch (err) {
        onError('Failed to validate delivery address.');
        return;
      }
    }
    if (!stripe) return;
    if (!useSaved && !elements) return;

    setSubmitting(true);
    onError('');
    try {
      let clientSecret = '';
      let paymentIntentStatus = '';
      let stripePaymentIntentId = '';

      if (useSaved && selectedCardId) {
        // Direct charge using saved card
        const res = await fetch('/api/public/stripe/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId,
            amount,
            currency: currency || 'aud',
            customerId: customer?.id,
            paymentMethodId: selectedCardId,
          }),
        });
        const data = await res.json();
        if (data.error) {
          onError(data.error);
          setSubmitting(false);
          return;
        }
        clientSecret = data.clientSecret;
        paymentIntentStatus = data.status;
      } else {
        // Normal card elements flow
        const cardElement = elements!.getElement(CardElement);
        if (!cardElement) { setSubmitting(false); return; }

        const res = await fetch('/api/public/stripe/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId,
            amount,
            currency: currency || 'aud',
            customerId: customer?.id,
            saveCard: saveCard,
          }),
        });
        const data = await res.json();
        if (!data.clientSecret) {
          onError(data.error || 'Could not initiate payment.');
          setSubmitting(false);
          return;
        }

        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          data.clientSecret,
          { payment_method: { card: cardElement } }
        );

        if (stripeError) {
          onError(stripeError.message || 'Card payment failed.');
          setSubmitting(false);
          return;
        }

        if (paymentIntent) {
          clientSecret = data.clientSecret;
          paymentIntentStatus = paymentIntent.status;
          stripePaymentIntentId = paymentIntent.id;
        }
      }

      // Check if SCA action/redirection is required
      if (paymentIntentStatus === 'requires_action' || paymentIntentStatus === 'requires_source_action') {
        const { error: sError, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(clientSecret);
        if (sError) {
          onError(sError.message || 'Verification failed.');
          setSubmitting(false);
          return;
        }
        if (confirmedIntent) {
          paymentIntentStatus = confirmedIntent.status;
          stripePaymentIntentId = confirmedIntent.id;
        }
      }

      if (paymentIntentStatus === 'succeeded') {
        // Resolve paymentIntent ID from clientSecret if not populated
        if (!stripePaymentIntentId && clientSecret) {
          stripePaymentIntentId = clientSecret.split('_secret_')[0];
        }

        // Submit order with stripe reference
        const orderRes = await fetch('/api/public/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...orderPayload,
            paymentMethod: 'card',
            stripePaymentIntentId: stripePaymentIntentId,
          }),
        });
        const orderData = await orderRes.json();
        if (orderData.success) {
          onSuccess(orderData.order);
        } else {
          onError(orderData.error || 'Order could not be saved after payment.');
        }
      } else {
        onError(`Payment status: ${paymentIntentStatus}. Please try again.`);
      }
    } catch (err: any) {
      console.error(err);
      onError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {savedCards.length > 0 && (
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setUseSaved(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${useSaved ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Saved Card
          </button>
          <button
            type="button"
            onClick={() => setUseSaved(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!useSaved ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            New Card
          </button>
        </div>
      )}

      {useSaved && savedCards.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Select Saved Card</p>
          <div className="space-y-2">
            {savedCards.map((card) => (
              <label
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${selectedCardId === card.id
                    ? 'border-[#635BFF] bg-[#635bff0a] shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="saved_card"
                    checked={selectedCardId === card.id}
                    onChange={() => setSelectedCardId(card.id)}
                    className="accent-[#635BFF] h-4 w-4"
                  />
                  <div className="text-slate-800">
                    <p className="text-xs font-bold capitalize flex items-center gap-1.5">
                      💳 {card.brand} ending in {card.last4}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Expires {card.expMonth}/{card.expYear}
                    </p>
                  </div>
                </div>
                {selectedCardId === card.id && (
                  <span className="text-[10px] bg-[#635BFF] text-white px-2 py-0.5 rounded-full font-bold">
                    Active
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>
      ) : (
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

          {customer && (
            <label className="flex items-center gap-2 cursor-pointer py-1 select-none">
              <input
                type="checkbox"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                className="rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF] h-4 w-4 accent-[#635BFF]"
              />
              <span className="text-xs font-semibold text-slate-600">Save card for future payments</span>
            </label>
          )}
        </div>
      )}

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
  const [offers, setOffers] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart & UI states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [selectedBases, setSelectedBases] = useState<any[]>([]);
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

  const [geocodingCheckout, setGeocodingCheckout] = useState(false);
  const [deliveryValidating, setDeliveryValidating] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [deliverySuccessMsg, setDeliverySuccessMsg] = useState<string | null>(null);

  const validateAddress = async (addr: string) => {
    if (!addr || !addr.trim()) {
      setDeliveryError('Delivery address is required.');
      setDeliverySuccessMsg(null);
      return;
    }
    setDeliveryValidating(true);
    setDeliveryError(null);
    setDeliverySuccessMsg(null);
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`,
        { headers: { 'User-Agent': 'FlymediaNextApp/1.0' } }
      );
      const geoData = await geoRes.json();
      let lat = undefined;
      let lng = undefined;
      let zipcode = undefined;

      if (geoData && geoData[0]) {
        lat = parseFloat(geoData[0].lat);
        lng = parseFloat(geoData[0].lon);
        const zipMatch = geoData[0].display_name.match(/\b\d{4,5}\b/);
        if (zipMatch) zipcode = zipMatch[0];
      }

      const valRes = await fetch('/api/public/store/validate-delivery-zone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store?.id,
          address: addr,
          lat,
          lng,
          zipcode,
        }),
      });
      const valData = await valRes.json();
      if (valData.success) {
        if (valData.allowed) {
          setDeliverySuccessMsg(valData.message || 'Delivery is available for this address.');
          setDeliveryError(null);
        } else {
          setDeliveryError(valData.message || 'Delivery is not available to this address.');
          setDeliverySuccessMsg(null);
        }
      } else {
        setDeliveryError(valData.error || 'Failed to validate delivery address.');
      }
    } catch (err) {
      console.error(err);
      setDeliveryError('Failed to validate address. Please verify your connection.');
    } finally {
      setDeliveryValidating(false);
    }
  };

  const fetchCurrentLocationCheckout = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setGeocodingCheckout(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          if (data && data.display_name) {
            setDeliveryAddress(data.display_name);
            validateAddress(data.display_name);
          } else {
            alert(`Location found (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) but reverse geocoding failed.`);
          }
        } catch (err) {
          console.error(err);
          setDeliveryAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } finally {
          setGeocodingCheckout(false);
        }
      },
      (error) => {
        console.error(error);
        alert("Failed to retrieve location: " + error.message);
        setGeocodingCheckout(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async (overrideCode?: string) => {
    const codeToApply = overrideCode !== undefined ? overrideCode : couponCode;
    if (!codeToApply.trim() || !store?.id) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const res = await fetch('/api/public/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          code: codeToApply,
          subtotal,
          customerPhone: customerPhone || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon(data.coupon);
        setCouponError(null);
        showToast(`Coupon "${data.coupon.code}" applied successfully!`, 'success');
      } else {
        setCouponError(data.error || 'Failed to apply coupon.');
        setAppliedCoupon(null);
        showToast(data.error || 'Failed to apply coupon.', 'error');
      }
    } catch (err) {
      console.error(err);
      setCouponError('Network error. Please try again.');
      showToast('Network error while applying coupon.', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
    showToast('Coupon removed.', 'info');
  };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep latest refs of submitting and activeModal states to avoid socket event handler stale closures
  const submittingRef = useRef(submitting);
  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  const activeModalRef = useRef(activeModal);
  useEffect(() => {
    activeModalRef.current = activeModal;
  }, [activeModal]);

  const processedRedirectRef = useRef(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [cashEnabled, setCashEnabled] = useState(true);
  const [cardError, setCardError] = useState<string | null>(null);
  const [stripeStoreId, setStripeStoreId] = useState<string | null>(null);

  // UPI configuration states
  const [upiEnabled, setUpiEnabled] = useState(false);
  const [upiVpa, setUpiVpa] = useState<string | null>(null);
  const [upiQrImage, setUpiQrImage] = useState<string | null>(null);

  // UPI payment processing state
  const [showUpiPayModal, setShowUpiPayModal] = useState(false);
  const [upiUtrRef, setUpiUtrRef] = useState('');
  const [verifyingUpi, setVerifyingUpi] = useState(false);

  // Profile Dropdown state
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Expanded parent category in sidebar
  const [expandedParentId, setExpandedParentId] = useState<string | null>(null);

  // Organize parent-child categories hierarchy
  const orderedCategories = useMemo(() => {
    const parentCats = categories.filter(c => !c.parent_id);
    const result: any[] = [];
    parentCats.forEach(parent => {
      result.push(parent);
      const subs = categories.filter(c => c.parent_id === parent.id);
      result.push(...subs);
    });
    // Add any category that has a parent_id that is not found (fallback)
    const orphans = categories.filter(c => c.parent_id && !categories.some(p => p.id === c.parent_id));
    result.push(...orphans);
    return result;
  }, [categories]);

  // Handle Stripe Checkout Redirect Callbacks
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const checkoutSuccess = searchParams.get('checkout_success');
    const sessionId = searchParams.get('session_id');
    const payloadStr = searchParams.get('payload');

    if (checkoutSuccess === 'true' && sessionId && payloadStr) {
      if (processedRedirectRef.current) return;
      processedRedirectRef.current = true;

      // Clear URL params so page reloads don't duplicate order
      window.history.replaceState(null, '', window.location.pathname);

      try {
        const payload = JSON.parse(decodeURIComponent(payloadStr));
        setSubmitting(true);

        // Submit order with session ID as transaction reference and mark transaction status as success
        fetch('/api/public/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            paymentMethod: 'upi',
            stripePaymentIntentId: sessionId,
            transactionReference: sessionId,
          }),
        })
          .then((res) => res.json())
          .then((orderData) => {
            if (orderData.success && orderData.order) {
              triggerOrderCreatedNotification(orderData.order, orderData.order.OrderItems || [], orderData.order.orderType);
              setRecentOrder(orderData.order);
              setCart([]);
              setDeliveryAddress('');
              setSelectedTableId('');
              setActiveModal('success');
            } else {
              showToast(orderData.error || 'Failed to register checkout order.', 'error');
            }
          })
          .catch((err) => {
            console.error('Order placement error:', err);
            showToast('Network error placing order.', 'error');
          })
          .finally(() => setSubmitting(false));
      } catch (err) {
        console.error('Failed to parse order payload:', err);
      }
    } else if (searchParams.get('checkout_cancelled') === 'true') {
      window.history.replaceState(null, '', window.location.pathname);
      showToast('Checkout was cancelled.', 'info');
    }
  }, [store, orgSlug]);

  // Fetch Store Info and Menu by Organization Slug
  const fetchStoreAndMenu = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      // 1. Fetch Store Config by Org Slug
      const storeRes = await fetch(`/api/public/store?orgSlug=${orgSlug}`, { cache: 'no-store' });
      const storeData = await storeRes.json();
      if (!storeRes.ok || !storeData.success) {
        throw new Error(storeData.error || 'Failed to load store information.');
      }
      setStore(storeData.store);
      const tablesList = storeData.tables || [];
      setTables(tablesList);

      // Auto-detect and select the table from query parameters (?table=token)
      const searchParams = new URLSearchParams(window.location.search);
      const tableToken = searchParams.get('table');
      if (tableToken && tablesList.length > 0) {
        const matchedTable = tablesList.find((t: any) => t.qr_code_token === tableToken);
        if (matchedTable) {
          setOrderType('dine_in');
          setSelectedTableId(matchedTable.id);
          if (!(window as any).__qrToastShown) {
            (window as any).__qrToastShown = true;
            showToast(`Dining at ${matchedTable.table_number}. Your order will be served here!`, 'success');
          }
        }
      }

      setStripeStoreId(storeData.store?.id || null);

      // Check if Stripe/UPI is configured for this store (lightweight — no PaymentIntent created)
      if (storeData.store?.id) {
        try {
          const cfgRes = await fetch(`/api/public/stripe/config?storeId=${storeData.store.id}`, { cache: 'no-store' });
          const cfgData = await cfgRes.json();
          
          let isStripe = false;
          if (cfgData.stripeEnabled && cfgData.publishableKey) {
            setStripeEnabled(true);
            setStripePromise(loadStripe(cfgData.publishableKey));
            isStripe = true;
          }
          
          let isUpi = false;
          if (cfgData.upiEnabled && (cfgData.upiVpa || cfgData.upiQrImage)) {
            setUpiEnabled(true);
            setUpiVpa(cfgData.upiVpa || null);
            setUpiQrImage(cfgData.upiQrImage || null);
            isUpi = true;
          }

          let isCash = true;
          if (cfgData.cashEnabled !== undefined) {
            setCashEnabled(cfgData.cashEnabled);
            isCash = cfgData.cashEnabled;
          }

          // Select the default payment method dynamically based on availability
          if (!isCash) {
            if (isStripe) setPaymentMethod('card');
            else if (isUpi) setPaymentMethod('upi');
          }
        } catch {
          // Config error — cash only
        }
      }

      // 2. Fetch Menu by Org Slug
      const menuRes = await fetch(`/api/public/menu?orgSlug=${orgSlug}`, { cache: 'no-store' });
      const menuData = await menuRes.json();
      if (!menuRes.ok || !menuData.success) {
        throw new Error(menuData.error || 'Failed to load menu listing.');
      }
      setCategories(menuData.categories || []);

      // 3. Fetch active coupons / offers for banner carousel
      if (storeData.store?.id) {
        try {
          const promoRes = await fetch(`/api/public/coupons?storeId=${storeData.store.id}`, { cache: 'no-store' });
          const promoData = await promoRes.json();
          if (promoRes.ok && promoData.success) {
            setOffers(promoData.coupons || []);
          }
        } catch (e) {
          console.error('Failed to load active promotions:', e);
        }
      }

      // 4. Fetch logged in customer info if exists (for prefilling)
      try {
        const custRes = await fetch('/api/public/customer/me', { cache: 'no-store' });
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
      if (showLoading) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (!orgSlug) return;
    fetchStoreAndMenu();
  }, [orgSlug]);

  // Refetch when profile is updated elsewhere
  useEffect(() => {
    const handler = () => {
      fetchStoreAndMenu();
    };
    window.addEventListener('profileUpdated', handler);
    return () => {
      window.removeEventListener('profileUpdated', handler);
    };
  }, [orgSlug]);

  // Sync selected category with accordion expanded state
  useEffect(() => {
    if (selectedCategoryId && selectedCategoryId !== 'all') {
      const selectedCat = categories.find(c => c.id === selectedCategoryId);
      if (selectedCat) {
        if (selectedCat.parent_id) {
          setExpandedParentId(selectedCat.parent_id);
        } else {
          setExpandedParentId(selectedCat.id);
        }
      }
    }
  }, [selectedCategoryId, categories]);

  // Real-time table status updates
  useEffect(() => {
    if (!store?.id) return;

    const socket = io({
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Public Menu Socket] Connected, joining store room:', store.id);
      socket.emit('join_store', store.id);
    });

    socket.on('table_status_update', async () => {
      console.log('[Public Menu Socket] Table status updated, refetching tables...');
      try {
        const storeRes = await fetch(`/api/public/store?orgSlug=${orgSlug}`, { cache: 'no-store' });
        const storeData = await storeRes.json();
        if (storeRes.ok && storeData.success) {
          const updatedTables = storeData.tables || [];
          setTables(updatedTables);

          // Check if selected table is no longer available
          setSelectedTableId((currentId) => {
            if (!currentId) return currentId;
            const chosen = updatedTables.find((t: any) => String(t.id) === String(currentId));
            if (chosen && chosen.status !== 'available') {
              // Ignore if we are currently submitting an order or if order is already successful
              if (submittingRef.current || activeModalRef.current === 'success') {
                return currentId;
              }
              showToast(`Table ${chosen.table_number} is no longer available. Please select another table.`, 'error');
              return '';
            }
            return currentId;
          });
        }
      } catch (err) {
        console.error('[Public Menu Socket] Failed to refetch tables:', err);
      }
    });

    socket.on('menu_update', async () => {
      console.log('[Public Menu Socket] Menu updated, refetching menu...');
      try {
        const menuRes = await fetch(`/api/public/menu?orgSlug=${orgSlug}`, { cache: 'no-store' });
        const menuData = await menuRes.json();
        if (menuRes.ok && menuData.success) {
          setCategories(menuData.categories || []);
        }
      } catch (err) {
        console.error('[Public Menu Socket] Failed to refetch menu:', err);
      }
    });

    socket.on('store_update', async () => {
      console.log('[Public Menu Socket] Store updated, refetching store/menu in background...');
      fetchStoreAndMenu(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [store?.id, orgSlug]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/public/customer/logout', { method: 'POST' });
      if (res.ok) {
        setCustomer(null);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        showToast('Logged out successfully.', 'info');
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

    let discount = 0;
    if (appliedCoupon) {
      const minAmount = parseFloat(appliedCoupon.min_order_amount) || 0;
      if (subtotal >= minAmount) {
        if (appliedCoupon.type === 'buy_x_get_y') {
          // BOGO offer logic
          const totalBuyQty = cart
            .filter((item) => item.menuItemId === appliedCoupon.buy_item_id)
            .reduce((sum, item) => sum + item.quantity, 0);

          if (totalBuyQty >= (appliedCoupon.buy_qty || 0)) {
            const getCartItems = cart.filter((item) => item.menuItemId === appliedCoupon.get_item_id);
            let remainingFreeQty = appliedCoupon.get_qty || 0;
            let bogoDiscount = 0;

            // Sort items ascending by price to discount cheaper ones first
            const sortedGetItems = [...getCartItems].sort((a, b) => a.price - b.price);
            for (const item of sortedGetItems) {
              if (remainingFreeQty <= 0) break;
              const countToDiscount = Math.min(item.quantity, remainingFreeQty);
              bogoDiscount += item.price * countToDiscount;
              remainingFreeQty -= countToDiscount;
            }
            discount = bogoDiscount;
          }
        } else {
          // Standard coupon logic
          if (appliedCoupon.discount_type === 'percentage') {
            discount = (subtotal * parseFloat(appliedCoupon.discount_value)) / 100;
          } else {
            discount = parseFloat(appliedCoupon.discount_value);
          }
        }

        if (discount > subtotal) {
          discount = subtotal;
        }
      }
    }

    const discountedSubtotal = subtotal - discount;
    const tax = (discountedSubtotal * taxRate) / 100;

    return {
      subtotal,
      discount,
      tax,
      total: discountedSubtotal + tax,
    };
  };

  const handleOpenItem = (item: any) => {
    setSelectedItem(item);
    setSelectedBases([]); // Optional: start with no selection
    setSelectedVariant(item.variants?.[0] || null);
    setSelectedAddons([]);
  };

  const handleToggleBase = (base: any) => {
    setSelectedBases((prev) =>
      prev.some((b) => b.id === base.id)
        ? prev.filter((b) => b.id !== base.id)
        : [...prev, base]
    );
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

    const basePrice = selectedBases.reduce((sum, base) => sum + parseFloat(base.extraPrice || 0), 0);
    finalUnitPrice += basePrice;

    const cartItemId = `${selectedItem.id}-${selectedBases
      .map((b) => b.id)
      .sort()
      .join(',')}-${selectedVariant?.id || 'none'}-${selectedAddons
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
          bases: selectedBases,
          variant: selectedVariant,
          addons: selectedAddons,
        },
      ]);
    }

    setSelectedItem(null);
    showToast(`${selectedItem.name} added to cart!`, 'success');
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

  function triggerOrderCreatedNotification(order: any, items: any[], type: string) {
    try {
      const socket = io({
        transports: ['websocket', 'polling']
      });
      socket.emit('new_order', {
        storeId: store.id,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          status: order.status,
          createdAt: new Date(),
          orderType: type === 'dine_in' ? 'qr_order' : type,
          Items: items.map((item: any) => ({
            id: item.id || item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            MenuItem: { name: item.name },
            addons: item.addons || [],
            bases: item.bases || [],
            notes: item.notes || null,
          })),
        },
      });
      setTimeout(() => socket.disconnect(), 1000);
    } catch (err) {
      console.error('[Socket Notification] Failed to notify order creation:', err);
    }
  }

  const handleCashCheckout = async (cartItems: CartItem[], payload: any) => {
    const res = await fetch('/api/public/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, paymentMethod }),
    });
    const data = await res.json();
    if (data.success) {
      triggerOrderCreatedNotification(data.order, cartItems, payload.orderType);
      setRecentOrder(data.order);
      setNewAccount(data.newAccount || null);
      setCart([]);
      setDeliveryAddress('');
      setSelectedTableId('');
      setActiveModal('success');
      showToast('Order placed successfully!', 'success');
    } else {
      showToast(data.error || 'Failed to place order.', 'error');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    setCardError(null);

    if (!customerName || !customerName.trim()) {
      showToast('Please enter your name.', 'error');
      setSubmitting(false);
      return;
    }
    if (!customer && (!customerEmail || !customerEmail.trim() || !customerEmail.includes('@'))) {
      showToast('Please enter a valid email address.', 'error');
      setSubmitting(false);
      return;
    }

    if (orderType === 'delivery') {
      if (!deliveryAddress || !deliveryAddress.trim()) {
        showToast('Please enter a valid delivery address.', 'error');
        setSubmitting(false);
        return;
      }

      if (deliveryError) {
        showToast(deliveryError, 'error');
        setSubmitting(false);
        return;
      }

      if (!deliverySuccessMsg) {
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(deliveryAddress)}&limit=1`,
            { headers: { 'User-Agent': 'FlymediaNextApp/1.0' } }
          );
          const geoData = await geoRes.json();
          let lat = undefined;
          let lng = undefined;
          let zipcode = undefined;

          if (geoData && geoData[0]) {
            lat = parseFloat(geoData[0].lat);
            lng = parseFloat(geoData[0].lon);
            const zipMatch = geoData[0].display_name.match(/\b\d{4,5}\b/);
            if (zipMatch) zipcode = zipMatch[0];
          }

          const valRes = await fetch('/api/public/store/validate-delivery-zone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              storeId: store?.id,
              address: deliveryAddress,
              lat,
              lng,
              zipcode,
            }),
          });
          const valData = await valRes.json();
          if (!valData.success || !valData.allowed) {
            showToast(valData.message || 'Delivery is not available to this address.', 'error');
            setDeliveryError(valData.message || 'Delivery is not available to this address.');
            setSubmitting(false);
            return;
          }
        } catch (err) {
          showToast('Failed to validate delivery address.', 'error');
          setSubmitting(false);
          return;
        }
      }
    }

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
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      };

      if (paymentMethod === 'upi') {
        const response = await fetch('/api/public/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: store.id,
            amount: totals.total,
            orgSlug,
            orderPayload: {
              storeId: store.id,
              customerName,
              customerPhone,
              customerEmail,
              items: cart,
              orderType: orderType === 'dine_in' ? 'qr_order' : orderType,
              tableId: orderType === 'dine_in' ? selectedTableId : undefined,
              deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
              notes: checkoutNotes,
              couponCode: appliedCoupon ? appliedCoupon.code : undefined,
            }
          }),
        });
        const data = await response.json();
        if (data.success && data.url) {
          window.location.href = data.url;
        } else {
          showToast(data.error || 'Failed to initiate Stripe Checkout.', 'error');
          setSubmitting(false);
        }
        return;
      }

      if (paymentMethod === 'cash' || !stripeEnabled) {
        await handleCashCheckout(cart, payload);
      }
      // Card flow is handled inside StripeCardCheckout component
    } catch (err) {
      console.error(err);
      showToast('Network error while processing order.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpiCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || verifyingUpi) return;

    setVerifyingUpi(true);
    // Simulate UPI banking server verification check
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setSubmitting(true);
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
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        transactionReference: upiUtrRef.trim() || undefined,
      };

      await handleCashCheckout(cart, payload);
      setShowUpiPayModal(false);
      setUpiUtrRef('');
    } catch (err) {
      console.error(err);
      showToast('Failed to place UPI order.', 'error');
    } finally {
      setSubmitting(false);
      setVerifyingUpi(false);
    }
  };

  const totals = getCartTotal();

  const categoriesWithFilteredItems = categories.map((cat) => {
    const isCategorySelected = 
      selectedCategoryId === 'all' || 
      cat.id === selectedCategoryId || 
      cat.parent_id === selectedCategoryId;

    const matched = isCategorySelected
      ? (cat.MenuItems || []).filter((item: any) => {
          const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesSearch;
        })
      : [];

    return { ...cat, filteredItems: matched };
  }).filter(cat => cat.filteredItems.length > 0);

  const primaryColor = store?.theme_primary_color || '#2A0E07';
  const accentColor = store?.theme_accent_color || '#C39A3C';
  const bgColor = store?.bg_color_menu || store?.theme_bg_color || '#F9F6F0';
  const bgImage = store?.bg_menu || null;
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

  // Helper to format opening hours label based on store business_hours and order type
  const getBusinessHoursLabel = (type: 'takeaway' | 'delivery' | 'dine_in') => {
    if (!store?.business_hours) return '';
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date();
    const dayKey = dayNames[today.getDay()];
    // Business hours may be stored with capitalized day keys or as numbers; try several lookups
    const typeHoursObj = store.business_hours?.[type] || {};
    const possibleKeys = [dayKey, dayKey.charAt(0).toUpperCase() + dayKey.slice(1)];
    let typeHours = undefined as any;
    for (const k of possibleKeys) {
      if (typeHoursObj[k]) { typeHours = typeHoursObj[k]; break; }
    }
    if (!typeHours) return '';
    const formatTime = (t: string) => {
      const [h, m] = t.split(':');
      let hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 === 0 ? 12 : hour % 12;
      return `${hour}:${m} ${ampm}`;
    };
    const open = formatTime(typeHours.open);
    const close = formatTime(typeHours.close);
    return `Open ${open} - ${close}`;
  };

  return (
    <div
      className={`min-h-screen pb-24 lg:pb-0 ${layoutStyle === 'modern_dark' ? 'text-slate-100 font-sans' : 'text-slate-800 font-sans'
        }`}
      style={{
        backgroundColor: bgColor,
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: bgImage ? 'cover' : undefined,
        backgroundPosition: bgImage ? 'center' : undefined,
        backgroundAttachment: bgImage ? 'fixed' : undefined,
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
              <Link href={store.website ? (`${store.website.replace(/\/$/, '')}/about`) : "/about"} className="text-white transition">
                About Us
              </Link>
            )}

            <Link href={`/order-online/${orgSlug}/book`} className="text-white transition">
              Book Table
            </Link>
            {customer ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="text-white hover:opacity-90 transition flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold shrink-0"
                >
                  <User className="h-4 w-4" />
                  <span>Hi, {customer.name}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileDropdownOpen && (
                    <>
                      {/* Invisible click overlay to close the dropdown when clicking outside */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setProfileDropdownOpen(false)}
                      />
                      
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute right-0 mt-2 w-56 rounded-2xl border p-4 shadow-xl z-50 space-y-3.5 ${
                          layoutStyle === 'modern_dark'
                            ? 'bg-[#0f1422] border-[#1e293b]/60 text-white shadow-slate-950/40'
                            : 'bg-white border-slate-100 text-slate-800 shadow-slate-200/50'
                        }`}
                      >
                        {/* Profile Info Summary */}
                        <div className="border-b pb-3 border-slate-100/10 dark:border-slate-800/60">
                          <p className="text-xs font-black tracking-wide truncate text-left">{customer.name}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5 text-left">{customer.email || 'Loyal Diner'}</p>
                        </div>

                        {/* Loyalty Points display */}
                        {customer.loyaltyPoints !== undefined && (
                          <div
                            className="flex items-center justify-between rounded-xl px-3 py-2 border text-xs font-bold"
                            style={{
                              backgroundColor: `${accentColor}0a`,
                              color: accentColor,
                              borderColor: `${accentColor}18`,
                            }}
                          >
                            <span className="flex items-center gap-1.5">
                              <Award className="h-4 w-4" /> Loyalty Points
                            </span>
                            <span>{customer.loyaltyPoints} PTS</span>
                          </div>
                        )}

                        {/* Navigation Menu */}
                        <div className="space-y-1">
                          <Link
                            href={`/order-online/${orgSlug}/customer/profile`}
                            onClick={() => setProfileDropdownOpen(false)}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition text-left ${
                              layoutStyle === 'modern_dark'
                                ? 'text-slate-300 hover:bg-slate-900/60 hover:text-white'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <User className="h-3.5 w-3.5" />
                            My Profile
                          </Link>
                          
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              handleLogout();
                            }}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition text-red-500 text-left ${
                              layoutStyle === 'modern_dark'
                                ? 'hover:bg-red-950/20'
                                : 'hover:bg-red-50'
                            }`}
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            Log Out
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href={`/order-online/${orgSlug}/customer/login`} className="text-white transition flex items-center gap-1">
                  <LogIn className="h-4 w-4" /> Login
                </Link>
                <Link
                  href={`/order-online/${orgSlug}/customer/register`}
                  className="px-3 py-1.5 rounded-lg transition text-xs font-bold uppercase tracking-wider hover:opacity-90"
                  style={{ backgroundColor: primaryColor, color: accentColor }}
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
          <div className={`w-72 h-full p-6 shadow-2xl flex flex-col justify-between ${layoutStyle === 'modern_dark' ? 'bg-[#0c101b] text-white border-l border-[#1e293b]/60' : 'bg-white text-slate-800'
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
                  className="hover:text-white py-1 transition"
                  style={{ color: primaryColor }}
                >
                  Menu
                </Link>
                {store.website ? (
                  <a href={`${store.website.replace(/\/$/, '')}/#about`} className="hover:opacity-80 py-1 transition">
                    About Us
                  </a>
                ) : (
                  <Link href={store.website ? (`${store.website.replace(/\/$/, '')}/about`) : "/about"} onClick={() => setMobileMenuOpen(false)} className="hover:opacity-80 py-1 transition">
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
                  <Link
                    href={`/order-online/${orgSlug}/customer/profile`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full text-center block rounded-xl border py-2.5 text-xs font-bold transition ${layoutStyle === 'modern_dark'
                        ? 'border-slate-800 text-slate-200 hover:bg-slate-900'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    My Account
                  </Link>
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
                    className={`w-full text-center rounded-xl border border-slate-200 py-2.5 text-xs font-bold `}
                    style={{ backgroundColor: primaryColor, color: accentColor }}>
                    Login
                  </Link>
                  <Link
                    href={`/order-online/${orgSlug}/customer/register`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center  py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                    style={{ backgroundColor: primaryColor, color: accentColor }}
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
        className={`lg:hidden sticky top-[96px] z-30 border-b px-6 py-3 overflow-x-auto whitespace-nowrap flex gap-2 custom-scrollbar ${layoutStyle === 'modern_dark'
          ? 'bg-[#0c101b] border-[#1e293b]/60'
          : 'bg-white border-slate-200'
          }`}
      >
        <button
          onClick={() => setSelectedCategoryId('all')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 ${selectedCategoryId === 'all'
            ? 'text-white'
            : layoutStyle === 'modern_dark'
              ? 'text-slate-400 bg-slate-900/40 border border-[#1e293b]'
              : 'text-slate-600 bg-slate-50 border border-slate-100'
            }`}
          style={selectedCategoryId === 'all' ? { backgroundColor: primaryColor } : undefined}
        >
          All Items
        </button>
        {orderedCategories.map((cat: any) => {
          const isSub = !!cat.parent_id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 ${selectedCategoryId === cat.id
                ? 'text-white'
                : layoutStyle === 'modern_dark'
                  ? 'text-slate-400 bg-slate-900/40 border border-[#1e293b]'
                  : 'text-slate-600 bg-slate-50 border border-slate-100'
                }`}
              style={selectedCategoryId === cat.id ? { backgroundColor: primaryColor } : undefined}
            >
              {isSub ? `↳ ${cat.name}` : cat.name}
            </button>
          );
        })}
      </div>

      {/* BODY LAYOUT */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">

        {/* COLUMN 1: CATEGORY SIDEBAR (LEFT) */}
        <div className="w-64 shrink-0 hidden lg:block">
          <div
            className={`sticky top-24 border rounded-2xl p-4 shadow-sm space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar ${layoutStyle === 'modern_dark'
              ? 'bg-[#0c101b]/80 border-[#1e293b]/60 text-white shadow-xl shadow-slate-950/20'
              : 'bg-white border-slate-200 text-slate-800'
              }`}
          >
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Categories</h3>
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition ${selectedCategoryId === 'all'
                ? 'text-white font-extrabold'
                : layoutStyle === 'modern_dark'
                  ? 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-50'
                }`}
              style={selectedCategoryId === 'all' ? { backgroundColor: primaryColor } : undefined}
            >
              All Items
            </button>
            {categories.filter((cat) => !cat.parent_id).map((cat) => {
              const subs = categories.filter((c) => c.parent_id === cat.id);
              const isExpanded = expandedParentId === cat.id || selectedCategoryId === cat.id || categories.find((c: any) => c.id === selectedCategoryId)?.parent_id === cat.id;

              return (
                <div key={cat.id} className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setExpandedParentId(expandedParentId === cat.id ? null : cat.id);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${selectedCategoryId === cat.id
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
                    <span>{cat.name}</span>
                    {subs.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          selectedCategoryId === cat.id
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {subs.length}
                        </span>
                        <ChevronDown className={`h-3.5 w-3.5 opacity-55 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`} />
                      </div>
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && subs.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="pl-4 border-l border-slate-350 dark:border-slate-800/40 ml-3.5 space-y-1 mt-1 overflow-hidden"
                      >
                        {subs.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => setSelectedCategoryId(sub.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5 ${
                              selectedCategoryId === sub.id
                                ? 'text-white font-extrabold'
                                : layoutStyle === 'modern_dark'
                                  ? 'text-slate-500 hover:text-slate-300'
                                  : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50/50'
                            }`}
                            style={
                              selectedCategoryId === sub.id
                                ? {  backgroundColor:primaryColor}
                                : undefined
                            }
                          >
                            <span className="opacity-50">↳</span>
                            <span>{sub.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: MENU CATALOG (CENTER) */}
        <div className="flex-1 space-y-6">

          {/* Promotion Banners Carousel */}
          {offers.filter(o => o.banner_url).length > 0 && (
            <div className="w-full rounded-2xl overflow-hidden space-y-3">
              {/* <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse" style={{ color: accentColor }}>
                  <Sparkles className="h-4 w-4" /> Special Deals & Offers
                </span>
              </div> */}

              <div className="flex gap-4 overflow-x-auto  custom-scrollbar snap-x">
                {offers.filter(o => o.banner_url).map(promo => (
                  <div
                    key={promo.id}
                    className="min-w-[300px] md:min-w-[420px] flex-1 max-w-xxl rounded-2xl overflow-hidden border   backdrop-blur-md shadow-xl snap-start flex flex-col group hover:shadow-2xl transition-shadow duration-300"
                    style={{ backgroundColor: `${primaryColor}10` }}
                  >
                    <div className="relative h-36 md:h-48 overflow-hidden rounded-t-2xl">
                      <img src={promo.banner_url} alt={promo.code} className="w-full h-full object-cover   transition-transform duration-500" />
                    </div>


                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Type & Search Bar */}
          <div
            className={`border rounded-2xl p-6 shadow-sm ${layoutStyle === 'modern_dark'
              ? 'bg-[#0c101b]/80 border-[#1e293b]/60 text-white shadow-xl shadow-slate-950/20'
              : 'bg-white border-slate-200 text-slate-800'
              }`}
          >
            <h3 className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Select Order Type</h3>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setOrderType('takeaway')}
                className={`p-4 rounded-xl border text-center transition flex flex-col items-center justify-center ${orderType === 'takeaway'
                  ? 'border-transparent text-white font-extrabold shadow-md'
                  : layoutStyle === 'modern_dark'
                    ? 'border-[#1e293b] text-slate-405 hover:border-slate-700 bg-slate-950/40'
                    : 'border-slate-200 hover:border-slate-300'
                  }`}
                style={orderType === 'takeaway' ? { backgroundColor: primaryColor } : undefined}
              >
                <span className="text-sm uppercase tracking-wide">Take Away</span>
                <span className={`text-[10px] mt-1 ${orderType === 'takeaway' ? 'text-white/80' : 'text-slate-500'}`}>{getBusinessHoursLabel('takeaway')}</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`p-4 rounded-xl border text-center transition flex flex-col items-center justify-center ${orderType === 'delivery'
                  ? 'border-transparent text-white font-extrabold shadow-md'
                  : layoutStyle === 'modern_dark'
                    ? 'border-[#1e293b] text-slate-405 hover:border-slate-700 bg-slate-950/40'
                    : 'border-slate-200 hover:border-slate-300'
                  }`}
                style={orderType === 'delivery' ? { backgroundColor: primaryColor } : undefined}
              >
                <span className="text-sm uppercase tracking-wide">Delivery</span>
                <span className={`text-[10px] mt-1 ${orderType === 'delivery' ? 'text-white/80' : 'text-slate-500'}`}>{getBusinessHoursLabel('delivery')}</span>
              </button>
            </div>

            <div className="relative mt-6 max-w-md mx-auto">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-450" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition ${layoutStyle === 'modern_dark'
                  ? 'border-[#1e293b] bg-slate-950 text-white focus:border-slate-700 focus:bg-slate-950/90'
                  : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-slate-400 focus:bg-white'
                  }`}
              />
            </div>
          </div>

          {/* Menu Sections */}
          {categoriesWithFilteredItems.length === 0 ? (
            <div
              className={`text-center py-12 border rounded-2xl ${layoutStyle === 'modern_dark'
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
                className={`border rounded-2xl shadow-sm overflow-hidden mb-6 ${layoutStyle === 'modern_dark'
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
                  <h2 className="font-black tracking-widest text-white text-sm uppercase flex items-center gap-1.5" style={{ fontFamily: fontStyle === 'playfair' ? '"Playfair Display", serif' : 'inherit' }}>
                    {cat.parent_id ? (
                      <>
                        <span className="opacity-60 font-semibold normal-case">
                          {categories.find((c: any) => c.id === cat.parent_id)?.name || ''}
                        </span>
                        <span className="opacity-40">&rsaquo;</span>
                      </>
                    ) : null}
                    <span>{cat.name}</span>
                  </h2>
                </div>
                <div className={`divide-y ${layoutStyle === 'modern_dark' ? 'divide-[#1e293b]/40' : 'divide-slate-100'}`}>
                  {cat.filteredItems.map((item: any) => {
                    const { initials, color } = getItemInitialsAndColor(item.name);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleOpenItem(item)}
                        className={`flex items-center gap-4 p-4 transition cursor-pointer ${layoutStyle === 'modern_dark' ? 'hover:bg-slate-900/20' : 'hover:bg-slate-50/50'
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
                                      if ((item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0) || (item.bases && item.bases.length > 0)) {
                                        handleOpenItem(item);
                                      } else {
                                        setCart((prev) => [
                                          ...prev,
                                          {
                                            id: `${item.id}-none-none-none`,
                                            menuItemId: item.id,
                                            name: item.name,
                                            price: parseFloat(item.price),
                                            quantity: 1,
                                            variant: null,
                                            addons: [],
                                            bases: [],
                                          },
                                        ]);
                                      }
                                    }}
                                    className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold transition hover:opacity-90"
                                    style={{
                                      backgroundColor: `${accentColor}12`,
                                      borderColor: `${accentColor}40`,

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
            className={`sticky top-24 border rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[80vh] ${layoutStyle === 'modern_dark'
              ? 'bg-[#0c101b]/80 border-[#1e293b]/60 text-white shadow-xl shadow-slate-950/20'
              : 'bg-white border-slate-200 text-slate-805'
              }`}
          >
            <div
              className={`p-4 border-b flex items-center justify-between ${layoutStyle === 'modern_dark' ? 'border-[#1e293b]/60 bg-slate-950/50' : 'border-slate-100 bg-slate-50'
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
                      {item.bases && item.bases.length > 0 && (
                        <p className={`text-[10px] truncate mt-0.5 font-semibold ${layoutStyle === 'modern_dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          Bases: {item.bases.map((b: any) => b.name.toUpperCase()).join(', ')}
                        </p>
                      )}
                      {item.addons.length > 0 && (
                        <p className={`text-[10px] truncate mt-0.5 font-semibold ${layoutStyle === 'modern_dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          Addons: {item.addons.map((a) => a.name.toUpperCase()).join(', ')}
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
              className={`p-4 border-t space-y-3 ${layoutStyle === 'modern_dark' ? 'border-[#1e293b]/60 bg-slate-950/50' : 'border-slate-100 bg-slate-50'
                }`}
            >
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>Subtotal</span>
                <span className={layoutStyle === 'modern_dark' ? 'text-white' : 'text-slate-800'}>${totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-500 font-bold">
                  <span>Discount</span>
                  <span>-${totals.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>Tax ({parseFloat(store.tax_rate).toFixed(2)}%)</span>
                <span className={layoutStyle === 'modern_dark' ? 'text-white' : 'text-slate-800'}>${totals.tax.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between border-t pt-2 text-sm font-black ${layoutStyle === 'modern_dark' ? 'border-[#1e293b]/60 text-white' : 'border-slate-200 text-slate-850'}`}>
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
              backgroundColor: primaryColor,
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
          <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xl flex flex-col md:flex-row relative max-h-[92vh] md:max-h-[85vh]">

            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-20 rounded-full bg-white/80 p-2 text-slate-500 hover:text-slate-800 border border-slate-200 transition"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Left Side: Product Image / Visual details */}
            <div className="w-full md:w-5/12 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex items-center justify-center relative h-36 md:h-auto flex-shrink-0">
              {selectedItem.image_url ? (
                <img
                  src={selectedItem.image_url}
                  alt="detail"
                  className="w-full h-full object-cover absolute inset-0"
                />
              ) : (
                <div className="text-slate-400 font-extrabold text-lg flex flex-col items-center gap-2 py-6">
                  <span className={`h-16 w-16 rounded-2xl text-white font-extrabold flex items-center justify-center shadow-md ${getItemInitialsAndColor(selectedItem.name).color}`}>
                    {getItemInitialsAndColor(selectedItem.name).initials}
                  </span>
                  <span className="text-slate-650 mt-1 font-bold text-xs">{selectedItem.name}</span>
                </div>
              )}
            </div>

            {/* Right Side: Options & Details */}
            <div className="w-full md:w-7/12 flex flex-col min-h-0 flex-1 overflow-hidden">
              {/* Product Info */}
              <div className="p-6 pb-4 border-b border-slate-100">
                <span className="text-[10px] bg-slate-100 text-slate-500 uppercase tracking-widest px-2 py-0.5 rounded font-bold">
                  {selectedItem.categoryName || 'Menu Item'}
                </span>
                <h3 className="text-xl font-black text-slate-850 mt-2">{selectedItem.name}</h3>
                <p className="text-xs text-slate-505 mt-1.5 leading-relaxed">{selectedItem.description}</p>
              </div>

              {/* Options Scroll Container */}
              <div className="p-6 pt-4 space-y-6 overflow-y-auto flex-1">
                {selectedItem.bases && selectedItem.bases.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-650 uppercase tracking-wider mb-2">Select Bases (Optional)</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedItem.bases.map((b: any) => {
                        const isSelected = selectedBases.some((base) => base.id === b.id);
                        return (
                          <button
                            key={b.id}
                            onClick={() => handleToggleBase(b)}
                            className={`p-3 rounded-xl border text-left text-xs uppercase font-bold transition flex flex-col justify-between ${isSelected
                              ? 'border-[#C39A3C] bg-[#C39A3C]/10 text-[#2A0E07]'
                              : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                              }`}
                          >
                            <p>{b.name}</p>
                            {parseFloat(b.extraPrice) > 0 && (
                              <p className={`text-[10px] mt-1 ${isSelected ? 'text-[#C39A3C]' : 'text-slate-400'}`}>
                                +${parseFloat(b.extraPrice).toFixed(2)}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedItem.variants && selectedItem.variants.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-650 uppercase tracking-wider mb-2">Select Variant</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedItem.variants.map((v: any) => {
                        const isSelected = selectedVariant?.id === v.id;
                        return (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVariant(v)}
                            className={`p-3 rounded-xl border text-left text-xs uppercase font-bold transition flex flex-col justify-between ${isSelected
                              ? 'border-[#C39A3C] bg-[#C39A3C]/10 text-[#2A0E07]'
                              : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                              }`}
                          >
                            <p>{v.name}</p>
                            <p className={`text-[10px] mt-1 ${isSelected ? 'text-[#C39A3C]' : 'text-slate-400'}`}>
                              ${(parseFloat(selectedItem.price) + parseFloat(v.additional_price || 0)).toFixed(2)}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedItem.addons && selectedItem.addons.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-650 uppercase tracking-wider mb-2">Select Add-ons (Optional)</h4>
                    <div className="space-y-2">
                      {selectedItem.addons.map((addon: any) => {
                        const isSelected = selectedAddons.some((a) => a.id === addon.id);
                        return (
                          <div
                            key={addon.id}
                            onClick={() => handleToggleAddon(addon)}
                            className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${isSelected
                              ? 'border-[#C39A3C] bg-[#C39A3C]/5 text-[#2A0E07]'
                              : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                              }`}
                          >
                            <span className="uppercase">{addon.name}</span>
                            {parseFloat(addon.price) > 0 && (
                              <span className="font-bold text-slate-605">+${parseFloat(addon.price).toFixed(2)}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Footer Actions */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Final Price</p>
                  <p className="text-xl font-black text-slate-800 mt-0.5">
                    ${(
                      parseFloat(selectedItem.price) +
                      selectedBases.reduce((sum, b) => sum + parseFloat(b.extraPrice || 0), 0) +
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
        </div>
      )}

      {/* CHECKOUT DIALOG */}
      {activeModal === 'checkout' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl my-4 flex flex-col" style={{ maxHeight: 'calc(100dvh - 2rem)' }}>

            {/* ── Header ── */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[#816659]" />
                Checkout
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-700 transition rounded-full hover:bg-slate-100 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

              {/* Order summary strip */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500 font-semibold">
                    {cart.reduce((s, c) => s + c.quantity, 0)} item{cart.reduce((s, c) => s + c.quantity, 0) !== 1 ? 's' : ''}
                    <span className="mx-2 text-slate-300">·</span>
                    <span className="text-slate-400">Tax {parseFloat(store.tax_rate).toFixed(1)}%</span>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">${totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex items-center justify-between text-xs text-emerald-650 font-semibold">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>-${totals.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm font-black text-slate-800 border-t border-slate-200/60 pt-1.5">
                  <span>Total Amount</span>
                  <span>${totals.total.toFixed(2)}</span>
                </div>
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
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex items-center justify-between gap-2">
                  <span className="text-slate-500">Guest checkout</span>
                  <div className="flex gap-3">
                    <Link href={`/order-online/${orgSlug}/customer/login`} className="font-bold underline text-slate-400" >Log In</Link>
                    <Link href={`/order-online/${orgSlug}/customer/register`} className="font-bold underline text-slate-400" >Sign Up</Link>
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone (optional)</label>
                  <input
                    type="tel" placeholder="+1 555-0100"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    onBlur={() => {
                      if (appliedCoupon) {
                        handleApplyCoupon(appliedCoupon.code);
                      }
                    }}
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

              {/* Coupon Section in Checkout Form */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider">APPLY COUPON</label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between border border-emerald-200 bg-emerald-50 rounded-lg px-2.5 py-1.5 text-xs text-emerald-800">
                    <span className="font-bold">{appliedCoupon.code} Applied</span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-red-500 hover:text-red-700 font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ENTER CODE"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-400 transition uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon()}
                      disabled={couponLoading || !couponCode.trim()}
                      className="rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:bg-slate-200 disabled:text-slate-400 bg-slate-800 hover:bg-slate-900 text-white"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-[10px] text-red-500 font-semibold">{couponError}</p>
                )}
                {appliedCoupon && totals.subtotal < parseFloat(appliedCoupon.min_order_amount) && (
                  <p className="text-[10px] text-amber-500 font-semibold">
                    Add ${(parseFloat(appliedCoupon.min_order_amount) - totals.subtotal).toFixed(2)} more to get discount.
                  </p>
                )}
              </div>

              {/* Order Type */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Mode *</label>
                <div className={`grid ${orderType === 'dine_in' ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mt-1.5`}>
                  {(orderType === 'dine_in'
                    ? (['dine_in', 'takeaway', 'delivery'] as const)
                    : (['takeaway', 'delivery'] as const)
                  ).map((mode) => (
                    <button
                      key={mode} type="button"
                      onClick={() => setOrderType(mode)}
                      className={`py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wide transition ${orderType === mode
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
                      <option key={t.id} value={t.id} disabled={t.status !== 'available' && t.id !== selectedTableId}>
                        {t.table_number} ({t.seating_capacity} seats){t.status !== 'available' ? ` • ${t.status.charAt(0).toUpperCase() + t.status.slice(1)}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Delivery address */}
              {orderType === 'delivery' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivery Address *</label>
                    <button
                      type="button"
                      disabled={geocodingCheckout}
                      onClick={fetchCurrentLocationCheckout}
                      className="text-[10px] font-bold transition flex items-center gap-1 hover:opacity-85"
                      style={{ color: primaryColor }}
                    >
                      <MapPin className="h-3 w-3" />
                      {geocodingCheckout ? "Locating..." : "Use Current Location"}
                    </button>
                  </div>

                  {customer?.addresses && customer.addresses.length > 0 && (
                    <div className="mt-1">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            setDeliveryAddress(e.target.value);
                            validateAddress(e.target.value);
                          }
                        }}
                        value={customer.addresses.includes(deliveryAddress) ? deliveryAddress : ""}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition"
                      >
                        <option value="">-- Choose saved address --</option>
                        {customer.addresses.map((addr: string, idx: number) => (
                          <option key={idx} value={addr}>{addr}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <textarea
                    required
                    placeholder="Enter complete delivery address..."
                    value={deliveryAddress}
                    onChange={(e) => {
                      setDeliveryAddress(e.target.value);
                      setDeliveryError(null);
                      setDeliverySuccessMsg(null);
                    }}
                    onBlur={() => validateAddress(deliveryAddress)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 h-14 outline-none resize-none focus:border-slate-400 focus:bg-white transition"
                  />
                  {deliveryValidating && (
                    <p className="text-[10px] text-amber-500 mt-1 font-bold animate-pulse">Validating delivery availability...</p>
                  )}
                  {deliveryError && (
                    <p className="text-[10px] text-rose-500 mt-1 font-bold">{deliveryError}</p>
                  )}
                  {deliverySuccessMsg && (
                    <p className="text-[10px] text-emerald-600 mt-1 font-bold">{deliverySuccessMsg}</p>
                  )}
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
              {(() => {
                const availableMethods = [
                  { id: 'cash', label: '💵 Cash' },
                  ...(stripeEnabled ? [{ id: 'card', label: '💳 Card' }] : []),
                  ...(upiEnabled ? [{ id: 'upi', label: '⚡ UPI' }] : [])
                ] as const;

                if (availableMethods.length <= 1) return null;

                return (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
                    <div className={`grid gap-2 mt-1.5 ${
                      availableMethods.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
                    }`}>
                      {availableMethods.map((method) => (
                        <button
                          key={method.id} type="button"
                          onClick={() => {
                            setPaymentMethod(method.id as 'cash' | 'card' | 'upi');
                            setCardError(null);
                          }}
                          className={`py-2.5 rounded-lg border text-[11px] font-bold uppercase tracking-wide transition flex items-center justify-center gap-1.5 ${paymentMethod === method.id
                            ? 'border-slate-800 bg-slate-800 text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Stripe Card Element */}
              {stripeEnabled && paymentMethod === 'card' && stripePromise && (
                <Elements stripe={stripePromise}>
                  <StripeCardCheckout
                    storeId={stripeStoreId!}
                    amount={totals.total}
                    currency={store?.currency || 'aud'}
                    customer={customer}
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
                      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
                    }}
                    onSuccess={(order: any, accountInfo?: any) => {
                      triggerOrderCreatedNotification(order, cart, orderType);
                      setRecentOrder(order);
                      setNewAccount(accountInfo || null);
                      setCart([]);
                      setDeliveryAddress('');
                      setSelectedTableId('');
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
              <div className="flex items-center justify-between mb-3 text-xs font-bold " >
                <span>Total (incl. tax)</span>
                <span className="text-base" style={{
                  color: primaryColor
                }} >${totals.total.toFixed(2)}</span>
              </div>
              {(!stripeEnabled || paymentMethod === 'cash' || paymentMethod === 'upi') && (
                <button
                  type="button"
                  onClick={handleCheckout as any}
                  disabled={submitting || cart.length === 0}
                  className="w-full rounded-xl py-3 text-xs font-bold text-white transition shadow-lg disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  {submitting
                    ? 'Placing Order...'
                    : paymentMethod === 'upi'
                    ? '⚡ Proceed to UPI Payment'
                    : 'Place Order & Pay at Counter'}
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
                  <span>Total Bill</span>
                  <span className="text-slate-800 font-extrabold">${parseFloat(recentOrder.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Status</span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700 uppercase font-black">{recentOrder.status}</span>
                </div>
              </div>

              {/* UPI Payment confirmation note */}
              {recentOrder.payments?.[0]?.payment_method === 'upi' && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 space-y-2 text-xs font-semibold text-emerald-800 animate-in fade-in duration-300">
                  <p className="font-extrabold flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-600" /> Payment Reference Registered!</p>
                  <p className="text-[10px] text-slate-500 font-medium leading-normal">
                    Reference ID: <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{recentOrder.payments[0].transaction_reference}</span>
                  </p>
                  <p className="text-[10px] text-slate-450 leading-relaxed font-medium">
                    Our team will verify this UPI reference code against our bank statement before preparing your order.
                  </p>
                </div>
              )}

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

      {/* UPI PAYMENT INPUT MODAL (POPUP BEFORE ORDER PLACEMENT) */}
      {showUpiPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleUpiCheckoutSubmit} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-amber-50 px-6 py-5 text-center border-b border-amber-100 relative">
              <button
                type="button"
                onClick={() => { setShowUpiPayModal(false); setUpiUtrRef(''); }}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-base font-extrabold text-slate-800">Complete UPI Payment</h3>
              <p className="text-xs text-slate-500 mt-1">Scan QR code & enter transaction details</p>
            </div>

            {verifyingUpi ? (
              <div className="p-8 text-center space-y-4 animate-in fade-in duration-300">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 border-r-amber-500 animate-spin"></div>
                  <Loader2 className="h-6 w-6 text-amber-500 animate-pulse animate-spin" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-800">Verifying UPI Transaction</h4>
                  <p className="text-[10px] text-slate-500 font-medium">UTR Reference: <span className="font-mono text-slate-700 font-bold">{upiUtrRef}</span></p>
                </div>
                <div className="text-[9px] bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-amber-800 max-w-[240px] mx-auto leading-normal">
                  Connecting to UPI payments gateway network and merchant bank...
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {/* Order total amount info */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Total Amount Due</span>
                  <span className="text-slate-900 text-sm font-black">${totals.total.toFixed(2)}</span>
                </div>

                {/* UPI Payment Scan QR */}
                {(upiVpa || upiQrImage) && (
                  <div className="space-y-3 text-center">
                    {/* QR Code Container */}
                    <div className="mx-auto bg-white p-2 w-44 h-44 rounded-xl border border-slate-200 flex items-center justify-center shadow-inner">
                      {upiQrImage ? (
                        <img
                          src={upiQrImage}
                          alt="Merchant UPI Scanner"
                          className="w-40 h-40 object-contain rounded-lg"
                        />
                      ) : (
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                            `upi://pay?pa=${upiVpa || ''}&pn=${encodeURIComponent(store.name || 'Store')}&am=${totals.total.toFixed(2)}&cu=INR&tn=Checkout%20Order`
                          )}`}
                          alt="UPI QR Code"
                          className="w-40 h-40"
                        />
                      )}
                    </div>

                    <p className="text-[10px] text-slate-500 font-medium">
                      {upiQrImage ? 'Scan and pay the exact amount due' : 'Scan to pay directly from your mobile device'}
                    </p>

                    {upiVpa && (
                      <a
                        href={`upi://pay?pa=${upiVpa}&pn=${encodeURIComponent(store.name || 'Store')}&am=${totals.total.toFixed(2)}&cu=INR&tn=Checkout%20Order`}
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] transition shadow-md shadow-amber-500/10"
                      >
                        ⚡ Pay via UPI App
                      </a>
                    )}
                  </div>
                )}

                {/* Transaction / UTR input field (Optional) */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Transaction / UTR Reference ID <span className="text-slate-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={30}
                    value={upiUtrRef}
                    onChange={(e) => setUpiUtrRef(e.target.value)}
                    placeholder="e.g. 12-digit UTR or Ref Code"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition font-mono tracking-wider text-center"
                  />
                  <p className="text-[9px] text-slate-450 leading-relaxed text-center">
                    You can enter your UPI transaction reference code to speed up verification.
                  </p>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting || verifyingUpi}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50 shadow-md"
                >
                  {submitting ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
                      Placing Order...
                    </>
                  ) : (
                    'Complete Payment & Place Order'
                  )}
                </button>
              </div>
            )}

          </form>
        </div>
      )}

      <footer
        className="py-6 border-t text-center text-[10px] text-slate-400 flex flex-col justify-center gap-3"
        style={{ borderColor: `${primaryColor}1a`, backgroundColor: "white" }}
      >
        <div className=' '>
          <p>© {new Date().getFullYear()} {store?.Organization?.name || store?.name || 'Restaurant'}. Powered by Ordering System.</p>

          <div className="flex justify-center gap-3 mt-2 text-[9px] font-semibold text-slate-405">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:underline">Terms & Conditions</a>
          </div></div>
      </footer>

      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-xl backdrop-blur-md border ${layoutStyle === 'modern_dark'
                ? toast.type === 'success'
                  ? 'bg-emerald-950/95 border-emerald-900/50 text-emerald-100'
                  : toast.type === 'error'
                    ? 'bg-rose-950/95 border-rose-900/50 text-rose-100'
                    : 'bg-slate-900/95 border-slate-800/80 text-slate-100'
                : toast.type === 'success'
                  ? 'bg-emerald-50/95 border-emerald-100 text-emerald-800'
                  : toast.type === 'error'
                    ? 'bg-rose-50/95 border-rose-100 text-rose-800'
                    : 'bg-slate-50/95 border-slate-100 text-slate-800'
                }`}
            >
              {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />}
              {toast.type === 'info' && <Info className="h-5 w-5 text-blue-500 shrink-0" />}
              <span className="text-xs font-bold">{toast.message}</span>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="ml-auto text-slate-400 hover:text-slate-650 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
