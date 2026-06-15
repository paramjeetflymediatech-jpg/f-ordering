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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      
      <header className="border-b border-slate-900 bg-slate-950 px-6 py-4 flex items-center justify-between">
        <Link
          href={`/order-online/menu`}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Menu
        </Link>
        <h2 className="text-sm font-black text-white uppercase tracking-wider">
          {store.name}
        </h2>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-12">
        {!isSuccess ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white">Book a Table</h1>
              <p className="text-xs text-slate-400">
                Reserve your table instantly. Fill out your details below and submit your request.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+1 555-9876"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      placeholder="jane@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      Booking Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={reservationDate}
                      onChange={(e) => setReservationDate(e.target.value)}
                      className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-orange-500" />
                      Select Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={reservationTime}
                      onChange={(e) => setReservationTime(e.target.value)}
                      className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-orange-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-orange-500" />
                    Guest Count: {guestCount} Guests
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value))}
                    className="w-full mt-3 h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold px-1 mt-1">
                    <span>1 Guest</span>
                    <span>10 Guests</span>
                    <span>20 Guests</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-orange-500" />
                    Special Requests
                  </label>
                  <textarea
                    placeholder="e.g. High chair for toddler, silent corner..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white h-20 outline-none resize-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 py-3.5 text-sm font-extrabold text-white hover:from-orange-500 hover:to-amber-400 transition shadow-lg shadow-orange-600/20"
              >
                Request Table Reservation
              </button>
            </form>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl text-center space-y-6">
            <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto animate-bounce" />
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Booking Requested!</h2>
              <p className="text-xs text-slate-400">
                Your table reservation has been received and is currently in waitlist pending approval from the host.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-xs text-left font-semibold">
              <div className="flex justify-between text-slate-400">
                <span>Guest Name:</span>
                <span className="text-white font-bold">{customerName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Guests count:</span>
                <span className="text-white font-bold">{recentBooking.guestCount} Guests</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Booking Time:</span>
                <span className="text-white font-bold">
                  {new Date(recentBooking.reservationTime).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Status:</span>
                <span className="rounded bg-orange-950 px-2 py-0.5 text-[10px] text-orange-400 uppercase font-black">
                  {recentBooking.status}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/order-online/menu`}
                className="w-1/2 rounded-xl bg-orange-600 py-3 text-xs font-bold text-white hover:bg-orange-500 transition text-center"
              >
                Go to Menu
              </Link>
              <button
                onClick={() => setIsSuccess(false)}
                className="w-1/2 rounded-xl bg-slate-800 py-3 text-xs font-semibold text-slate-400 hover:bg-slate-700 transition"
              >
                New Reservation
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="py-6 border-t border-slate-900 bg-slate-950 text-center text-[10px] text-slate-500">
        <div className="flex justify-center gap-4 mb-2">
          <span>{store.name}</span>
          <span>•</span>
          <span>{store.phone}</span>
        </div>
        <p>© 2026 Powered by F-Ordering POS SaaS</p>
      </footer>

    </div>
  );
}
