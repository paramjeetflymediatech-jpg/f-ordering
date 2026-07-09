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
  Lock,
  Eye,
  Star,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download
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

const getDeliveryAddressFromOrder = (order: any) => {
  const itemWithAddress = order.items?.find((item: any) => item.notes?.startsWith('Delivery Address:'));
  if (itemWithAddress) {
    const match = itemWithAddress.notes.match(/^Delivery Address:\s*([^|]+)/);
    return match ? match[1].trim() : '';
  }
  return '';
};

const getCustomerNotesFromOrder = (order: any) => {
  const itemWithAddress = order.items?.find((item: any) => item.notes?.startsWith('Delivery Address:'));
  if (itemWithAddress) {
    const match = itemWithAddress.notes.match(/\|\s*Notes:\s*(.+)$/);
    return match ? match[1].trim() : '';
  }
  const regularItemWithNotes = order.items?.find((item: any) => item.notes && !item.notes.startsWith('Delivery Address:'));
  return regularItemWithNotes ? regularItemWithNotes.notes : '';
};

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

  // Order Details Modal State
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<any>(null);

  // Order Rating States
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [submittingRating, setSubmittingRating] = useState<boolean>(false);

  // Mobile Dropdown State
  const [activeDropdownOrderId, setActiveDropdownOrderId] = useState<string | null>(null);

  // Payment History Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Order History Pagination States
  const [currentOrderPage, setCurrentOrderPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(5);

  const handleDownloadReceipt = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download/print receipt');
      return;
    }

    const storeName = store?.name || 'Restaurant';
    const storeLogo = store?.Organization?.logo || '';
    const currencySymbol = store?.currency === 'inr' ? '₹' : '$';
    const isPaid = order.payments?.some((p: any) => p.transaction_status === 'success');

    const itemsHtml = order.items?.map((item: any) => {
      const itemTotal = item.price * item.quantity;
      let detailsText = '';
      if (item.variant) {
        detailsText += `<div>Variant: ${item.variant.name} (+${currencySymbol}${item.variant.additionalPrice.toFixed(2)})</div>`;
      }
      if (item.addons && item.addons.length > 0) {
        detailsText += `<div>Addons: ${item.addons.map((a: any) => `${a.name} (+${currencySymbol}${parseFloat(a.price || 0).toFixed(2)})`).join(', ')}</div>`;
      }
      if (item.bases && item.bases.length > 0) {
        detailsText += `<div>Option: ${item.bases.map((b: any) => `${b.name} (+${currencySymbol}${parseFloat(b.price || 0).toFixed(2)})`).join(', ')}</div>`;
      }
      if (item.notes && !item.notes.startsWith('Delivery Address:')) {
        detailsText += `<div style="font-style: italic; color: #666;">Note: "${item.notes}"</div>`;
      }

      return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; vertical-align: top;">
            <div style="font-weight: bold; color: #1e293b;">${item.name}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${detailsText}</div>
          </td>
          <td style="padding: 10px 0; text-align: center; color: #475569; vertical-align: top;">${item.quantity}</td>
          <td style="padding: 10px 0; text-align: right; color: #475569; vertical-align: top;">${currencySymbol}${item.price.toFixed(2)}</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #0f172a; vertical-align: top;">${currencySymbol}${itemTotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - Order #${order.orderNumber || order.id.slice(0, 8)}</title>
          <style>
            body { font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 30px; color: #1e293b; max-width: 480px; margin: 0 auto; background-color: #ffffff; }
            .header { text-align: center; margin-bottom: 25px; }
            .logo { max-height: 50px; margin-bottom: 10px; }
            .store-name { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
            .divider { border-top: 1px dashed #cbd5e1; margin: 20px 0; }
            .meta-info { font-size: 12px; color: #475569; line-height: 1.6; }
            .meta-row { display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            th { text-align: left; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; color: #64748b; font-weight: bold; font-size: 11px; text-transform: uppercase; }
            .summary { margin-top: 20px; font-size: 13px; }
            .summary-row { display: flex; justify-content: space-between; padding: 4px 0; color: #475569; }
            .total-row { border-top: 2px solid #0f172a; margin-top: 10px; padding-top: 10px; font-weight: 800; font-size: 16px; color: #0f172a; }
            .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #94a3b8; }
            @media print {
              body { padding: 15px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${storeLogo ? `<img class="logo" src="${storeLogo}" alt="Logo" />` : ''}
            <h1 class="store-name">${storeName}</h1>
            <p style="font-size: 11px; color: #64748b; margin: 5px 0 0 0;">ORDER RECEIPT</p>
          </div>
          
          <div class="meta-info">
            <div class="meta-row"><strong>Order ID:</strong> <span>#${order.orderNumber || order.id}</span></div>
            <div class="meta-row"><strong>Date:</strong> <span>${new Date(order.createdAt).toLocaleString()}</span></div>
            <div class="meta-row"><strong>Fulfillment:</strong> <span style="text-transform: uppercase;">${order.orderType.replace('_', ' ')}</span></div>
            <div class="meta-row"><strong>Status:</strong> <span>${isPaid ? 'PAID' : 'UNPAID'}</span></div>
          </div>

          <div class="divider"></div>

          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Item</th>
                <th style="text-align: center; width: 10%;">Qty</th>
                <th style="text-align: right; width: 20%;">Price</th>
                <th style="text-align: right; width: 20%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="divider"></div>

          <div class="summary">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>${currencySymbol}${order.subtotal.toFixed(2)}</span>
            </div>
            ${order.taxAmount > 0 ? `
              <div class="summary-row">
                <span>Tax</span>
                <span>${currencySymbol}${order.taxAmount.toFixed(2)}</span>
              </div>
            ` : ''}
            ${order.discountAmount > 0 ? `
              <div class="summary-row" style="color: #ef4444;">
                <span>Discount</span>
                <span>-${currencySymbol}${order.discountAmount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="summary-row total-row">
              <span>Total Amount</span>
              <span>${currencySymbol}${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for ordering with us!</p>
            <p style="font-size: 9px; margin-top: 5px; color: #cbd5e1;">Generated on ${new Date().toLocaleDateString()}</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  useEffect(() => {
    setCurrentPage(1);
    setCurrentOrderPage(1);
  }, [activeTab]);
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

  // Click outside to close dropdowns
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveDropdownOrderId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

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

  const handleDeleteOrderAction = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this order from your logs? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/public/customer/orders/${orderId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Order deleted successfully.');
        fetchProfile();
      } else {
        alert(data.error || 'Failed to delete order.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error deleting order.');
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForRating || submittingRating) return;

    setSubmittingRating(true);
    try {
      const res = await fetch(`/api/public/customer/orders/${selectedOrderForRating.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: ratingValue,
          comment: ratingComment,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Thank you for your rating!');
        setSelectedOrderForRating(null);
        fetchProfile();
      } else {
        alert(data.error || 'Failed to submit rating.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error submitting rating.');
    } finally {
      setSubmittingRating(false);
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
          currency: store?.currency || 'aud',
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

  const totalPages = Math.ceil(paymentsList.length / itemsPerPage);
  const paginatedPayments = paymentsList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalOrderPages = Math.ceil(orders.length / ordersPerPage);
  const paginatedOrders = orders.slice(
    (currentOrderPage - 1) * ordersPerPage,
    currentOrderPage * ordersPerPage
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
                <>
                  {paginatedOrders.map((order) => {
                  const isPaid = order.payments?.some((p: any) => p.transaction_status === 'success');
                  const canPayOnline = !isPaid && order.status !== 'cancelled';

                  return (
                    <div
                      key={order.id}
                      className="border rounded-3xl p-6 shadow-sm space-y-5 backdrop-blur-sm relative"
                      style={{ backgroundColor: `${primaryColor}e8`, borderColor: `${accentColor}30` }}
                    >
                      {/* Mobile Three-Dots Actions Menu */}
                      <div className="absolute top-5 right-5 sm:hidden z-20" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownOrderId(activeDropdownOrderId === order.id ? null : order.id);
                          }}
                          className="p-2.5 rounded-xl border border-slate-800 hover:bg-slate-800/40 text-slate-400 hover:text-white transition shadow-md bg-slate-950/40"
                          title="Order Actions"
                        >
                          <MoreVertical className="h-4.5 w-4.5" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeDropdownOrderId === order.id && (
                          <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-150 z-30">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrderForDetails(order);
                                setActiveDropdownOrderId(null);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-slate-800/50 text-xs font-semibold text-slate-200 transition flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" style={{ color: accentColor }} /> View Details
                            </button>

                            {order.status === 'completed' && !order.rating && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrderForRating(order);
                                  setRatingValue(5);
                                  setRatingComment('');
                                  setActiveDropdownOrderId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-800/50 text-xs font-semibold text-slate-200 transition flex items-center gap-2"
                              >
                                <Star className="h-4 w-4 text-amber-400" /> Rate Order
                              </button>
                            )}

                            {canPayOnline && (
                              <button
                                type="button"
                                onClick={() => {
                                  initPayment(order);
                                  setActiveDropdownOrderId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-800/50 text-xs font-semibold text-slate-200 transition flex items-center gap-2"
                              >
                                <CardIcon className="h-4 w-4" style={{ color: accentColor }} /> Pay Online
                              </button>
                            )}

                            <div className="h-px bg-slate-800/60 my-1" />

                            <button
                              type="button"
                              onClick={() => {
                                handleDeleteOrderAction(order.id);
                                setActiveDropdownOrderId(null);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-red-950/20 text-xs font-semibold text-red-400 transition flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" /> Delete Order
                            </button>
                          </div>
                        )}
                      </div>
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
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Thumbnail */}
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="h-10 w-10 rounded-xl object-cover shrink-0"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-extrabold flex items-center justify-center shrink-0">
                                    {item.name?.charAt(0).toUpperCase()}
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <p className="font-extrabold text-white truncate">
                                    {item.name}
                                  </p>
                                  {item.addons && item.addons.length > 0 && (
                                    <p className="text-[10px] text-slate-450 mt-0.5 truncate">
                                      Addons: {item.addons.map((a: any) => a.name).join(', ')}
                                    </p>
                                  )}
                                  {item.notes && !item.notes.startsWith('Delivery Address:') && (
                                    <p className="text-[10px] text-amber-400/90 mt-0.5 italic truncate font-medium">
                                      Note: "{item.notes}"
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className="font-black text-slate-350 text-right shrink-0 ml-3">
                                {item.quantity}x @ ${parseFloat(item.unit_price || item.price || 0).toFixed(2)}
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

                      {/* Action Bar (Desktop only) */}
                      <div className="pt-4 border-t border-slate-800/40 sm:flex hidden flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForDetails(order)}
                            className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950/80 shadow-md"
                          >
                            <Eye className="h-4 w-4" style={{ color: accentColor }} /> View Details
                          </button>

                          {/* Rating display or trigger */}
                          {order.rating ? (
                            <div className="flex items-center gap-1 px-3 py-2 bg-slate-950/30 border border-slate-850 rounded-xl text-xs text-slate-400 font-bold">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                              <span>{order.rating}/5 Rated</span>
                            </div>
                          ) : (
                            order.status === 'completed' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrderForRating(order);
                                  setRatingValue(5);
                                  setRatingComment('');
                                }}
                                className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-950/80 shadow-md animate-pulse"
                              >
                                <Star className="h-4 w-4 text-amber-450" /> Rate Order
                              </button>
                            )
                          )}
                        </div>

                        {/* Delete Order option */}
                        <button
                          type="button"
                          onClick={() => handleDeleteOrderAction(order.id)}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-350 transition bg-red-950/10 border border-red-900/20 hover:border-red-900/40 hover:bg-red-950/20 shadow-md ml-auto"
                        >
                          <Trash2 className="h-4 w-4" /> Delete Order
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Order Pagination controls */}
                {orders.length > 0 && (
                  <div className="px-6 py-4 border rounded-3xl border-slate-800/60 bg-[#0c1220]/90 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-400">
                    <div className="text-[11px] text-slate-550 text-center sm:text-left">
                      Showing <span className="text-slate-300">{orders.length === 0 ? 0 : (currentOrderPage - 1) * ordersPerPage + 1}</span> to{' '}
                      <span className="text-slate-300">{Math.min(currentOrderPage * ordersPerPage, orders.length)}</span> of{' '}
                      <span className="text-slate-300">{orders.length}</span> orders
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                      {/* Orders per page selector */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span>Show:</span>
                        <select
                          value={ordersPerPage}
                          onChange={(e) => {
                            setOrdersPerPage(Number(e.target.value));
                            setCurrentOrderPage(1);
                          }}
                          className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-1.5 py-1 text-[11px] font-bold outline-none cursor-pointer hover:border-slate-700 transition"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                        <span>entries</span>
                      </div>

                      {totalOrderPages > 1 && (
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setCurrentOrderPage(1)}
                            disabled={currentOrderPage === 1}
                            className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800/40 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-400 shrink-0"
                            title="First Page"
                          >
                            <ChevronsLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentOrderPage(currentOrderPage - 1)}
                            disabled={currentOrderPage === 1}
                            className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800/40 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-400 shrink-0"
                            title="Previous Page"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>

                          <span className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-black text-slate-200">
                            Page {currentOrderPage} of {totalOrderPages}
                          </span>

                          <button
                            type="button"
                            onClick={() => setCurrentOrderPage(currentOrderPage + 1)}
                            disabled={currentOrderPage === totalOrderPages}
                            className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800/40 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-400 shrink-0"
                            title="Next Page"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentOrderPage(totalOrderPages)}
                            disabled={currentOrderPage === totalOrderPages}
                            className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800/40 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-400 shrink-0"
                            title="Last Page"
                          >
                            <ChevronsRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

          {/* PAYMENT HISTORY VIEW */}
          {activeTab === 'payments' && (
            <div className="border rounded-3xl overflow-hidden shadow-xl backdrop-blur-md animate-in fade-in duration-300 flex flex-col justify-between min-h-[400px] bg-[#0c1220]/90 border-slate-800/60">
              {paymentsList.length === 0 ? (
                <div className="text-center py-20 text-slate-550 font-semibold flex-1 flex flex-col items-center justify-center">
                  <div className="h-16 w-16 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-center mb-4">
                    <CreditCard className="h-8 w-8 text-slate-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">No billing transactions or receipt records found</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[280px]">Your completed online and cash transaction receipts will appear here.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between">
                  {/* Desktop view (table) */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <th className="py-4 px-6">Date</th>
                          <th className="py-4 px-6">Order ID</th>
                          <th className="py-4 px-6">Payment Method</th>
                          <th className="py-4 px-6">Tx Reference</th>
                          <th className="py-4 px-6">Amount</th>
                          <th className="py-4 px-6 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-xs font-semibold">
                        {paginatedPayments.map((pay: any) => {
                          const isSuccess = pay.transaction_status === 'success';
                          const isPending = pay.transaction_status === 'pending';
                          return (
                            <tr key={pay.id} className="hover:bg-slate-850/20 transition duration-150">
                              <td className="py-4 px-6 text-slate-400 font-medium">
                                {new Date(pay.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                              </td>
                              <td className="py-4 px-6 font-extrabold text-white">
                                {pay.orderNumber}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                  pay.payment_method === 'card'
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                    : pay.payment_method === 'upi'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {pay.payment_method === 'card' ? '💳 Card' : pay.payment_method === 'upi' ? '⚡ UPI' : '💵 Cash'}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <span className="font-mono text-[10px] text-slate-400 bg-slate-900/60 px-2 py-1 rounded border border-slate-800/60 max-w-[140px] truncate block" title={pay.transaction_reference}>
                                  {pay.transaction_reference || 'N/A'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-sm font-black text-white">
                                ${parseFloat(pay.amount).toFixed(2)}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                  isSuccess
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : isPending
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {isSuccess ? 'Paid' : isPending ? 'Pending' : 'Failed'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile view (cards) */}
                  <div className="block sm:hidden divide-y divide-slate-800/40">
                    {paginatedPayments.map((pay: any) => {
                      const isSuccess = pay.transaction_status === 'success';
                      const isPending = pay.transaction_status === 'pending';
                      return (
                        <div key={pay.id} className="p-5 space-y-3.5 hover:bg-slate-850/10 transition duration-150">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-white text-xs">{pay.orderNumber}</span>
                            <span className="text-[10px] text-slate-500 font-bold">
                              {new Date(pay.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center text-xs">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                              pay.payment_method === 'card'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : pay.payment_method === 'upi'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {pay.payment_method === 'card' ? '💳 Card' : pay.payment_method === 'upi' ? '⚡ UPI' : '💵 Cash'}
                            </span>
                            <span className="font-mono text-[9px] text-slate-500 bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800/60 max-w-[120px] truncate">
                              {pay.transaction_reference || 'N/A'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-slate-800/20">
                            <span className="font-black text-white text-sm">${parseFloat(pay.amount).toFixed(2)}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                              isSuccess
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : isPending
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {isSuccess ? 'Paid' : isPending ? 'Pending' : 'Failed'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination controls */}
                  {paymentsList.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-400 bg-slate-950/20">
                      <div className="text-[11px] text-slate-500 text-center sm:text-left">
                        Showing <span className="text-slate-300">{paymentsList.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                        <span className="text-slate-300">{Math.min(currentPage * itemsPerPage, paymentsList.length)}</span> of{' '}
                        <span className="text-slate-300">{paymentsList.length}</span> transactions
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-4">
                        {/* Items per page selector */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span>Show:</span>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-1.5 py-1 text-[11px] font-bold outline-none cursor-pointer hover:border-slate-700 transition"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                          </select>
                          <span>entries</span>
                        </div>

                        {totalPages > 1 && (
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setCurrentPage(1)}
                              disabled={currentPage === 1}
                              className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800/40 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-400 shrink-0"
                              title="First Page"
                            >
                              <ChevronsLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCurrentPage(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800/40 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-400 shrink-0"
                              title="Previous Page"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>

                            <span className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-black text-slate-200">
                              Page {currentPage} of {totalPages}
                            </span>

                            <button
                              type="button"
                              onClick={() => setCurrentPage(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800/40 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-400 shrink-0"
                              title="Next Page"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCurrentPage(totalPages)}
                              disabled={currentPage === totalPages}
                              className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800/40 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-400 shrink-0"
                              title="Last Page"
                            >
                              <ChevronsRight className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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

      {/* --- ORDER DETAILS MODAL (POPUP) --- */}
      {selectedOrderForDetails && (() => {
        const order = selectedOrderForDetails;
        const isPaid = order.payments?.some((p: any) => p.transaction_status === 'success');
        const paymentMethodName = order.payments?.[0]?.payment_method || 'Cash';
        const deliveryAddress = getDeliveryAddressFromOrder(order);
        const customerNotes = getCustomerNotesFromOrder(order);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto relative shadow-2xl animate-in zoom-in-95 duration-250 text-xs">
              
              <button
                onClick={() => setSelectedOrderForDetails(null)}
                className="absolute right-4 top-4 p-1 rounded-xl text-slate-500 hover:text-white hover:bg-slate-855 transition animate-in fade-in duration-100"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="pb-4 border-b border-slate-800/60">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-base font-black text-white">Order Details</h3>
                  <span className="text-slate-400 font-mono">#{order.orderNumber}</span>
                  {getOrderStatusPill(order.status)}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  Plated on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* 2x2 Grid for Order Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-800/40">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">Customer & Account</p>
                  <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-3 space-y-1.5">
                    <p className="font-bold text-slate-200">{customer.name}</p>
                    <p className="text-slate-400 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" /> {customer.phone}</p>
                    {customer.email && <p className="text-slate-400 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 shrink-0" /> {customer.email}</p>}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">Fulfillment & Payment</p>
                  <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-3 space-y-1.5">
                    <p className="font-semibold text-slate-300">
                      Mode: <span className="uppercase text-[10px] font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-slate-900 border border-white/5" style={{ color: accentColor }}>{order.orderType.replace('_', ' ')}</span>
                    </p>
                    <p className="font-semibold text-slate-300">
                      Status: <span className={`text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${isPaid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>{isPaid ? 'Paid' : 'Unpaid'}</span>
                    </p>
                    <p className="text-slate-400">Method: <span className="uppercase text-[10px] font-black">{paymentMethodName}</span></p>
                  </div>
                </div>
              </div>

              {/* Delivery Address & Notes */}
              {(deliveryAddress || customerNotes) && (
                <div className="py-5 border-b border-slate-800/40 space-y-3">
                  {deliveryAddress && (
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Delivery Address</p>
                      <p className="text-slate-300 bg-slate-950/20 border border-slate-850 p-3 rounded-xl">{deliveryAddress}</p>
                    </div>
                  )}
                  {customerNotes && (
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Diner Notes</p>
                      <p className="text-slate-300 bg-slate-950/20 border border-slate-850 p-3 rounded-xl italic">"{customerNotes}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Items List */}
              <div className="py-5">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Itemized Receipt</p>
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/20">
                  <div className="divide-y divide-slate-850">
                    {order.items?.map((item: any) => {
                      const itemTotal = item.price * item.quantity;
                      return (
                        <div key={item.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-slate-850/10 transition">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Thumbnail */}
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="h-12 w-12 rounded-xl object-cover shrink-0"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-xl bg-slate-950 border border-slate-850 text-slate-400 font-extrabold flex items-center justify-center shrink-0">
                                {item.name?.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-200">{item.name}</p>
                              
                              {/* Variant details */}
                              {item.variant && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Variant: {item.variant.name} (+${item.variant.additionalPrice.toFixed(2)})
                                </p>
                              )}

                              {/* Addons details */}
                              {item.addons && item.addons.length > 0 && (
                                <p className="text-[10px] text-slate-450 mt-0.5">
                                  Addons: {item.addons.map((a: any) => `${a.name} (+$${parseFloat(a.price || 0).toFixed(2)})`).join(', ')}
                                </p>
                              )}

                              {/* Bases details */}
                              {item.bases && item.bases.length > 0 && (
                                <p className="text-[10px] text-slate-450 mt-0.5">
                                  Option: {item.bases.map((b: any) => `${b.name} (+$${parseFloat(b.price || 0).toFixed(2)})`).join(', ')}
                                </p>
                              )}

                              {/* Item-specific notes (filtered of delivery address) */}
                              {item.notes && !item.notes.startsWith('Delivery Address:') && (
                                <p className="text-[10px] text-amber-400/90 mt-1 italic">
                                  Note: "{item.notes}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5">
                            <span className="text-slate-400 font-medium">{item.quantity} x ${item.price.toFixed(2)}</span>
                            <span className="font-black text-white">${itemTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Breakdown */}
                  <div className="bg-slate-950/60 p-4 border-t border-slate-800 space-y-2 text-right">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-300">${order.subtotal.toFixed(2)}</span>
                    </div>
                    {order.taxAmount > 0 && (
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Tax</span>
                        <span className="font-semibold text-slate-300">${order.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {order.discountAmount > 0 && (
                      <div className="flex justify-between items-center text-red-400">
                        <span>Discount</span>
                        <span className="font-semibold">${order.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm font-black text-white pt-1 border-t border-slate-800">
                      <span>Total Amount</span>
                      <span className="text-base" style={{ color: accentColor }}>${order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDownloadReceipt(order)}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white transition hover:opacity-90 shadow-md flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500"
                >
                  <Download className="h-3.5 w-3.5" /> Download Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForDetails(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white transition hover:opacity-90 shadow-md bg-slate-800 hover:bg-slate-700"
                >
                  Close Receipt
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* --- RATING MODAL (POPUP) --- */}
      {selectedOrderForRating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <form onSubmit={handleSubmitRating} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full relative shadow-2xl animate-in zoom-in-95 duration-250 text-xs">
            
            <button
              type="button"
              onClick={() => setSelectedOrderForRating(null)}
              className="absolute right-4 top-4 p-1 rounded-xl text-slate-500 hover:text-white hover:bg-slate-850 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400" /> Rate Your Meal
            </h3>
            <p className="text-slate-400 text-xs mt-1.5 mb-6">
              Let us know how your food was for order **{selectedOrderForRating.orderNumber}**! Your feedback helps us improve.
            </p>

            {/* Stars selection */}
            <div className="space-y-2 mb-5">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingValue(star)}
                    className="p-1 hover:scale-110 transition shrink-0"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= ratingValue ? 'fill-amber-400 text-amber-400' : 'text-slate-650'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment block */}
            <div className="space-y-2 mb-6">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Comment (Optional)</label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Share details of your experience..."
                rows={3}
                disabled={submittingRating}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-slate-700 disabled:opacity-50 transition resize-none font-medium"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrderForRating(null)}
                disabled={submittingRating}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingRating}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg transition disabled:opacity-60"
                style={{ backgroundColor: accentColor }}
              >
                {submittingRating ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Feedback
                  </>
                )}
              </button>
            </div>

          </form>
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
