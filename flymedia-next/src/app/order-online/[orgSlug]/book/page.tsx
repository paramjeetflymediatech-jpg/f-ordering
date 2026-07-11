'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [tables, setTables] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form inputs
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [reservationDate, setReservationDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [guestCount, setGuestCount] = useState(2);

  // UI state
  const [isSuccess, setIsSuccess] = useState(false);
  const [recentBooking, setRecentBooking] = useState<any>(null);
  const [step, setStep] = useState(1);

  // New Booking Charge & Category/Offer States
  const [bookingChargeValue, setBookingChargeValue] = useState(0);
  const [slotCategory, setSlotCategory] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [payProcessing, setPayProcessing] = useState(false);
  const [cardNo, setCardNo] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Refs for scrolling into view
  const tableGridRef = useRef<HTMLDivElement | null>(null);
  const checkoutSectionRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to table selection when Date & Slot are chosen
  useEffect(() => {
    if (reservationDate && selectedSlot) {
      setTimeout(() => {
        tableGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [reservationDate, selectedSlot]);

  // Auto-scroll to checkout/deposit form when Table is selected
  useEffect(() => {
    if (selectedTableId) {
      setTimeout(() => {
        checkoutSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedTableId]);

  const fetchReservationsForDate = async (targetDate: string, storeId: string) => {
    if (!storeId || !targetDate) return;
    try {
      const res = await fetch(`/api/public/bookings?storeId=${storeId}&date=${targetDate}`);
      const data = await res.json();
      if (data.success) {
        setReservations(data.reservations || []);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
  };

  const handleDateChange = (newDate: string) => {
    setReservationDate(newDate);
    setSelectedSlot(null);
    setSelectedTableId(null);
    if (store?.id) {
      fetchReservationsForDate(newDate, store.id);
    }
  };

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
        setTables(data.tables || []);

        // Pre-fill fields if customer is logged in
        try {
          const profileRes = await fetch('/api/public/customer/me');
          const profileData = await profileRes.json();
          if (profileData && profileData.success && profileData.customer) {
            setCustomerName(profileData.customer.name || '');
            setCustomerPhone(profileData.customer.phone || '');
            setCustomerEmail(profileData.customer.email || '');
          }
        } catch (_) {}

        // Fetch payment configuration for booking charge
        try {
          const payRes = await fetch(`/api/public/stripe/config?storeId=${data.store.id}`);
          const payData = await payRes.json();
          if (payData && payData.bookingCharge) {
            setBookingChargeValue(parseFloat(payData.bookingCharge));
          }
        } catch (e) {
          console.error('Failed to load booking charge config', e);
        }

      } catch (err: any) {
        setError(err.message || 'Error occurred while loading reservation form.');
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [orgSlug]);

  const getAvailableSlots = () => {
    const allSlots = new Set<string>();
    tables.forEach((t) => {
      if (t.booking_slots && Array.isArray(t.booking_slots)) {
        t.booking_slots.forEach((s: any) => {
          if (typeof s === 'string') {
            allSlots.add(s);
          } else if (s && s.time) {
            allSlots.add(s.time);
          }
        });
      }
    });
    if (allSlots.size === 0) {
      return [
        '10:00 AM - 12:00 PM',
        '12:00 PM - 02:00 PM',
        '02:00 PM - 04:00 PM',
        '04:00 PM - 06:00 PM',
        '06:00 PM - 08:00 PM',
        '08:00 PM - 10:00 PM',
        '10:00 PM - 12:00 AM'
      ];
    }
    return Array.from(allSlots);
  };

  const getSlotCategory = (slotStr: string): 'breakfast' | 'lunch' | 'dinner' => {
    try {
      const startPart = slotStr.split('-')[0].trim(); // e.g. "06:00 PM"
      const [time, ampm] = startPart.split(' ');
      let [hours] = time.split(':').map(Number);
      if (ampm && ampm.toUpperCase() === 'PM' && hours < 12) {
        hours += 12;
      }
      if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
      if (hours < 12) return 'breakfast';
      if (hours < 17) return 'lunch';
      return 'dinner';
    } catch (e) {
      return 'dinner';
    }
  };

  const getSlotOffer = (slotStr: string) => {
    // Check if table has a specific offer configured for this slot time
    const selTable = tables.find(t => t.id === selectedTableId);
    if (selTable && selTable.booking_slots && Array.isArray(selTable.booking_slots)) {
      const match = selTable.booking_slots.find((s: any) => {
        if (typeof s === 'string') return s === slotStr;
        return s && s.time === slotStr;
      });
      if (match && typeof match !== 'string' && match.offer) {
        return { code: 'SLOT_DEAL', text: match.offer };
      }
    }

    const cat = getSlotCategory(slotStr);
    switch (cat) {
      case 'breakfast':
        return { code: 'BREAKFAST15', text: '15% Off Food Bill' };
      case 'lunch':
        return { code: 'LUNCHCOMBO', text: 'Free Beverage with Main' };
      case 'dinner':
      default:
        return { code: 'DINNERSPECIAL', text: '10% Off & Free Dessert' };
    }
  };

  // Set default slot category
  useEffect(() => {
    if (tables.length > 0) {
      const available = getAvailableSlots();
      const firstAvailableCat = available.map(getSlotCategory).find(cat => cat);
      if (firstAvailableCat) {
        setSlotCategory(firstAvailableCat);
      }
    }
  }, [tables]);

  const getNextSevenDays = () => {
    const days = [];
    const options: Intl.DateTimeFormatOptions = { weekday: 'short' };
    const monthOptions: Intl.DateTimeFormatOptions = { month: 'short' };
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const formattedString = `${yyyy}-${mm}-${dd}`;
      
      days.push({
        dateString: formattedString,
        dayName: date.toLocaleDateString('en-US', options),
        dayNum: date.getDate(),
        monthName: date.toLocaleDateString('en-US', monthOptions),
      });
    }
    return days;
  };

  const getSlotStartTime24h = (slotStr: string) => {
    try {
      const startPart = slotStr.split('-')[0].trim(); // e.g. "06:00 PM"
      const [time, ampm] = startPart.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (ampm && ampm.toUpperCase() === 'PM' && hours < 12) {
        hours += 12;
      }
      if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } catch (e) {
      return '18:00';
    }
  };

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

    if (!reservationDate || !selectedSlot || !selectedTableId) {
      alert('Please select date, time slot, and table.');
      return;
    }

    if (bookingChargeValue > 0) {
      if (!cardNo || !cardExpiry || !cardCvc) {
        alert('Please fill out your card payment details for the booking deposit.');
        return;
      }
    }

    try {
      if (bookingChargeValue > 0) {
        setPayProcessing(true);
        // Simulate credit card authorization delay
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setPayProcessing(false);
      }

      const timePart = getSlotStartTime24h(selectedSlot);
      const reservationTimeLocal = `${reservationDate}T${timePart}`;
      const selTable = tables.find((t) => t.id === selectedTableId);
      const offer = selectedSlot ? getSlotOffer(selectedSlot) : null;

      const payload = {
        storeId: store.id,
        customerName,
        customerPhone,
        customerEmail,
        reservationTime: reservationTimeLocal,
        bookingSlot: selectedSlot,
        tableId: selectedTableId,
        guestCount: guestCount,
        notes,
        bookingChargePaid: bookingChargeValue > 0 ? bookingChargeValue : 0.00,
        appliedOffer: offer ? `${offer.code} (${offer.text})` : null,
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
      setPayProcessing(false);
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
                <h1 className="text-2xl font-black" style={{ color: accentColor }}>Book a Table</h1>
                <span className="text-[14px] font-black uppercase px-2.5 py-1 rounded-full" style={{ backgroundColor: `${primaryColor}`, color: accentColor }}>
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

                  <div>
                    <label className="text-xs font-semibold text-white uppercase tracking-wider">Number of Guests *</label>
                    <select
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      className="w-full mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-450 transition font-bold"
                    >
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Guest' : 'Guests'}
                        </option>
                      ))}
                    </select>
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
                <div className="space-y-6">
                  {/* Date Selection (7-Day Carousel) */}
                  <div>
                    <label className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                      <Calendar className="h-5 w-5" style={{ color: accentColor }} />
                      Select Booking Date *
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
                      {getNextSevenDays().map((day) => {
                        const isSelected = reservationDate === day.dateString;
                        return (
                          <button
                            key={day.dateString}
                            type="button"
                            onClick={() => handleDateChange(day.dateString)}
                            className={`flex flex-col items-center justify-center min-w-[72px] h-20 rounded-2xl border transition-all duration-200 snap-center shrink-0 ${
                              isSelected
                                ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-950/20 scale-[1.03]'
                                : 'bg-white/10 border-white/20 text-white hover:bg-white/15'
                            }`}
                          >
                            <span className="text-[10px] uppercase font-mono tracking-widest opacity-85">{day.dayName}</span>
                            <span className="text-2xl font-black mt-0.5 leading-none">{day.dayNum}</span>
                            <span className="text-[9px] uppercase font-bold tracking-wider mt-1 opacity-70">{day.monthName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Slot selection (Only visible if Date is selected) */}
                  {reservationDate && (
                    <div className="space-y-4 animate-in fade-in duration-250">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="h-4 w-4" style={{ color: accentColor }} />
                          Select Booking Slot *
                        </label>
                      </div>

                      {/* Breakfast / Lunch / Dinner Category Tabs */}
                      <div className="flex p-1 bg-black/30 border border-white/10 rounded-xl">
                        {(['breakfast', 'lunch', 'dinner'] as const).map((cat) => {
                          const isActive = slotCategory === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setSlotCategory(cat);
                                setSelectedSlot(null);
                                setSelectedTableId(null);
                              }}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                                isActive
                                  ? 'bg-orange-600 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>

                      {/* Slots filtered by selected category */}
                      {(() => {
                        const filteredSlots = getAvailableSlots().filter(
                          (slot) => getSlotCategory(slot) === slotCategory
                        );

                        if (filteredSlots.length === 0) {
                          return (
                            <div className="text-center py-4 text-xs text-white/50 bg-black/10 border border-white/5 rounded-xl font-bold">
                              No {slotCategory} slots available for this table.
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            {filteredSlots.map((slot) => {
                              const isSlotSelected = selectedSlot === slot;
                              const offer = getSlotOffer(slot);
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSlot(slot);
                                    setSelectedTableId(null);
                                  }}
                                  className={`relative px-3 py-3 rounded-2xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1 min-h-[64px] ${
                                    isSlotSelected
                                      ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-950/20'
                                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                  }`}
                                >
                                  <span className="font-bold tracking-wide">{slot}</span>
                                  {offer && (
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                      isSlotSelected 
                                        ? 'bg-orange-950/50 text-white' 
                                        : 'bg-orange-600/20 text-orange-400 border border-orange-500/10'
                                    }`}>
                                      🎁 {offer.text}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Cinema layout tables map (Only visible if Date & Slot are selected) */}
                  {reservationDate && selectedSlot && (
                    <div ref={tableGridRef} className="space-y-4 scroll-mt-6">
                      <label className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="h-4 w-4" style={{ color: accentColor }} />
                        Choose Your Table *
                      </label>

                      {/* Screen / Stage layout */}
                      <div className="w-full flex flex-col items-center mt-2 mb-4">
                        <div className="w-4/5 h-1.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-full shadow-[0_3px_10px_rgba(249,115,22,0.4)]" />
                        <span className="text-[9px] text-white/50 font-extrabold uppercase tracking-widest mt-1">Restaurant Stage / Entrance</span>
                      </div>

                      {/* Tables Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-black/20 border border-white/10">
                        {tables.map((table) => {
                          const isSelected = selectedTableId === table.id;
                          const isReserved = reservations.some(
                            (res) => res.table_id === table.id && res.booking_slot === selectedSlot
                          );
                          const isSlotSupported =
                            !table.booking_slots ||
                            table.booking_slots.length === 0 ||
                            table.booking_slots.some((s: any) => {
                              if (typeof s === 'string') return s === selectedSlot;
                              return s && s.time === selectedSlot;
                            });

                          let statusClass = '';
                          if (isSelected) {
                            statusClass = 'border-orange-500 text-orange-400 bg-orange-950/30 shadow-[0_0_12px_rgba(249,115,22,0.4)] scale-[1.02]';
                          } else if (isReserved) {
                            statusClass = 'border-red-500/20 text-red-500 bg-red-950/10 opacity-40 cursor-not-allowed';
                          } else if (!isSlotSupported) {
                            statusClass = 'border-white/5 text-white/20 bg-white/5 cursor-not-allowed opacity-30';
                          } else {
                            statusClass = 'border-emerald-500/40 text-emerald-400 bg-emerald-950/10 hover:border-emerald-500 hover:bg-emerald-950/20 hover:scale-[1.01]';
                          }

                          const chairsCount = table.seating_capacity;
                          const isCircular = chairsCount <= 4;

                          return (
                            <button
                              key={table.id}
                              type="button"
                              disabled={isReserved || !isSlotSupported}
                              onClick={() => setSelectedTableId(table.id)}
                              className={`relative p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center min-h-[90px] w-full ${statusClass}`}
                              title={`Table ${table.table_number} (${chairsCount} Seats) - ${
                                isReserved
                                  ? 'Reserved'
                                  : !isSlotSupported
                                  ? 'Time Slot Not Offered'
                                  : 'Available'
                              }`}
                            >
                              <span className="font-black text-sm">{table.table_number}</span>
                              <span className="text-[9px] opacity-70 font-bold">{chairsCount} Seats</span>

                              {/* Dot chairs visual */}
                              <div className="absolute inset-0 pointer-events-none">
                                {Array.from({ length: chairsCount }).map((_, i) => {
                                  let stylePos = {};
                                  if (isCircular) {
                                    const angle = (i * 360) / chairsCount - 90;
                                    const radius = 38;
                                    const rad = (angle * Math.PI) / 180;
                                    const x = 50 + radius * Math.cos(rad);
                                    const y = 50 + radius * Math.sin(rad);
                                    stylePos = { left: `${x}%`, top: `${y}%` };
                                  } else {
                                    const isTop = i % 2 === 0;
                                    const offset = Math.floor(i / 2) * (70 / Math.ceil(chairsCount / 2)) + 15;
                                    stylePos = { left: `${offset}%`, top: isTop ? '6%' : '94%' };
                                  }
                                  return (
                                    <div
                                      key={i}
                                      className={`absolute w-1.5 h-1.5 rounded-full border transition-all duration-200 ${
                                        isSelected
                                          ? 'bg-orange-500 border-orange-400'
                                          : isReserved
                                          ? 'bg-red-500 border-red-400/50'
                                          : !isSlotSupported
                                          ? 'bg-white/20 border-white/10'
                                          : 'bg-emerald-500 border-emerald-400'
                                      }`}
                                      style={{
                                        ...stylePos,
                                        transform: 'translate(-50%, -50%)',
                                      }}
                                    />
                                  );
                                })}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="flex justify-center gap-4 text-[10px] text-white/70 font-semibold pt-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400" />
                          <span>Available</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-red-400/50" />
                          <span>Reserved</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-orange-400" />
                          <span>Selected</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Special Requests */}
                  <div ref={checkoutSectionRef} className="scroll-mt-6">
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

                  {/* Security Deposit Checkout form (Only visible if a table is selected and booking charge is > 0) */}
                  {selectedTableId && selectedSlot && bookingChargeValue > 0 && (
                    <div className="space-y-4 border-t border-white/15 pt-5 animate-in fade-in duration-250 text-white">
                      <div className="p-4 rounded-2xl bg-black/35 border border-white/10 space-y-2.5 text-xs">
                        <div className="font-extrabold text-orange-500 text-sm border-b border-white/10 pb-2 flex justify-between items-center">
                          <span>Reservation Summary</span>
                          <span className="text-[10px] text-white/50 font-normal">Stripe Security Deposit</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Table Reservation Fee:</span>
                          <span className="font-bold font-mono">$0.00</span>
                         </div>
                         
                         <div className="flex justify-between items-center">
                           <span className="text-white/70">Required Security Deposit:</span>
                           <span className="font-bold font-mono text-emerald-400">${bookingChargeValue.toFixed(2)}</span>
                         </div>

                         {selectedSlot && (
                           <div className="flex justify-between items-center text-[10.5px] bg-orange-600/10 border border-orange-500/15 p-2 rounded-lg text-orange-400">
                             <span className="font-semibold">Applied Slot Offer:</span>
                             <span className="font-black font-mono">{getSlotOffer(selectedSlot).text}</span>
                           </div>
                         )}

                         <div className="border-t border-white/10 pt-2 flex justify-between items-center text-sm font-black">
                           <span>Total Due Now:</span>
                           <span className="font-mono text-emerald-400">${bookingChargeValue.toFixed(2)}</span>
                         </div>

                         <div className="text-[10px] text-white/50 leading-relaxed pt-1.5 flex gap-1.5">
                           <AlertCircle className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                           <span>
                             <strong>Cancellation Policy:</strong> Deposits are strictly <strong>non-refundable</strong> in case of cancellations. The deposit will be credited to your final dine-in bill.
                           </span>
                         </div>
                       </div>

                       {/* Card Details form */}
                       <div className="space-y-3 p-4 rounded-2xl bg-black/25 border border-white/10">
                         <div className="text-xs font-black text-white flex justify-between items-center">
                           <span>Secure Credit Card Checkout</span>
                           <span className="text-[9px] bg-white/15 px-1.5 py-0.5 rounded text-white/75 font-mono">Stripe Secure</span>
                         </div>

                         <div className="space-y-2">
                           <div>
                             <label className="text-[10px] font-bold text-white/70 uppercase">Card Number</label>
                             <input
                               type="text"
                               placeholder="4242 4242 4242 4242"
                               maxLength={19}
                               value={cardNo}
                               onChange={(e) => setCardNo(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                               className="w-full mt-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 transition font-mono"
                             />
                           </div>

                           <div className="grid grid-cols-2 gap-3">
                             <div>
                               <label className="text-[10px] font-bold text-white/70 uppercase">Expiry Date</label>
                               <input
                                 type="text"
                                 placeholder="MM/YY"
                                 maxLength={5}
                                 value={cardExpiry}
                                 onChange={(e) => setCardExpiry(e.target.value)}
                                 className="w-full mt-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 transition font-mono"
                               />
                             </div>
                             <div>
                               <label className="text-[10px] font-bold text-white/70 uppercase">CVC Code</label>
                               <input
                                 type="password"
                                 placeholder="•••"
                                 maxLength={3}
                                 value={cardCvc}
                                 onChange={(e) => setCardCvc(e.target.value)}
                                 className="w-full mt-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 transition font-mono"
                               />
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>
                   )}

                  {/* Submit actions */}
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      disabled={payProcessing}
                      onClick={() => setStep(1)}
                      className="w-1/3 rounded-xl border py-3.5 text-sm font-semibold transition text-white disabled:opacity-50"
                      style={{ borderColor: primaryColor }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedTableId || !selectedSlot || payProcessing}
                      className="w-2/3 rounded-xl py-3.5 text-sm font-extrabold text-white transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: primaryColor,
                        boxShadow: `0 4px 14px 0 ${primaryColor}22`
                      }}
                    >
                      {payProcessing ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white" />
                          <span>Authorizing via Stripe...</span>
                        </>
                      ) : bookingChargeValue > 0 ? (
                        <span>Pay & Book Table</span>
                      ) : (
                        <span>Book Table</span>
                      )}
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
              {selectedTableId && (
                <div className="flex justify-between">
                  <span>Reserved Table:</span>
                  <span className="font-bold text-slate-900">
                    {tables.find((t) => t.id === selectedTableId)?.table_number || 'Table'}
                  </span>
                </div>
              )}
              {selectedSlot && (
                <div className="flex justify-between">
                  <span>Time Slot:</span>
                  <span className="font-bold text-slate-900">{selectedSlot}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Guests count:</span>
                <span className="font-bold text-slate-900">{recentBooking.guestCount || 2} Guests</span>
              </div>
              <div className="flex justify-between">
                <span>Booking Date:</span>
                <span className="font-bold text-slate-900">
                  {new Date(recentBooking.reservationTime).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {recentBooking.booking_charge_paid > 0 && (
                <div className="flex justify-between items-center text-emerald-600 font-extrabold">
                  <span>Security Deposit Paid:</span>
                  <span className="font-mono">${parseFloat(recentBooking.booking_charge_paid).toFixed(2)}</span>
                </div>
              )}
              {recentBooking.applied_offer && (
                <div className="flex justify-between items-center text-orange-600 font-extrabold">
                  <span>Slot Offer Applied:</span>
                  <span>{recentBooking.applied_offer}</span>
                </div>
              )}
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
                href={`/order-online/${orgSlug}/menu`}
                className="w-1/2 rounded-xl py-3 text-xs font-bold text-white hover:opacity-90 transition text-center"
                style={{ backgroundColor: primaryColor }}
              >
                Go to Menu
              </Link>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setSelectedSlot(null);
                  setSelectedTableId(null);
                }}
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
        className="py-2 border-t text-center text-[14px] text-black flex flex-col justify-center gap-3"
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
