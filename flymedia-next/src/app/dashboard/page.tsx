'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  Users,
  Utensils,
  DollarSign,
  MonitorPlay,
  RotateCw,
  LogOut,
  ChevronRight,
  Database,
  CheckCircle,
  Clock,
  Laptop,
  AlertCircle,
  RefreshCw,
  Calendar,
  ShoppingBag,
  CreditCard,
  Banknote,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────
interface DayEntry {
  date: string;
  cash: number;
  online: number;
  total: number;
  count: number;
}
interface WeekEntry {
  week: string;
  cash: number;
  online: number;
  total: number;
  count: number;
}
interface MonthEntry {
  month: string;
  cash: number;
  online: number;
  total: number;
  count: number;
}
interface YearEntry {
  year: string;
  cash: number;
  online: number;
  total: number;
  count: number;
}
interface AnalyticsData {
  revenue: {
    daily: DayEntry[];
    weekly: WeekEntry[];
    monthly: MonthEntry[];
    yearly: YearEntry[];
  };
  statusCounts: {
    pending: number;
    confirmed: number;
    cancelled: number;
    seated: number;
  };
  tableFrequencies: { tableId: string; tableNumber: string; count: number }[];
  customerFrequencies: { customerId: string; name: string; phone: string; count: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────
function formatCurrency(n: number): string {
  if (n >= 100000) return `$${(n / 1000).toFixed(0)}k`;
  if (n >= 10000) return `$${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ─── Sparkline ────────────────────────────────────────────────────────
function MiniSparkline({ points, strokeColor }: { points: number[]; strokeColor: string }) {
  const width = 120;
  const height = 30;
  if (!points.length || points.every((p) => p === 0)) {
    return (
      <div className="relative h-7 w-28 shrink-0 flex items-center justify-center">
        <span className="text-[9px] text-slate-600 font-medium">No data</span>
      </div>
    );
  }
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * (height - 6) - 3;
    return `${x},${y}`;
  });

  const pathData = `M ${coords.join(' L ')}`;

  return (
    <div className="relative h-7 w-28 shrink-0">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────
function WidgetSkeleton() {
  return (
    <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 flex items-center justify-between shadow-xl animate-pulse">
      <div>
        <div className="h-3 w-20 bg-slate-800 rounded mb-3"></div>
        <div className="h-7 w-28 bg-slate-800 rounded mb-2"></div>
        <div className="h-2.5 w-32 bg-slate-800/60 rounded"></div>
      </div>
      <div className="h-7 w-28 bg-slate-800/40 rounded"></div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-3">
      <div className="flex items-end gap-1 h-[150px]">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-slate-800/50 rounded-t"
            style={{ height: `${30 + Math.random() * 70}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
}

// ─── Large SVG Line Chart ─────────────────────────────────────────────
type ChartRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

function DashboardSalesChart({ data, range }: { data: AnalyticsData; range: ChartRange }) {
  const revenueSet = data.revenue[range];
  if (!revenueSet || revenueSet.length === 0) {
    return (
      <div className="w-full h-[150px] flex items-center justify-center text-slate-500 text-sm">
        No revenue data available
      </div>
    );
  }

  // Get last N entries and build points + labels
  const sliceCount = range === 'daily' ? 14 : revenueSet.length;
  const entries = revenueSet.slice(-sliceCount);
  const points = entries.map((e: any) => e.total);
  const labels = entries.map((e: any) => {
    if (range === 'daily') {
      const d = new Date(e.date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (range === 'weekly') return e.week;
    if (range === 'monthly') return e.month;
    return e.year;
  });

  const width = 550;
  const height = 160;
  const maxVal = Math.max(...points, 1);
  const minVal = 0;
  const rangeVal = maxVal - minVal || 1;

  // Only show every Nth label to prevent overlap
  const labelInterval = range === 'daily' ? 2 : 1;

  const coords = points.map((p: number, i: number) => {
    const x = (i / (points.length - 1 || 1)) * (width - 50) + 25;
    const y = height - ((p - minVal) / rangeVal) * (height - 45) - 25;
    return { x, y, val: p };
  });

  if (coords.length < 2) {
    return (
      <div className="w-full h-[150px] flex items-center justify-center text-slate-500 text-sm">
        Not enough data points
      </div>
    );
  }

  const linePath = `M ${coords.map((c) => `${c.x},${c.y}`).join(' L ')}`;
  const areaPath = `${linePath} L ${coords[coords.length - 1].x},${height - 15} L ${coords[0].x},${height - 15} Z`;

  // Y-axis grid lines
  const gridLevels = [0.25, 0.5, 0.75, 1.0].map((pct) => Math.round(maxVal * pct));

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="dashboardAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLevels.map((level, i) => {
          const y = height - (level / rangeVal) * (height - 45) - 25;
          return (
            <g key={i}>
              <line x1="25" y1={y} x2={width - 25} y2={y} stroke="#1e293b" strokeWidth="0.75" strokeDasharray="4 4" />
              <text x="2" y={y + 3} fill="#475569" fontSize="7" fontWeight="600">
                {formatCurrency(level)}
              </text>
            </g>
          );
        })}

        {/* Shaded Area */}
        <path d={areaPath} fill="url(#dashboardAreaGrad)" />

        {/* Glowing Line */}
        <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {coords.map((c, i) => (
          <g key={`dot-${i}`} className="group/dot cursor-pointer">
            <circle cx={c.x} cy={c.y} r="3.5" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
            <title>{`${labels[i]}: ${formatCurrency(c.val)}`}</title>
          </g>
        ))}

        {/* X-Axis Labels */}
        {coords.map((c, i) => {
          if (i % labelInterval !== 0 && i !== coords.length - 1) return null;
          return (
            <text key={`label-${i}`} x={c.x} y={height - 2} textAnchor="middle" fill="#64748b" fontSize="7" fontWeight="600">
              {labels[i]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Donut Chart (Payment Method Breakdown) ───────────────────────────
function DashboardCategoryChart({ data }: { data: AnalyticsData }) {
  const allDaily = data.revenue.daily;
  const totalCash = allDaily.reduce((s, d) => s + d.cash, 0);
  const totalOnline = allDaily.reduce((s, d) => s + d.online, 0);
  const grandTotal = totalCash + totalOnline;

  if (grandTotal === 0) {
    return (
      <div className="flex items-center justify-center h-full py-2 text-slate-500 text-sm">
        No payment data yet
      </div>
    );
  }

  const cashPct = Math.round((totalCash / grandTotal) * 100);
  const onlinePct = 100 - cashPct;

  const categories = [
    { name: 'Cash Payments', percentage: cashPct, color: '#f59e0b', amount: totalCash },
    { name: 'Online Payments', percentage: onlinePct, color: '#06b6d4', amount: totalOnline },
  ];

  // Add reservation status breakdown if available
  const { statusCounts } = data;
  const totalRes = statusCounts.pending + statusCounts.confirmed + statusCounts.cancelled + statusCounts.seated;
  if (totalRes > 0) {
    categories.push(
      { name: 'Confirmed Res.', percentage: Math.round((statusCounts.confirmed / totalRes) * 100), color: '#10b981', amount: statusCounts.confirmed },
      { name: 'Pending Res.', percentage: Math.round((statusCounts.pending / totalRes) * 100), color: '#a855f7', amount: statusCounts.pending },
    );
  }

  const radius = 34;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;

  // Only use cash+online for donut (2 slices)
  const donutSlices = [
    { percentage: cashPct, color: '#f59e0b' },
    { percentage: onlinePct, color: '#06b6d4' },
  ];
  let accumulatedPercentage = 0;

  return (
    <div className="flex items-center justify-between gap-5 h-full py-2">
      <div className="relative w-24 h-24 shrink-0">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          {donutSlices.map((cat, i) => {
            const dashArray = `${(cat.percentage / 100) * circumference} ${circumference}`;
            const strokeOffset = circumference - (accumulatedPercentage / 100) * circumference;
            accumulatedPercentage += cat.percentage;

            return (
              <circle
                key={i}
                cx="40"
                cy="40"
                r={radius}
                fill="transparent"
                stroke={cat.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-350 hover:opacity-80"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[8px] text-slate-400 font-semibold tracking-wider uppercase leading-none">Total</span>
          <span className="text-[11px] font-bold text-white mt-0.5">{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      <div className="flex-1 space-y-1.5 text-xs">
        {categories.map((cat, i) => (
          <div key={i} className="flex items-center justify-between font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-slate-400 truncate max-w-[100px]">{cat.name}</span>
            </div>
            <span className="text-white">
              {typeof cat.amount === 'number' && cat.amount > 100
                ? formatCurrency(cat.amount)
                : `${cat.percentage}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<ChartRange>('daily');

  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Redirect if not logged in or if Super Admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const roles = (session?.user as any)?.roles || [];
      if (roles.includes('Super Admin')) {
        router.push('/dashboard/super-admin');
      }
    }
  }, [status, session, router]);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const res = await fetch('/api/dashboard/analytics');
      if (!res.ok) throw new Error(`Failed to fetch analytics (${res.status})`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Unknown error');
      setAnalyticsData(json);
    } catch (err: any) {
      setAnalyticsError(err.message || 'Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAnalytics();
    }
  }, [status, fetchAnalytics]);

  const handleSyncSeed = async () => {
    setSyncLoading(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/db/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMessage('Database seeded successfully! Demo credentials: owner@fordering.com / password123');
        // Refresh analytics after seeding
        fetchAnalytics();
      } else {
        setSyncMessage('Sync failed: ' + data.message);
      }
    } catch {
      setSyncMessage('Failed to trigger database sync API.');
    } finally {
      setSyncLoading(false);
    }
  };

  // ─── Derived Stats ────────────────────────────────────────────────
  const todaySales = analyticsData?.revenue.daily?.at(-1)?.total ?? 0;
  const todayOrders = analyticsData?.revenue.daily?.at(-1)?.count ?? 0;
  const todaySparkline = (analyticsData?.revenue.daily ?? []).slice(-7).map((d) => d.total);

  const weeklyRevenue = (analyticsData?.revenue.weekly ?? []).slice(-1)[0]?.total ?? 0;
  const weeklyOrders = (analyticsData?.revenue.weekly ?? []).slice(-1)[0]?.count ?? 0;
  const weeklySparkline = (analyticsData?.revenue.weekly ?? []).slice(-7).map((w) => w.total);

  const monthlyRevenue = (analyticsData?.revenue.monthly ?? []).slice(-1)[0]?.total ?? 0;
  const monthlyOrders = (analyticsData?.revenue.monthly ?? []).slice(-1)[0]?.count ?? 0;
  const monthlySparkline = (analyticsData?.revenue.monthly ?? []).slice(-6).map((m) => m.total);

  const totalCash = (analyticsData?.revenue.daily ?? []).reduce((s, d) => s + d.cash, 0);
  const totalOnline = (analyticsData?.revenue.daily ?? []).reduce((s, d) => s + d.online, 0);
  const cashSparkline = (analyticsData?.revenue.daily ?? []).slice(-7).map((d) => d.cash);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b11]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-[#f59e0b] mx-auto"></div>
          <p className="mt-4 text-slate-400 font-semibold tracking-wider">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 pb-12">

      {/* 1. TOP BAR */}
      <nav className="border-b border-[#1e293b]/60 bg-[#0c101b] px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#f59e0b]" />
          <span className="text-base font-black tracking-wider text-white">
            Overview Dashboard
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* <button
            onClick={fetchAnalytics}
            disabled={analyticsLoading}
            className="rounded-lg bg-slate-900 border border-[#1e293b] p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition duration-150 disabled:opacity-50"
            title="Refresh analytics"
          >
            <RefreshCw className={`h-4 w-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
          </button> */}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white">{session?.user?.name || 'Administrator'}</p>
            <p className="text-[10px] text-[#f59e0b] font-semibold uppercase leading-none mt-0.5">
              {(session?.user as any)?.roles?.[0] || 'Administrator'}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-lg bg-slate-900 border border-[#1e293b] p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition duration-150"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </nav>

      {/* 2. BODY CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* SaaS Initialize Alert
        <div className="rounded-2xl border border-[#f59e0b]/20 bg-gradient-to-r from-[#ea580c]/5 to-[#f59e0b]/5 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-sm shadow-xl">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-[#f59e0b] animate-pulse" />
              SaaS Database Initialization
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Initialize database schema and populate roles, tables, permissions, and menu assets automatically. Recommended on first install.
            </p>
            {syncMessage && (
              <p className="mt-3 text-xs font-semibold text-[#f59e0b] flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                {syncMessage}
              </p>
            )}
          </div>
          <button
            onClick={handleSyncSeed}
            disabled={syncLoading}
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-[#f59e0b] px-4.5 py-3 text-xs font-extrabold text-slate-950 hover:bg-[#f59e0b]/80 transition disabled:opacity-50 shadow-md shadow-[#f59e0b]/10"
          >
            <RotateCw className={`h-3.5 w-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
            {syncLoading ? 'Seeding Tables...' : 'Seed Database'}
          </button>
        </div> */}

        {/* Analytics Error Banner */}
        {analyticsError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-300">Failed to load analytics</p>
              <p className="text-xs text-red-400/80 mt-0.5">{analyticsError}</p>
            </div>
            <button
              onClick={fetchAnalytics}
              className="shrink-0 rounded-lg bg-red-900/40 border border-red-500/20 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-900/60 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Dashboard Widgets Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {analyticsLoading ? (
            <>
              <WidgetSkeleton />
              <WidgetSkeleton />
              <WidgetSkeleton />
              <WidgetSkeleton />
            </>
          ) : (
            <>
              {/* Today's Sales */}
              <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-emerald-400" />
                    Today&apos;s Sales
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">{formatCurrency(todaySales)}</p>
                  <p className="mt-1.5 text-[10px] text-slate-500 font-semibold">
                    {todayOrders} completed order{todayOrders !== 1 ? 's' : ''}
                  </p>
                </div>
                <MiniSparkline points={todaySparkline} strokeColor="#10b981" />
              </div>

              {/* Total Orders This Week */}
              <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <ShoppingBag className="h-3 w-3 text-[#f59e0b]" />
                    Weekly Revenue
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">{formatCurrency(weeklyRevenue)}</p>
                  <p className="mt-1.5 text-[10px] text-slate-500 font-semibold">
                    {weeklyOrders} order{weeklyOrders !== 1 ? 's' : ''} this week
                  </p>
                </div>
                <MiniSparkline points={weeklySparkline} strokeColor="#f59e0b" />
              </div>

              {/* Monthly Revenue */}
              <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-cyan-400" />
                    Monthly Revenue
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">{formatCurrency(monthlyRevenue)}</p>
                  <p className="mt-1.5 text-[10px] text-slate-500 font-semibold">
                    {monthlyOrders} order{monthlyOrders !== 1 ? 's' : ''} this month
                  </p>
                </div>
                <MiniSparkline points={monthlySparkline} strokeColor="#06b6d4" />
              </div>

              {/* Payment Split */}
              <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <CreditCard className="h-3 w-3 text-purple-400" />
                    Payment Split
                  </p>
                  <p className="mt-2 text-lg font-black text-white">
                    <span className="text-[#f59e0b]">{formatCurrency(totalCash)}</span>
                    <span className="text-slate-600 mx-1">/</span>
                    <span className="text-cyan-400">{formatCurrency(totalOnline)}</span>
                  </p>
                  <p className="mt-1.5 text-[10px] text-slate-500 font-semibold">
                    <Banknote className="h-2.5 w-2.5 inline text-[#f59e0b] mr-0.5" />Cash
                    <span className="mx-1">·</span>
                    <CreditCard className="h-2.5 w-2.5 inline text-cyan-400 mr-0.5" />Online
                  </p>
                </div>
                <MiniSparkline points={cashSparkline} strokeColor="#a855f7" />
              </div>
            </>
          )}
        </div>

        {/* Visual Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Sales Chart */}
          <div className="lg:col-span-8 rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Revenue Trend</h3>
              <div className="flex items-center gap-1">
                {(['daily', 'weekly', 'monthly', 'yearly'] as ChartRange[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition ${chartRange === r
                        ? 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30'
                        : 'text-slate-500 hover:text-slate-300 border border-transparent'
                      }`}
                  >
                    {r === 'daily' ? 'Day' : r === 'weekly' ? 'Wk' : r === 'monthly' ? 'Mo' : 'Yr'}
                  </button>
                ))}
              </div>
            </div>
            {analyticsLoading || !analyticsData ? <ChartSkeleton /> : <DashboardSalesChart data={analyticsData} range={chartRange} />}
          </div>

          {/* Category / Payment Donut */}
          <div className="lg:col-span-4 rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 shadow-xl flex flex-col justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Payment Breakdown</h3>
            {analyticsLoading || !analyticsData ? (
              <div className="flex-1 flex items-center justify-center animate-pulse">
                <div className="w-24 h-24 rounded-full bg-slate-800/50"></div>
              </div>
            ) : (
              <DashboardCategoryChart data={analyticsData} />
            )}
          </div>

        </div>

        {/* Top Customers & Table Frequency */}
        {analyticsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Customers */}
            <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-[#f59e0b]" />
                Top Customers
              </h3>
              {analyticsData.customerFrequencies.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No customer data available</p>
              ) : (
                <div className="space-y-2">
                  {analyticsData.customerFrequencies.slice(0, 5).map((c, i) => (
                    <div key={c.customerId} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/40 border border-[#1e293b]/40">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-[10px] font-bold flex items-center justify-center border border-[#f59e0b]/20">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white">{c.name}</p>
                          <p className="text-[10px] text-slate-500">{c.phone}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#f59e0b]">{c.count} visit{c.count !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Table Popularity */}
            <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Utensils className="h-4 w-4 text-cyan-400" />
                Most Booked Tables
              </h3>
              {analyticsData.tableFrequencies.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No table booking data available</p>
              ) : (
                <div className="space-y-2">
                  {analyticsData.tableFrequencies.slice(0, 5).map((t, i) => {
                    const maxCount = analyticsData.tableFrequencies[0]?.count || 1;
                    const pct = Math.round((t.count / maxCount) * 100);
                    return (
                      <div key={t.tableId} className="px-3 py-2 rounded-xl bg-slate-900/40 border border-[#1e293b]/40">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-white">Table {t.tableNumber}</span>
                          <span className="text-[10px] font-bold text-cyan-400">{t.count} booking{t.count !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Launch Terminals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/25 mb-4">
                <Laptop className="h-5 w-5 text-[#f59e0b]" />
              </div>
              <h3 className="text-base font-bold text-white">POS Cashier Terminal</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Open the touch-friendly cashier terminal interface to process Dine-In and Takeaway orders, split customer bills, manage tables, and reprint Epson invoices.
              </p>
            </div>
            <Link
              href="/pos"
              target="_blank"
              className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#f59e0b] py-3 text-xs font-extrabold text-slate-950 hover:bg-[#f59e0b]/80 transition shadow-md shadow-[#f59e0b]/10"
            >
              Launch Cashier Screen
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-950/20 border border-purple-800/30 mb-4">
                <MonitorPlay className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-base font-bold text-white">Kitchen Display System (KDS)</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Render prepared orders and cooking progress in real-time. Culinary teams can accept pending tickets and send instant order-ready signals to waiter consoles.
              </p>
            </div>
            <button
              onClick={() => alert('KDS Console module is configured in the background. Screen release scheduled for next release phase.')}
              className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 border border-[#1e293b] py-3 text-xs font-extrabold text-slate-300 hover:bg-slate-800 transition"
            >
              Launch Kitchen Console
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
