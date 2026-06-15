'use client';

import React, { useState, useEffect } from 'react';
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
  HelpCircle
} from 'lucide-react';

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;

  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'payments'>('orders');

  useEffect(() => {
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

    fetchProfile();
  }, [orgSlug, router]);

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
        return <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 border border-emerald-500/25">Success</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-400 border border-amber-500/25">Pending</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-400 border border-red-500/25">Failed</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded bg-slate-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border border-slate-500/25">{status}</span>;
    }
  };

  // Extract all payments from orders
  const paymentsList = orders.flatMap(order => 
    (order.payments || []).map((pay: any) => ({
      ...pay,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      createdAt: order.createdAt
    }))
  );

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,98,255,0.06),transparent_40%),radial-gradient(circle_at_70%_70%,rgba(6,182,212,0.04),transparent_40%)]" />

      {/* 1. TOP NAVBAR HEADER */}
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-6 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900">
        <div>
          <Link
            href={`/order-online/${orgSlug}/menu`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Ordering Menu
          </Link>
          <h1 className="text-3xl font-black mt-3 text-white">Your Diner Portal</h1>
          <p className="text-slate-400 text-xs mt-1">Manage restaurant bookings, track payments, and review purchase logs.</p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 hover:border-red-500/30 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-350 hover:text-red-400 transition"
        >
          <LogOut className="h-4 w-4" /> Logout Account
        </button>
      </div>

      {/* 2. BODY CONTENT CONTAINER */}
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: CUSTOMER CARD PROFILE */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute right-4 top-4 h-16 w-16 bg-cyan-500/5 rounded-full flex items-center justify-center border border-cyan-500/10">
              <User className="h-8 w-8 text-cyan-400" />
            </div>

            <h3 className="text-lg font-bold text-white uppercase tracking-wider text-slate-500 text-xs">Customer Profile</h3>
            <h2 className="text-2xl font-black text-white mt-3">{customer.name}</h2>
            
            <div className="space-y-3 mt-6 text-sm text-slate-300">
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-850 flex items-center gap-4 bg-gradient-to-r from-cyan-950/20 to-blue-950/20 p-4 rounded-2xl border border-cyan-500/10">
              <div className="p-3 bg-cyan-500/15 rounded-xl border border-cyan-500/20">
                <Award className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Loyalty Points</p>
                <p className="text-2xl font-black text-cyan-400 mt-0.5">{customer.loyaltyPoints} PTS</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ORDERS & PAYMENTS TABS LIST */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex border-b border-slate-900 gap-6">
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-4 text-sm font-extrabold flex items-center gap-2 transition relative ${
                activeTab === 'orders' ? 'text-cyan-400' : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Order History ({orders.length})
              {activeTab === 'orders' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 rounded-full" />}
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`pb-4 text-sm font-extrabold flex items-center gap-2 transition relative ${
                activeTab === 'payments' ? 'text-cyan-400' : 'text-slate-450 hover:text-slate-200'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Payment Records ({paymentsList.length})
              {activeTab === 'payments' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 rounded-full" />}
            </button>
          </div>

          {/* TAB CONTENT: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-12 border border-slate-900 rounded-3xl bg-slate-900/40">
                  <ShoppingBag className="h-12 w-12 mx-auto stroke-[1.5] text-slate-700 mb-3" />
                  <p className="text-slate-500 font-semibold">You haven't placed any online orders yet.</p>
                  <Link
                    href={`/order-online/${orgSlug}/menu`}
                    className="inline-block mt-4 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 transition"
                  >
                    Browse Menu & Order
                  </Link>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-850 pb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-base font-black text-white">{order.orderNumber}</h4>
                          {getOrderStatusPill(order.status)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="uppercase font-bold tracking-wider text-[10px] text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/10">
                            {order.orderType.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right sm:text-right">
                        <p className="text-slate-450 text-[10px] font-bold uppercase">Total Bill</p>
                        <p className="text-lg font-black text-white mt-0.5">${order.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ordered Items</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        {order.items?.map((item: any) => (
                          <div
                            key={item.id}
                            className="bg-slate-950/40 border border-slate-850 p-3 rounded-2xl flex justify-between items-center text-xs"
                          >
                            <div>
                              <p className="font-extrabold text-white">{item.notes ? `${item.notes} (item)` : 'Food Item'}</p>
                              {item.addons && item.addons.length > 0 && (
                                <p className="text-[10px] text-slate-450 mt-0.5">
                                  Addons: {item.addons.map((a: any) => a.name).join(', ')}
                                </p>
                              )}
                            </div>
                            <span className="font-black text-slate-350">
                              {item.quantity}x @ $${parseFloat(item.unit_price).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB CONTENT: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
              {paymentsList.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-semibold bg-slate-900">
                  <CreditCard className="h-12 w-12 mx-auto stroke-[1.5] text-slate-700 mb-3" />
                  <p>No billing or payment transactions found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-4 px-6">Date</th>
                        <th className="py-4 px-6">Order ID</th>
                        <th className="py-4 px-6">Method</th>
                        <th className="py-4 px-6">Tx Reference</th>
                        <th className="py-4 px-6">Amount</th>
                        <th className="py-4 px-6 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs">
                      {paymentsList.map((pay: any) => (
                        <tr key={pay.id} className="hover:bg-slate-850/20 transition">
                          <td className="py-4 px-6 text-slate-300">
                            {new Date(pay.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6 font-extrabold text-white">
                            {pay.orderNumber}
                          </td>
                          <td className="py-4 px-6 uppercase text-slate-400 font-bold">
                            {pay.payment_method}
                          </td>
                          <td className="py-4 px-6 font-mono text-[10px] text-slate-450">
                            {pay.transaction_reference || 'N/A'}
                          </td>
                          <td className="py-4 px-6 font-black text-white">
                            ${parseFloat(pay.amount).toFixed(2)}
                          </td>
                          <td className="py-4 px-6 text-right">
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

        </div>
      </div>
    </div>
  );
}
