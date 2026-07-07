'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Award, 
  ShoppingBag, 
  CreditCard, 
  Calendar,
  AlertCircle,
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  Edit2,
  Save,
  Check,
  X,
  CreditCard as CardIcon,
  Sparkles,
  Compass,
  Menu,
  Home,
  Lock
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Stripe form styling wrapper
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '15px',
      '::placeholder': {
        color: '#94a3b8',
      },
    },
    invalid: {
      color: '#f87171',
      iconColor: '#f87171',
    },
  },
};

// --- STRIPE CHECKOUT FORM SUB-COMPONENT ---
function OnlinePaymentForm({ 
  order, 
  clientSecret, 
  onSuccess, 
  onClose, 
  primaryColor, 
  accentColor 
}: { 
  order: any; 
  clientSecret: string; 
  onSuccess: () => void; 
  onClose: () => void; 
  primaryColor: string; 
  accentColor: string; 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError('');

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setSubmitting(false);
        return;
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        { payment_method: { card: cardElement } }
      );

      if (stripeError) {
        setError(stripeError.message || 'Payment processing failed.');
        setSubmitting(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Direct API update to update order payment status on success
        const res = await fetch(`/api/public/orders/${order.id}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionReference: paymentIntent.id }),
        });
        const updateData = await res.json();
        if (res.ok && updateData.success) {
          onSuccess();
        } else {
          setError(updateData.error || 'Payment succeeded but failed to sync order status.');
          setSubmitting(false);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-6">
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
        <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Card Details</label>
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs font-semibold text-red-400 bg-red-950/20 border border-red-900/30 p-3.5 rounded-xl">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !stripe}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg transition disabled:opacity-60"
          style={{ backgroundColor: accentColor }}
        >
          {submitting ? (
            <>
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Pay ${order.totalAmount.toFixed(2)} Now
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// --- MAIN PROFILE COMPONENT ---
export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;

  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'payments' | 'profile' | 'addresses' | 'change-password'>('orders');
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number }>({ lat: 40.7128, lng: -74.0060 });
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [validatingZone, setValidatingZone] = useState(false);
  const [zoneMessage, setZoneMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Saved Address States
  const [addresses, setAddresses] = useState<string[]>([]);
  const [newAddressInput, setNewAddressInput] = useState('');
  const [savingAddresses, setSavingAddresses] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Online Payment States
  const [selectedOrderForPay, setSelectedOrderForPay] = useState<any>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [stripeConfig, setStripeConfig] = useState<any>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentIntentSecret, setPaymentIntentSecret] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/public/customer/me');
      const data = await res.json();
      
      if (res.status === 401) {
        router.push(`/order-online/${orgSlug}/customer/login`);
        return;
      }

      if (res.ok && data.success) {
        setCustomer(data.customer);
        setEditName(data.customer.name);
        setEditPhone(data.customer.phone);
        setEditEmail(data.customer.email || '');
        setAddresses(data.customer.addresses || []);
        setOrders(data.orders || []);
      } else {
        setError(data.error || 'Failed to fetch customer profile.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error loading profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Fetch diner details and orders
    fetchProfile();

    // 2. Fetch store theme info
    if (orgSlug) {
      fetch(`/api/public/store?orgSlug=${orgSlug}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.store) setStore(data.store);
        })
        .catch(() => {});
    }
  }, [orgSlug, router]);

  // Load Leaflet dynamically on opening Addresses tab
  useEffect(() => {
    if (activeTab !== 'addresses') return;

    // Load CSS
    const linkId = 'leaflet-css';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load JS
    const scriptId = 'leaflet-js';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else {
      if (typeof window !== 'undefined' && (window as any).L) {
        setLeafletLoaded(true);
      }
    }
  }, [activeTab]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!leafletLoaded || activeTab !== 'addresses') return;

    const L = (window as any).L;
    if (!L) return;

    // Remove existing map instance if any to avoid re-initialization errors
    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch (e) {
        console.error(e);
      }
      mapRef.current = null;
      markerRef.current = null;
    }

    const initialLat = mapCoords.lat;
    const initialLng = mapCoords.lng;

    const mapInstance = L.map('address-leaflet-map').setView([initialLat, initialLng], 13);
    mapRef.current = mapInstance;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    const customIcon = L.divIcon({
      html: `<div style="background-color: ${accentColor || '#3b82f6'}; border: 2px solid white; width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
      className: 'custom-map-pin',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const markerInstance = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: customIcon
    }).addTo(mapInstance);
    markerRef.current = markerInstance;

    const handleLocationChange = async (lat: number, lng: number) => {
      setMapCoords({ lat, lng });
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        if (data && data.display_name) {
          setNewAddressInput(data.display_name);
          validateDeliveryLocation(data.display_name, lat, lng);
        }
      } catch (err) {
        console.error(err);
      }
    };

    markerInstance.on('dragend', () => {
      const position = markerInstance.getLatLng();
      handleLocationChange(position.lat, position.lng);
    });

    mapInstance.on('click', (e: any) => {
      markerInstance.setLatLng(e.latlng);
      handleLocationChange(e.latlng.lat, e.latlng.lng);
    });

    // Try locating user automatically on mount if coords are default
    if (mapCoords.lat === 40.7128 && mapCoords.lng === -74.0060 && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          if (mapInstance && markerInstance) {
            mapInstance.setView([userLat, userLng], 15);
            markerInstance.setLatLng([userLat, userLng]);
            handleLocationChange(userLat, userLng);
          }
        },
        () => {},
        { timeout: 5000 }
      );
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error(e);
        }
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [leafletLoaded, activeTab]);

  // Debounced input validation
  useEffect(() => {
    if (!newAddressInput.trim() || activeTab !== 'addresses') {
      setZoneMessage(null);
      return;
    }

    const timer = setTimeout(() => {
      validateDeliveryLocation(newAddressInput, mapCoords.lat, mapCoords.lng);
    }, 850);

    return () => clearTimeout(timer);
  }, [newAddressInput, activeTab]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/public/customer/logout', { method: 'POST' });
      if (res.ok) {
        window.location.href = `/order-online/${orgSlug}/menu`;
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Edit Profile Form Submit Handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);

    try {
      const res = await fetch('/api/public/customer/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          email: editEmail || null,
          addresses: addresses
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setCustomer(data.customer);
        setAddresses(data.customer.addresses || []);
        setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
      } else {
        setProfileMessage({ type: 'error', text: data.error || 'Failed to update profile.' });
      }
    } catch (err) {
      setProfileMessage({ type: 'error', text: 'Connection error. Please try again.' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password Form Submit Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'All password fields are required.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    setSavingPassword(true);
    setPasswordMessage(null);

    try {
      const res = await fetch('/api/public/customer/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          addresses: customer.addresses,
          currentPassword,
          newPassword
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to update password.' });
      }
    } catch (err) {
      setPasswordMessage({ type: 'error', text: 'Connection error. Please try again.' });
    } finally {
      setSavingPassword(false);
    }
  };

  // Saved Addresses Handlers
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAddr = newAddressInput.trim();
    if (!cleanAddr) return;
    if (addresses.includes(cleanAddr)) {
      alert('Address already exists.');
      return;
    }
    setSavingAddresses(true);
    const updated = [...addresses, cleanAddr];
    await saveAddresses(updated);
    setNewAddressInput('');
    setSavingAddresses(false);
  };

  const handleDeleteAddress = async (index: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    setSavingAddresses(true);
    const updated = addresses.filter((_, i) => i !== index);
    await saveAddresses(updated);
    setSavingAddresses(false);
  };

  const saveAddresses = async (updatedList: string[]) => {
    try {
      const res = await fetch('/api/public/customer/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          email: editEmail || null,
          addresses: updatedList
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomer(data.customer);
        setAddresses(data.customer.addresses || []);
      } else {
        alert(data.error || 'Failed to save address.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error saving address.');
    }
  };
  const validateDeliveryLocation = async (addressText: string, lat?: number, lng?: number) => {
    if (!store?.id) return;
    
    setValidatingZone(true);
    setZoneMessage(null);
    
    try {
      let zipcode = '';
      const zipMatch = addressText.match(/\b\d{4,5}\b/);
      if (zipMatch) zipcode = zipMatch[0];

      const res = await fetch('/api/public/store/validate-delivery-zone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          lat,
          lng,
          address: addressText,
          zipcode
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.allowed) {
          setZoneMessage({ type: 'success', text: data.message });
        } else {
          setZoneMessage({ type: 'error', text: data.message });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setValidatingZone(false);
    }
  };
  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          if (data && data.display_name) {
            setNewAddressInput(data.display_name);
            setMapCoords({ lat: latitude, lng: longitude });
            validateDeliveryLocation(data.display_name, latitude, longitude);
            // Update map view and marker
            if (mapRef.current && markerRef.current) {
              mapRef.current.setView([latitude, longitude], 15);
              markerRef.current.setLatLng([latitude, longitude]);
            }
          } else {
            alert(`Location found (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) but reverse geocoding failed.`);
          }
        } catch (err) {
          console.error(err);
          setNewAddressInput(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } finally {
          setGeocoding(false);
        }
      },
      (error) => {
        console.error(error);
        alert("Failed to retrieve location: " + error.message);
        setGeocoding(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Pay Cash Order Online Handler
  const initPayment = async (order: any) => {
    setPaymentLoading(true);
    setSelectedOrderForPay(order);
    setPaymentIntentSecret(null);

    try {
      // 1. Get stripe publishable key config for this store
      const configRes = await fetch(`/api/pos/stripe-config?storeId=${order.storeId}`);
      const configData = await configRes.json();

      if (!configRes.ok || !configData.enabled || !configData.publishableKey) {
        alert('Stripe payments are not enabled for this restaurant.');
        setPaymentLoading(false);
        setSelectedOrderForPay(null);
        return;
      }

      setStripeConfig(configData);
      setStripePromise(loadStripe(configData.publishableKey));

      // 2. Create PaymentIntent on server
      const intentRes = await fetch('/api/public/stripe/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: order.storeId,
          amount: order.totalAmount,
          currency: 'aud',
          orderId: order.id
        })
      });
      const intentData = await intentRes.json();

      if (intentRes.ok && intentData.clientSecret) {
        setPaymentIntentSecret(intentData.clientSecret);
      } else {
        alert(intentData.error || 'Failed to initialize online payment.');
        setSelectedOrderForPay(null);
      }
    } catch (err) {
      console.error(err);
      alert('Network error initiating payment.');
      setSelectedOrderForPay(null);
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100 font-sans">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-slate-400 font-semibold">Loading your customer profile...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100 text-center font-sans">
        <AlertCircle className="h-14 w-14 text-red-500 mb-4" />
        <h2 className="text-2xl font-black">Profile Error</h2>
        <p className="mt-2 text-sm text-slate-400 max-w-sm">
          {error || 'Unable to authenticate your customer account.'}
        </p>
        <button
          onClick={() => router.push(`/order-online/${orgSlug}/customer/login`)}
          className="mt-6 rounded-xl bg-slate-900 border border-slate-800 px-6 py-3 text-sm font-semibold hover:bg-slate-800 transition"
        >
          Proceed to Login
        </button>
      </div>
    );
  }

  const primaryColor = store?.theme_primary_color || '#0f172a';
  const accentColor = store?.theme_accent_color || '#3b82f6';
  const appLogo = store?.Organization?.logo || null;
  const bgColor = store?.bg_color_menu || store?.theme_bg_color || '#030712';
  const bgImage = store?.bg_menu || null;

  const getOrderStatusPill = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-400 border border-amber-500/20"><Clock className="h-3 w-3" /> Pending</span>;
      case 'accepted':
        return <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-400 border border-blue-500/20"><CheckCircle className="h-3 w-3" /> Accepted</span>;
      case 'preparing':
        return <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-purple-400 border border-purple-500/20"><Clock className="h-3 w-3" /> Cooking</span>;
      case 'ready':
        return <span className="inline-flex items-center gap-1 rounded bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-cyan-400 border border-cyan-500/20"><CheckCircle className="h-3 w-3" /> Ready</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20"><CheckCircle className="h-3 w-3" /> Served</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-red-400 border border-red-500/20"><XCircle className="h-3 w-3" /> Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded bg-slate-500/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-slate-400 border border-slate-500/20"><HelpCircle className="h-3 w-3" /> {status}</span>;
    }
  };

  const getPaymentStatusPill = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 border border-emerald-500/25">Paid Online</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-400 border border-amber-500/25">Unpaid Cash</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-400 border border-red-500/25">Failed</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded bg-slate-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border border-slate-500/25">{status}</span>;
    }
  };

  const paymentsList = orders.flatMap(order => 
    (order.payments || []).map((pay: any) => ({
      ...pay,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      createdAt: order.createdAt
    }))
  );

  return (
    <div 
      className="min-h-screen font-sans text-slate-100 relative overflow-hidden pb-12 transition-all duration-350"
      style={{
        backgroundColor: bgColor,
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: bgImage ? 'cover' : undefined,
        backgroundPosition: bgImage ? 'center' : undefined,
        backgroundAttachment: bgImage ? 'fixed' : undefined,
      }}
    >
      {/* Dynamic Ambient Background Blur */}
      <div 
        className="absolute top-0 left-1/4 h-[35rem] w-[35rem] rounded-full blur-[120px] opacity-10 pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />
      <div 
        className="absolute bottom-12 right-1/4 h-[30rem] w-[30rem] rounded-full blur-[140px] opacity-5 pointer-events-none"
        style={{ backgroundColor: primaryColor }}
      />

      {/* 1. BRAND HEADER SECTION */}
      <div 
        className="relative z-10 w-full border-b border-slate-800/80 px-6 py-5"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Hamburger Menu Toggle Button for mobile screens */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/40 transition shrink-0"
              title="Open Navigation"
            >
              <Menu className="h-6 w-6" />
            </button>

            {appLogo ? (
              <img src={appLogo} alt="Restaurant Logo" className="h-10 w-auto object-contain max-h-10 shrink-0" />
            ) : (
              <div 
                className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-lg text-white shrink-0"
                style={{ backgroundColor: primaryColor,color:accentColor }}
              >
                {store?.name?.charAt(0) || orgSlug.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <h1 className="hidden sm:block text-sm font-extrabold text-slate-300">Diner Account Portal</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 hover:border-red-500/30 bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-350 hover:text-red-400 transition"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* 2. BODY CONTENT LAYOUT */}
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* SIDEBAR NAVIGATION (LEFT COLUMN - 3 COLS - HIDDEN ON MOBILE) */}
        <div className="hidden md:block md:col-span-3 space-y-4">
          {/* User Profile Summary Card */}
          <div className="border rounded-3xl p-5 backdrop-blur-md relative overflow-hidden shadow-lg" style={{ backgroundColor: `${primaryColor}e8`, borderColor: `${accentColor}30` }}>
            <div className="flex items-center gap-3">
              <div 
                className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-lg text-white shrink-0"
                style={{ backgroundColor: primaryColor, color: accentColor }}
              >
                {customer.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase font-extrabold text-slate-450 tracking-wider">Welcome back</p>
                <h4 className="text-sm font-extrabold truncate" style={{ color: accentColor }}>{customer.name}</h4>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="border rounded-3xl p-3 space-y-1 backdrop-blur-md shadow-lg" style={{ backgroundColor: `${primaryColor}e8`, borderColor: `${accentColor}30` }}>
            {[
              { key: 'home' as const, label: 'Home', icon: Home, isLink: true, href: `/order-online/${orgSlug}/menu` },
              { key: 'orders' as const, label: 'Order Logs', icon: ShoppingBag },
              { key: 'profile' as const, label: 'Profile Details', icon: User },
              { key: 'change-password' as const, label: 'Change Password', icon: Lock },
              { key: 'payments' as const, label: 'Payment History', icon: CreditCard },
              { key: 'addresses' as const, label: 'Saved Addresses', icon: Compass },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              if (item.isLink) {
                return (
                  <Link
                    key={item.key}
                    href={item.href || '#'}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black transition-all duration-200 border-l-2 text-slate-400 hover:text-white hover:bg-slate-800/30 border-transparent"
                  >
                    <Icon className="h-4.5 w-4.5 text-slate-500" />
                    <span>{item.label}</span>
                  </Link>
                );
              }
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black transition-all duration-200 border-l-2 ${
                    isActive
                      ? 'text-white border-solid'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border-transparent'
                  }`}
                  style={isActive ? { backgroundColor: `${primaryColor}aa`, borderLeftColor: accentColor } : undefined}
                >
                  <Icon className="h-4.5 w-4.5" style={isActive ? { color: accentColor } : undefined} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN PANEL CONTENT (RIGHT COLUMN - 9 COLS) */}
        <div className="md:col-span-9 space-y-6">
          {/* PROFILE VIEW */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
              
              {/* Column 1 - Rewards (lg:col-span-5) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="border rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md flex flex-col justify-between min-h-[250px]" style={{ backgroundColor: `${primaryColor}e8`, borderColor: `${accentColor}30` }}>
                  <div className="absolute right-4 top-4 h-14 w-14 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center">
                    <Award className="h-7 w-7 animate-pulse" style={{ color: accentColor }} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-455 tracking-wider">Rewards Overview</p>
                    <h3 className="text-xl font-extrabold mt-1" style={{ color: accentColor }}>Loyalty Points</h3>
                    <p className="text-xs text-slate-400 mt-2">Earn points on every order you place to unlock custom discounts and special treats.</p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-850 flex items-center gap-3.5 bg-gradient-to-br from-slate-950 to-slate-900/80 p-4 rounded-2xl border border-slate-800">
                    <div 
                      className="p-3 rounded-xl border border-white/5 flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${accentColor}12` }}
                    >
                      <Award className="h-6 w-6" style={{ color: accentColor }} />
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Points Balance</p>
                      <p className="text-3xl font-black mt-0.5" style={{ color: accentColor }}>{customer.loyaltyPoints} PTS</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2 - Edit Profile Form (lg:col-span-7) */}
              <div className="lg:col-span-7 border rounded-3xl p-6 shadow-xl relative backdrop-blur-md h-fit" style={{ backgroundColor: `${primaryColor}e8`, borderColor: `${accentColor}30` }}>
                <div className="flex justify-between items-center pb-4 border-b border-slate-800/60">
                  <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: accentColor }}>
                    <User className="h-4 w-4" style={{ color: accentColor }} /> Profile Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setProfileMessage(null);
                    }}
                    className="text-xs font-bold flex items-center gap-1 transition"
                    style={{ color: accentColor }}
                  >
                    {isEditing ? (
                      <>
                        <X className="h-3.5 w-3.5" /> Cancel
                      </>
                    ) : (
                      <>
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </>
                    )}
                  </button>
                </div>

                {profileMessage && (
                  <div className={`mt-4 flex items-start gap-2 text-xs font-semibold p-3.5 rounded-xl border ${
                    profileMessage.type === 'success' 
                      ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30' 
                      : 'text-red-400 bg-red-950/20 border-red-900/30'
                  }`}>
                    {profileMessage.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                    <span>{profileMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4 mt-5">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Display Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        disabled={!isEditing || savingProfile}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-slate-200 placeholder-slate-650 focus:outline-none focus:border-slate-700 disabled:opacity-50 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="tel"
                        disabled={!isEditing || savingProfile}
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-slate-200 placeholder-slate-650 focus:outline-none focus:border-slate-700 disabled:opacity-50 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        disabled={!isEditing || savingProfile}
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="Provide your email"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-slate-200 placeholder-slate-650 focus:outline-none focus:border-slate-700 disabled:opacity-50 transition"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="w-full mt-4 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-black text-white transition hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: accentColor }}
                    >
                      {savingProfile ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" /> Save Profile Details
                        </>
                      )}
                    </button>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* CHANGE PASSWORD VIEW */}
          {activeTab === 'change-password' && (
            <div className="max-w-md mx-auto w-full animate-in fade-in duration-300">
              <div className="border rounded-3xl p-6 shadow-xl relative backdrop-blur-md" style={{ backgroundColor: `${primaryColor}e8`, borderColor: `${accentColor}30` }}>
                <div className="pb-4 border-b border-slate-800/60 flex items-center gap-2">
                  <Lock className="h-4 w-4" style={{ color: accentColor }} />
                  <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: accentColor }}>Change Password</h3>
                </div>

                {passwordMessage && (
                  <div className={`mt-4 flex items-start gap-2 text-xs font-semibold p-3.5 rounded-xl border ${
                    passwordMessage.type === 'success' 
                      ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30' 
                      : 'text-red-400 bg-red-950/20 border-red-900/30'
                  }`}>
                    {passwordMessage.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 mt-5">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        disabled={savingPassword}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Your current password"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-slate-200 placeholder-slate-650 focus:outline-none focus:border-slate-700 disabled:opacity-50 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        disabled={savingPassword}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-slate-200 placeholder-slate-650 focus:outline-none focus:border-slate-700 disabled:opacity-50 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        disabled={savingPassword}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-slate-200 placeholder-slate-650 focus:outline-none focus:border-slate-700 disabled:opacity-50 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full mt-2 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-black text-white transition hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: accentColor }}
                  >
                    {savingPassword ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> Change Password
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ORDER LOGS VIEW */}
          {activeTab === 'orders' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {orders.length === 0 ? (
                <div className="text-center py-16 border border-slate-800/80 rounded-3xl bg-slate-900/20 backdrop-blur-md">
                  <ShoppingBag className="h-12 w-12 mx-auto stroke-[1.5] text-slate-700 mb-3" />
                  <p className="text-slate-500 font-semibold text-sm">You haven't placed any food orders yet.</p>
                  <Link
                    href={`/order-online/${orgSlug}/menu`}
                    className="inline-block mt-4 rounded-xl px-5 py-3 text-xs font-bold   transition hover:opacity-90"
                    style={{ backgroundColor: primaryColor,color:accentColor }}
                  >
                    Browse Menu & Order
                  </Link>
                </div>
              ) : (
                orders.map((order) => {
                  const isPaid = order.payments?.some((p: any) => p.transaction_status === 'success');
                  const canPayOnline = !isPaid && order.status !== 'cancelled';

                  return (
                    <div
                      key={order.id}
                      className="border rounded-3xl p-6 shadow-sm space-y-5 backdrop-blur-sm"
                      style={{ backgroundColor: `${primaryColor}e8`, borderColor: `${accentColor}30` }}
                    >
                      {/* Order info header */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800/60 pb-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="text-base font-black" style={{ color: accentColor }}>{order.orderNumber}</h4>
                            {getOrderStatusPill(order.status)}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                            <span className="flex items-center gap-1 font-semibold">
                              <Calendar className="h-3.5 w-3.5 text-slate-500" />
                              {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="uppercase font-extrabold tracking-widest text-[9px] px-2 py-0.5 rounded border border-white/5" style={{ backgroundColor: `${accentColor}12`, color: accentColor }}>
                              {order.orderType.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-5 sm:text-right">
                          <div>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Bill</p>
                            <p className="text-lg font-black text-white mt-0.5">${order.totalAmount.toFixed(2)}</p>
                          </div>
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                              <Check className="h-3.5 w-3.5" /> Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-amber-400 border border-amber-500/20">
                              <Clock className="h-3.5 w-3.5" /> Cash (Pending)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Food items list */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Items Detail</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {order.items?.map((item: any) => (
                            <div
                              key={item.id}
                              className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl flex justify-between items-center text-xs"
                            >
                              <div>
                                <p className="font-extrabold text-white">
                                  {item.notes ? `${item.notes}` : 'Menu Item'}
                                </p>
                                {item.addons && item.addons.length > 0 && (
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    Addons: {item.addons.map((a: any) => a.name).join(', ')}
                                  </p>
                                )}
                              </div>
                              <span className="font-black text-slate-350 text-right">
                                {item.quantity}x @ ${parseFloat(item.unit_price).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pay cash online feature button */}
                      {canPayOnline && (
                        <div className="pt-3 border-t border-slate-800/40 flex justify-between items-center gap-4 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
                          <div className="flex items-start gap-2.5 text-xs text-amber-450 font-semibold max-w-md">
                            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-amber-500" />
                            <span>This order was placed under Cash mode. You can pay it securely online now using a Credit/Debit Card to skip cashier payment queues!</span>
                          </div>
                          <button
                            onClick={() => initPayment(order)}
                            className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-black text-white shrink-0 shadow-lg hover:opacity-90 transition"
                            style={{ backgroundColor: accentColor }}
                          >
                            <CardIcon className="h-4 w-4" /> Pay Online
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* PAYMENT HISTORY VIEW */}
          {activeTab === 'payments' && (
            <div className="border rounded-3xl overflow-hidden shadow-xl backdrop-blur-md animate-in fade-in duration-300" style={{ backgroundColor: `${primaryColor}e8`, borderColor: `${accentColor}30` }}>
              {paymentsList.length === 0 ? (
                <div className="text-center py-16 text-slate-500 font-semibold">
                  <CreditCard className="h-12 w-12 mx-auto stroke-[1.5] text-slate-700 mb-3" />
                  <p className="text-sm">No billing transactions or receipt records found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-4.5 px-6">Date</th>
                        <th className="py-4.5 px-6">Order ID</th>
                        <th className="py-4.5 px-6">Method</th>
                        <th className="py-4.5 px-6">Tx Reference</th>
                        <th className="py-4.5 px-6">Amount</th>
                        <th className="py-4.5 px-6 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs">
                      {paymentsList.map((pay: any) => (
                        <tr key={pay.id} className="hover:bg-slate-850/30 transition">
                          <td className="py-4.5 px-6 text-slate-400">
                            {new Date(pay.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4.5 px-6 font-extrabold text-white">
                            {pay.orderNumber}
                          </td>
                          <td className="py-4.5 px-6 uppercase text-slate-400 font-extrabold text-[10px] tracking-wider">
                            {pay.payment_method}
                          </td>
                          <td className="py-4.5 px-6 font-mono text-[10px] text-slate-500">
                            {pay.transaction_reference || 'N/A'}
                          </td>
                          <td className="py-4.5 px-6 font-black text-white">
                            ${parseFloat(pay.amount).toFixed(2)}
                          </td>
                          <td className="py-4.5 px-6 text-right">
                            {getPaymentStatusPill(pay.transaction_status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SAVED ADDRESSES VIEW */}
          {activeTab === 'addresses' && (
            <div className="border rounded-3xl p-6 shadow-xl relative backdrop-blur-md animate-in fade-in duration-300" style={{ backgroundColor: `${primaryColor}e8`, borderColor: `${accentColor}30` }}>
              <div className="pb-4 border-b border-slate-800/60 flex items-center gap-2">
                <Sparkles className="h-4 w-4" style={{ color: accentColor }} />
                <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: accentColor }}>Saved Addresses</h3>
              </div>

              {/* List of addresses */}
              <div className="space-y-3 mt-5">
                {addresses.length === 0 ? (
                  <p className="text-slate-500 font-semibold text-xs py-2">No saved addresses yet. Add one below!</p>
                ) : (
                  addresses.map((addr, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between gap-3 bg-slate-950/60 border border-slate-850 p-3.5 rounded-xl text-xs"
                    >
                      <span className="text-slate-250 font-semibold break-all">{addr}</span>
                      <button
                        type="button"
                        disabled={savingAddresses}
                        onClick={() => handleDeleteAddress(idx)}
                        className="text-red-400 hover:text-red-500 font-bold transition shrink-0 ml-2"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Map Container */}
              <div className="mt-5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pin Delivery Location</p>
                <div 
                  id="address-leaflet-map" 
                  className="w-full h-48 rounded-2xl border border-slate-800 bg-slate-950 relative overflow-hidden z-10"
                  style={{ minHeight: '180px' }}
                >
                  {!leafletLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 text-xs font-semibold text-slate-400">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white mr-2" />
                      Loading interactive map...
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-slate-500 mt-1.5 font-medium">
                  Drag the pin or click anywhere on the map to automatically fill and adjust your address.
                </p>
              </div>

              {/* Add new address input */}
              <form onSubmit={handleAddAddress} className="mt-6 pt-5 border-t border-slate-800/60 flex flex-col gap-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Enter new delivery address"
                      required
                      disabled={savingAddresses || geocoding}
                      value={newAddressInput}
                      onChange={(e) => setNewAddressInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-4 pr-10 text-xs font-bold text-slate-200 placeholder-slate-650 focus:outline-none focus:border-slate-750 disabled:opacity-50 transition"
                    />
                    <button
                      type="button"
                      title="Get Current Location"
                      disabled={geocoding || savingAddresses}
                      onClick={fetchCurrentLocation}
                      className="absolute right-3 top-3 text-slate-500 hover:text-white transition disabled:opacity-50"
                    >
                      {geocoding ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white" />
                      ) : (
                        <Compass className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={savingAddresses || geocoding || !newAddressInput.trim() || (zoneMessage?.type === 'error')}
                    className="px-5 rounded-xl text-xs font-black text-white transition hover:opacity-90 disabled:opacity-50 shrink-0"
                    style={{ backgroundColor: primaryColor ,color:accentColor}}
                  >
                    {savingAddresses ? '...' : 'Add'}
                  </button>
                </div>

                {validatingZone && (
                  <p className="text-[10px] text-slate-500 font-semibold animate-pulse">Validating delivery availability...</p>
                )}
                {zoneMessage && (
                  <p className={`text-[10px] font-bold flex items-center gap-1.5 ${
                    zoneMessage.type === 'success' ? 'text-emerald-450' : 'text-red-400'
                  }`}>
                    {zoneMessage.type === 'success' ? <Check className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                    <span>{zoneMessage.text}</span>
                  </p>
                )}
              </form>
            </div>
          )}
        </div>
      </div>

      {/* --- INLINE PAYMENT MODAL WRAPPER (STRIPE) --- */}
      {selectedOrderForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full relative shadow-2xl animate-in fade-in zoom-in-95 duration-250">
            
            <button
              onClick={() => setSelectedOrderForPay(null)}
              className="absolute right-4 top-4 p-1 rounded-xl text-slate-500 hover:text-white hover:bg-slate-850 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <CardIcon className="h-5 w-5" style={{ color: accentColor }} /> Safe Online Checkout
            </h3>
            <p className="text-slate-400 text-xs mt-1.5 mb-6">
              Complete your online payment securely via Stripe for order **{selectedOrderForPay.orderNumber}**.
            </p>

            {paymentLoading ? (
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-white mx-auto"></div>
                <p className="text-xs text-slate-450 mt-3 font-semibold">Initializing secure checkout session...</p>
              </div>
            ) : (
              stripePromise && paymentIntentSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret: paymentIntentSecret }}>
                  <OnlinePaymentForm
                    order={selectedOrderForPay}
                    clientSecret={paymentIntentSecret}
                    primaryColor={primaryColor}
                    accentColor={accentColor}
                    onClose={() => setSelectedOrderForPay(null)}
                    onSuccess={() => {
                      setSelectedOrderForPay(null);
                      // Refresh profile details and order list dynamically
                      fetchProfile();
                      alert('Payment completed successfully! Your order has been updated to Paid.');
                    }}
                  />
                </Elements>
              )
            )}
          </div>
        </div>
      )}
      {/* --- MOBILE SIDEBAR DRAWER OVERLAY --- */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-950/80 backdrop-blur-sm flex justify-start animate-in fade-in duration-200">
          <div className="w-72 h-full p-6 bg-slate-900 border-r border-slate-800 text-slate-100 shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-250">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <span className="font-extrabold text-sm uppercase tracking-wider text-slate-300">Diner Dashboard</span>
                <button 
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)} 
                  className="p-1 hover:opacity-85 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Sidebar Links inside mobile drawer */}
              <div className="space-y-2">
                {[
                  { key: 'home' as const, label: 'Home', icon: Home, isLink: true, href: `/order-online/${orgSlug}/menu` },
                  { key: 'orders' as const, label: 'Order Logs', icon: ShoppingBag },
                  { key: 'profile' as const, label: 'Profile Details', icon: User },
                  { key: 'change-password' as const, label: 'Change Password', icon: Lock },
                  { key: 'payments' as const, label: 'Payment History', icon: CreditCard },
                  { key: 'addresses' as const, label: 'Saved Addresses', icon: Compass },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;
                  if (item.isLink) {
                    return (
                      <Link
                        key={item.key}
                        href={item.href || '#'}
                        onClick={() => setMobileSidebarOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black transition-all duration-200 border-l-2 text-slate-400 hover:text-white hover:bg-slate-800/35 border-transparent"
                      >
                        <Icon className="h-4.5 w-4.5 text-slate-500" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.key as any);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black transition-all duration-200 border-l-2 ${
                        isActive
                          ? 'text-white border-solid bg-slate-850'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/35 border-transparent'
                      }`}
                      style={isActive ? { borderLeftColor: accentColor } : undefined}
                    >
                      <Icon className="h-4.5 w-4.5" style={isActive ? { color: accentColor } : undefined} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Logout at the bottom of drawer */}
            <button
              type="button"
              onClick={() => {
                setMobileSidebarOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-950/20 border border-red-900/15 py-3 text-xs font-bold text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
