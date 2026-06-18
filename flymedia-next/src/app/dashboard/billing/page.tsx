'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Star,
  CheckCircle,
  TrendingUp,
  Receipt,
  ChevronRight,
  Building,
  Calendar,
  BadgeCheck,
  ArrowUpRight,
} from 'lucide-react';

interface BillingData {
  organization: {
    id: string;
    name: string;
    slug: string;
    subscription_plan: string;
    status: string;
    memberSince: string;
    planMeta: {
      label: string;
      price: string;
      color: string;
      features: string[];
    };
  };
  stats: {
    totalRevenue: number;
    totalPaidOrders: number;
  };
  recentPayments: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    reference: string;
    orderNumber: string;
    date: string;
  }>;
}

const PLAN_STYLES: Record<string, { bg: string; text: string; border: string; glow: string; icon: string }> = {
  starter: {
    bg: 'bg-slate-800/50',
    text: 'text-slate-300',
    border: 'border-slate-700',
    glow: '',
    icon: '🪨',
  },
  professional: {
    bg: 'bg-sky-900/20',
    text: 'text-sky-300',
    border: 'border-sky-700/60',
    glow: 'shadow-[0_0_30px_rgba(56,189,248,0.08)]',
    icon: '⚡',
  },
  enterprise: {
    bg: 'bg-amber-900/15',
    text: 'text-amber-300',
    border: 'border-amber-700/50',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.10)]',
    icon: '👑',
  },
};

const METHOD_ICONS: Record<string, string> = {
  cash: '💵',
  card: '💳',
  stripe: '💳',
  online: '🌐',
  upi: '📲',
};

export default function BillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/dashboard/billing')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="h-9 w-9 animate-spin rounded-full border-t-2 border-[#f59e0b] mx-auto" />
          <p className="mt-3 text-xs text-slate-500 font-semibold tracking-wider">Loading billing...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const plan = data.organization.subscription_plan || 'starter';
  const planStyle = PLAN_STYLES[plan] || PLAN_STYLES.starter;

  const memberDate = new Date(data.organization.memberSince).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">

      {/* ── Page Header ── */}
      <div>
        <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
          <CreditCard className="h-5.5 w-5.5 text-[#f59e0b]" />
          Billing & Subscription
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your plan, review payment activity, and track platform revenue.
        </p>
      </div>

      {/* ── Org Status Banner ── */}
      <div className={`rounded-2xl border p-5 flex items-center justify-between gap-4 ${planStyle.bg} ${planStyle.border} ${planStyle.glow}`}>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-slate-900/60 flex items-center justify-center text-2xl shadow">
            {planStyle.icon}
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Your Organization</p>
            <p className="text-base font-black text-white mt-0.5">{data.organization.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${planStyle.border} ${planStyle.text}`}>
                {data.organization.planMeta.label} Plan
              </span>
              {data.organization.status === 'active' && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-600/30">
                  Active
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Billing Cycle</p>
          <p className={`text-2xl font-black mt-0.5 ${planStyle.text}`}>{data.organization.planMeta.price}</p>
          <div className="flex items-center gap-1 justify-end mt-1 text-slate-500">
            <Calendar className="h-3 w-3" />
            <span className="text-[10px] font-semibold">Member since {memberDate}</span>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-black text-white mt-1.5">${data.stats.totalRevenue.toFixed(2)}</p>
            <span className="text-[9.5px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded inline-block mt-1">
              Processed via POS
            </span>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Paid Orders</p>
            <p className="text-2xl font-black text-white mt-1.5">{data.stats.totalPaidOrders}</p>
            <span className="text-[9.5px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded inline-block mt-1">
              Completed Transactions
            </span>
          </div>
          <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400">
            <Receipt className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Plan Features</p>
            <p className="text-2xl font-black text-white mt-1.5">{data.organization.planMeta.features.length}</p>
            <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded inline-block mt-1 ${planStyle.text} ${planStyle.bg}`}>
              {data.organization.planMeta.label} Tier
            </span>
          </div>
          <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
            <Star className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Plan Features Card ── */}
        <div className="lg:col-span-2 rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-4.5 w-4.5 text-[#f59e0b]" />
            <h2 className="text-sm font-black text-white">Plan Includes</h2>
          </div>
          <ul className="space-y-2.5">
            {data.organization.planMeta.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-xs font-semibold text-slate-300">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          <div className="pt-2 border-t border-[#1e293b]/60">
            <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 py-2.5 text-xs font-bold text-[#f59e0b] hover:bg-[#f59e0b]/20 transition">
              <ArrowUpRight className="h-3.5 w-3.5" />
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* ── Recent Payments Table ── */}
        <div className="lg:col-span-3 rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1e293b]/60 bg-slate-950/20 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-black text-white">Recent Transactions</h2>
          </div>
          {data.recentPayments.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt className="h-8 w-8 text-slate-700 mx-auto" />
              <p className="mt-3 text-xs text-slate-500 font-bold">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1e293b]/40">
              {data.recentPayments.map((pay) => (
                <div key={pay.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-900/20 transition">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm">
                      {METHOD_ICONS[pay.method] || '💰'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{pay.orderNumber}</p>
                      <p className="text-[10px] text-slate-500 font-semibold capitalize">{pay.method} · {new Date(pay.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-white">${pay.amount.toFixed(2)}</p>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded mt-0.5 inline-block ${
                      pay.status === 'success'
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-red-400 bg-red-500/10'
                    }`}>
                      {pay.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Org Details Card ── */}
      <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-black text-white">Organization Details</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Organization ID', value: data.organization.id.slice(0, 8) + '...' },
            { label: 'Slug', value: data.organization.slug },
            { label: 'Status', value: data.organization.status },
            { label: 'Member Since', value: memberDate },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
              <p className="text-xs font-bold text-white capitalize">{value}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
