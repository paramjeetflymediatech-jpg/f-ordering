'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Users,
  MessageSquare,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import RestaurantNavbar from '../../../../components/order-online/RestaurantNavbar';

export default function BookTablePage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;

  // Store information
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form inputs
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [reservationDate, setReservationDate] = useState('');
  const [reservationTime, setReservationTime] = useState('18:00');
  const [guestCount, setGuestCount] = useState(2);
  const [notes, setNotes] = useState('');

  // UI state
  const [isSuccess, setIsSuccess] = useState(false);
  const [recentBooking, setRecentBooking] = useState<any>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!orgSlug) return;

    const fetchStore = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/store?orgSlug=${orgSlug}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load store information.');
        }
        setStore(data.store);
      } catch (err: any) {
        setError(err.message || 'Error occurred while loading reservation form.');
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [orgSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (!customerName || !customerPhone) {
        alert('Please fill out all required fields.');
        return;
      }
      setStep(2);
      return;
    }

    try {
      const reservationTimeISO = new Date(`${reservationDate}T${reservationTime}`).toISOString();
      const payload = {
        storeId: store.id,
        customerName,
        customerPhone,
        customerEmail,
        reservationTime: reservationTimeISO,
        guestCount,
        notes,
      };

      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setRecentBooking(data.reservation);
        setIsSuccess(true);
      } else {
        alert(data.error || 'Failed to request table reservation.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while booking table.');
    }
  };

  const primaryColor = store?.theme_primary_color || '#2A0E07';
  const accentColor = store?.theme_accent_color || '#C39A3C';
  const bgColor = store?.theme_bg_color || '#F9F6F0';
  const fontStyle = store?.theme_font || 'sans';

  const getFontFamily = () => {
    switch (fontStyle) {
      case 'serif':
        return 'Georgia, ui-serif, serif';
      case 'sans':
        return 'ui-sans-serif, system-ui, sans-serif';
      case 'playfair':
        return '"Playfair Display", Georgia, serif';
      default:
        return 'Poppins, Georgia, ui-serif, serif';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-400 font-semibold tracking-wider">Loading Booking Calendar...</p>
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
          {error || 'Unable to open reservation form for this restaurant branch.'}
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

  return (
    <div className="relative min-h-screen flex flex-col justify-between font-sans transition-colors duration-350 bg-cover bg-center"
      style={{
        backgroundColor: store?.bg_color_book || bgColor,
        backgroundImage: store?.bg_book 
          ? `url(${store.bg_book})` 
          : store?.bg_color_book 
            ? 'none' 
            : store?.banner 
              ? `url(${store.banner})` 
              : "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        fontFamily: getFontFamily(),
        color: primaryColor,
      }}
    >
      <RestaurantNavbar orgSlug={orgSlug} />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />


      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-12 flex flex-col justify-center relative z-10">
        {!isSuccess ? (
          <div
            className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl space-y-6"
            style={{ borderColor: `${primaryColor}1a` }}
          >
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-black" style={{ color: primaryColor }}>Book a Table</h1>
                <span className="text-[14px] font-black uppercase px-2.5 py-1 rounded-full" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
                  Step {step} of 2
                </span>
              </div>
              <p className="text-xs text-white">
                {step === 1
                  ? 'Enter your contact details to start your booking.'
                  : 'Select your preferred date, time and details.'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-white uppercase tracking-wider">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-450 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-white uppercase tracking-wider">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+1 555-9876"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-450 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white uppercase tracking-wider">Email Address</label>
                      <input
                        type="email"
                        placeholder="jane@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-450 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-6 rounded-xl py-3.5 text-sm font-extrabold text-white transition shadow-lg"
                    style={{
                      backgroundColor: primaryColor,
                      boxShadow: `0 4px 14px 0 ${primaryColor}22`
                    }}
                  >
                    Next: Choose Date & Time
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <Calendar className="h-5 w-5 " style={{ color: accentColor }} />
                        Booking Date *
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={reservationDate}
                        onChange={(e) => setReservationDate(e.target.value)}
                        className="w-full mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-450 transition"
                      />
                    </div>
                    <div>
                      <label
                        className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <Clock className="h-4 w-4" style={{ color: accentColor }} />
                        Select Time *
                      </label>
                      <input
                        type="time"
                        required
                        value={reservationTime}
                        onChange={(e) => setReservationTime(e.target.value)}
                        className="w-full mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-450 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="h-4 w-4" style={{ color: accentColor }} />
                      Guest Count: {guestCount} Guests
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={guestCount}
                      onChange={(e) => setGuestCount(parseInt(e.target.value))}
                      className="w-full mt-3 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: accentColor }}
                    />
                    <div className="flex justify-between text-[10px] text-white font-bold px-1 mt-1">
                      <span>1 Guest</span>
                      <span>10 Guests</span>
                      <span>20 Guests</span>
                    </div>
                  </div>

                  <div>
                    <label
                      className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <MessageSquare className="h-4 w-4" style={{ color: accentColor }} />
                      Special Requests
                    </label>
                    <textarea
                      placeholder="e.g. High chair for toddler, silent corner..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-800 h-20 outline-none resize-none focus:border-slate-450 transition"
                    />
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className={`w-1/3 rounded-xl border py-3.5 text-sm font-semibold  transition text-white  `}
                      style={{ borderColor: `${primaryColor}` }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 rounded-xl py-3.5 text-sm font-extrabold text-white  transition shadow-lg"
                      style={{
                        backgroundColor: primaryColor,
                        boxShadow: `0 4px 14px 0 ${primaryColor}22`
                      }}
                    >
                      Book Table
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        ) : (
          <div
            className="rounded-2xl border bg-white p-8 shadow-2xl text-center space-y-6"
            style={{ borderColor: `${primaryColor}1a` }}
          >
            <CheckCircle className="h-16 w-16 mx-auto animate-bounce" style={{ color: accentColor }} />

            <div className="space-y-2">
              <h2 className="text-2xl font-black" style={{ color: primaryColor }}>Booking Requested!</h2>
              <p className="text-xs text-slate-500">
                Your table reservation has been received and is currently in waitlist pending approval from the host.
              </p>
            </div>

            <div
              className="bg-slate-50 border rounded-xl p-4 space-y-3 text-xs text-left font-semibold text-slate-700"
              style={{ borderColor: `${primaryColor}1a` }}
            >
              <div className="flex justify-between">
                <span>Guest Name:</span>
                <span className="font-bold text-slate-900">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Guests count:</span>
                <span className="font-bold text-slate-900">{recentBooking.guestCount} Guests</span>
              </div>
              <div className="flex justify-between">
                <span>Booking Time:</span>
                <span className="font-bold text-slate-900">
                  {new Date(recentBooking.reservationTime).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Status:</span>
                <span
                  className="rounded px-2 py-0.5 text-[10px] uppercase font-black"
                  style={{ backgroundColor: `${accentColor}1a`, color: accentColor }}
                >
                  {recentBooking.status}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/menu`}
                className="w-1/2 rounded-xl py-3 text-xs font-bold text-white hover:opacity-90 transition text-center"
                style={{ backgroundColor: primaryColor }}
              >
                Go to Menu
              </Link>
              <button
                onClick={() => setIsSuccess(false)}
                className="w-1/2 rounded-xl border py-3 text-xs font-semibold hover:bg-slate-50 transition text-slate-600"
                style={{ borderColor: `${primaryColor}20` }}
              >
                New Reservation
              </button>
            </div>
          </div>
        )}
      </main>

      <footer
        className="py-6 border-t text-center text-[14px] text-black flex flex-col justify-center gap-3"
        style={{ borderColor: `${primaryColor}1a`, backgroundColor:"white" }}
      >
        <div className=' '>
          <p>© {new Date().getFullYear()} {store?.Organization?.name || store?.name || 'Restaurant'}. Powered by Ordering System.</p>

          <div className="flex justify-center gap-3 mt-2 text-[14px] font-semibold text-black">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:underline">Terms & Conditions</a>
          </div></div>
      </footer>

    </div>
  );
}
