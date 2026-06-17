'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Users,
  DollarSign,
  CreditCard,
  Layers,
  ArrowRightLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Check,
  X,
  Database,
  Table,
  HelpCircle,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RevenueItem {
  date?: string;
  week?: string;
  month?: string;
  year?: string;
  cash: number;
  online: number;
  total: number;
  count: number;
}

interface ReservationType {
  id: string;
  store_id: string;
  customer_id: string;
  table_id: string | null;
  reservation_time: string;
  guest_count: number;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'seated';
  createdAt: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
  RestaurantTable?: {
    id: string;
    table_number: string;
  };
}

interface TableFrequency {
  tableId: string;
  tableNumber: string;
  count: number;
}

interface CustomerFrequency {
  customerId: string;
  name: string;
  phone: string;
  count: number;
}

export default function AnalyticsDashboardPage() {
  const { data: session } = useSession();

  // Tab State
  const [activeTab, setActiveTab] = useState<'revenue' | 'bookings'>('revenue');

  // Filter States
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'online'>('all');

  // Search state for reservations
  const [reservationSearch, setReservationSearch] = useState('');
  const [reservationStatusFilter, setReservationStatusFilter] = useState<string>('all');

  // Data States
  const [revenue, setRevenue] = useState<{
    daily: RevenueItem[];
    weekly: RevenueItem[];
    monthly: RevenueItem[];
    yearly: RevenueItem[];
  }>({ daily: [], weekly: [], monthly: [], yearly: [] });
  const [tableFrequencies, setTableFrequencies] = useState<TableFrequency[]>([]);
  const [customerFrequencies, setCustomerFrequencies] = useState<CustomerFrequency[]>([]);
  const [reservations, setReservations] = useState<ReservationType[]>([]);
  const [statusCounts, setStatusCounts] = useState({ pending: 0, confirmed: 0, cancelled: 0, seated: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Chart hover tooltip state
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    label: string;
    value: number;
    cash: number;
    online: number;
  } | null>(null);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard/analytics');
      const data = await res.json();
      if (data.success) {
        setRevenue(data.revenue);
        setTableFrequencies(data.tableFrequencies || []);
        setCustomerFrequencies(data.customerFrequencies || []);
        setReservations(data.reservations || []);
        setStatusCounts(data.statusCounts || { pending: 0, confirmed: 0, cancelled: 0, seated: 0 });
      } else {
        setError(data.error || 'Failed to load analytics data.');
      }
    } catch (err) {
      setError('Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const handleUpdateReservationStatus = async (id: string, newStatus: 'confirmed' | 'seated' | 'cancelled') => {
    try {
      setActionLoading(true);
      setActionError(null);
      setActionSuccess(null);

      const res = await fetch('/api/dashboard/analytics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Reservation updated to ${newStatus} successfully.`);
        await fetchAnalyticsData();
      } else {
        setActionError(data.error || 'Failed to update reservation status.');
      }
    } catch (err) {
      setActionError('Network error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeedDemoData = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      setActionSuccess(null);

      const res = await fetch('/api/dashboard/analytics/seed', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess('Demo analytics data generated successfully!');
        await fetchAnalyticsData();
      } else {
        setActionError(data.error || 'Failed to seed demo data.');
      }
    } catch (err) {
      setActionError('Network error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  // Get active dataset for revenue reports
  const getActiveDataset = (): { label: string; value: number; cash: number; online: number; count: number }[] => {
    const dataset = revenue[timeframe] || [];
    return dataset.map((item) => {
      let label = '';
      if (timeframe === 'daily') label = item.date || '';
      else if (timeframe === 'weekly') label = item.week || '';
      else if (timeframe === 'monthly') label = item.month || '';
      else if (timeframe === 'yearly') label = item.year || '';

      let val = item.total;
      if (paymentFilter === 'cash') val = item.cash;
      else if (paymentFilter === 'online') val = item.online;

      return {
        label,
        value: val,
        cash: item.cash,
        online: item.online,
        count: item.count,
      };
    });
  };

  const activeData = getActiveDataset();

  // Aggregate stats dynamically based on the active dataset
  const totalPeriodSales = activeData.reduce((sum, item) => sum + item.value, 0);
  const totalPeriodCash = activeData.reduce((sum, item) => sum + item.cash, 0);
  const totalPeriodOnline = activeData.reduce((sum, item) => sum + item.online, 0);
  const totalPeriodTransactions = activeData.reduce((sum, item) => sum + item.count, 0);

  // Filter reservations
  const filteredReservations = reservations.filter((res) => {
    const customerName = res.customer?.name.toLowerCase() || '';
    const customerPhone = res.customer?.phone.toLowerCase() || '';
    const tableNumber = res.RestaurantTable?.table_number.toLowerCase() || '';
    const matchesSearch =
      customerName.includes(reservationSearch.toLowerCase()) ||
      customerPhone.includes(reservationSearch.toLowerCase()) ||
      tableNumber.includes(reservationSearch.toLowerCase());

    const matchesStatus = reservationStatusFilter === 'all' || res.status === reservationStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Check if database has zero data
  const isDatabaseEmpty =
    revenue.daily.every((d) => d.total === 0) &&
    revenue.weekly.every((d) => d.total === 0) &&
    revenue.monthly.every((d) => d.total === 0) &&
    reservations.length === 0;

  // Custom Line Chart Math
  const renderLineChart = () => {
    if (activeData.length === 0) return null;

    const width = 600;
    const height = 200;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const values = activeData.map((d) => d.value);
    const maxVal = Math.max(...values, 100);
    const minVal = 0;
    const valRange = maxVal - minVal;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const points = activeData.map((item, idx) => {
      const x = paddingLeft + (idx / (activeData.length - 1 || 1)) * chartWidth;
      const y = paddingTop + chartHeight - ((item.value - minVal) / valRange) * chartHeight;
      return { x, y, item };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath =
      points.length > 0
        ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${
            paddingTop + chartHeight
          } Z`
        : '';

    return (
      <div className="relative w-full h-[240px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="glowAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y Axis values */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = paddingTop + chartHeight - ratio * chartHeight;
            const gridVal = Math.round(minVal + ratio * valRange);
            return (
              <g key={index}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="0.75"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  className="text-[8px] font-bold"
                >
                  ${gridVal}
                </text>
              </g>
            );
          })}

          {/* Gradient Shaded Area */}
          {areaPath && <path d={areaPath} fill="url(#glowAreaGrad)" />}

          {/* Glowing Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Dots */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={hoveredPoint?.label === p.item.label ? '5' : '3'}
              fill="#080b11"
              stroke="#f59e0b"
              strokeWidth="2"
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const containerRect = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
                if (containerRect) {
                  setHoveredPoint({
                    x: rect.left - containerRect.left + rect.width / 2,
                    y: rect.top - containerRect.top - 70,
                    label: p.item.label,
                    value: p.item.value,
                    cash: p.item.cash,
                    online: p.item.online,
                  });
                }
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}

          {/* X Axis Labels */}
          {points.map((p, idx) => {
            // Label decluttering: show every label for small lists, or sparse for larger lists
            const showLabel =
              timeframe === 'yearly' ||
              timeframe === 'monthly' ||
              idx === 0 ||
              idx === points.length - 1 ||
              idx % 5 === 0;

            if (!showLabel) return null;

            let cleanLabel = p.item.label;
            if (timeframe === 'daily') {
              // Extract just day/month for daily
              const parts = cleanLabel.split('-');
              if (parts.length === 3) cleanLabel = `${parts[1]}/${parts[2]}`;
            }

            return (
              <text
                key={idx}
                x={p.x}
                y={paddingTop + chartHeight + 16}
                textAnchor="middle"
                fill="#64748b"
                className="text-[8px] font-bold"
              >
                {cleanLabel}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip portal */}
        {hoveredPoint && (
          <div
            className="absolute z-10 rounded-xl bg-slate-900 border border-slate-800 p-2.5 shadow-xl pointer-events-none text-left"
            style={{
              left: `${hoveredPoint.x}px`,
              top: `${hoveredPoint.y}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{hoveredPoint.label}</p>
            <p className="text-xs font-black text-white mt-0.5">
              Revenue: <span className="text-[#f59e0b]">${hoveredPoint.value.toFixed(2)}</span>
            </p>
            <div className="flex gap-2.5 text-[8px] text-slate-400 mt-1 pt-1 border-t border-slate-800 font-semibold">
              <span>Cash: ${hoveredPoint.cash.toFixed(2)}</span>
              <span>Online: ${hoveredPoint.online.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const totalRevenueEver = revenue.daily.reduce((sum, d) => sum + d.total, 0) +
    revenue.weekly.reduce((sum, d) => sum + d.total, 0) +
    revenue.monthly.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full text-slate-200">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-orange-500" />
            Store Sales & Booking Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track daily, weekly, monthly, and yearly revenue patterns, analyze payment method breakdowns, and review customer dining histories.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchAnalyticsData}
            className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 text-slate-400 hover:text-white transition"
            title="Refresh Data"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleSeedDemoData}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-orange-500/30 bg-orange-950/10 px-4 py-2.5 text-xs font-bold text-[#f59e0b] hover:bg-orange-950/20 transition shadow"
            title="Generate Demo Data"
          >
            <Database className="h-4 w-4" />
            Seed Demo Data
          </button>
        </div>
      </div>

      {/* FEEDBACK STATUSES */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 px-4 py-3.5 text-xs font-bold text-emerald-400 flex items-center gap-2 shadow-lg"
          >
            <CheckCircle className="h-4 w-4" />
            {actionSuccess}
          </motion.div>
        )}

        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-xl border border-red-500/30 bg-red-950/15 px-4 py-3.5 text-xs font-bold text-red-400 flex items-center gap-2 shadow-lg"
          >
            <AlertCircle className="h-4 w-4" />
            {actionError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* DEMO DATA BANNER (Only visible when store has no data) */}
      {isDatabaseEmpty && !loading && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" />
              Interactive Playground Sandbox
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              This organization does not have any active transaction records, payments, or bookings. Seed realistic historical sample records to instantly populate chart graphs, payment breakdowns, table booking frequencies, and table history records.
            </p>
          </div>
          <button
            onClick={handleSeedDemoData}
            disabled={actionLoading}
            className="rounded-xl bg-orange-600 px-5 py-3 text-xs font-bold text-white hover:bg-orange-500 transition shadow shrink-0 flex items-center justify-center gap-1.5"
          >
            {actionLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Seed Demo Analytics
          </button>
        </div>
      )}

      {/* TABS SELECTOR */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-6 py-3.5 text-xs font-bold transition flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'revenue'
              ? 'border-orange-500 text-white'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Revenue Reports
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-6 py-3.5 text-xs font-bold transition flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'bookings'
              ? 'border-orange-500 text-white'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Table Booking History
        </button>
      </div>

      {loading ? (
        <div className="text-center py-24">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
          <p className="mt-4 text-xs text-slate-400 font-medium">Aggregating transactional records...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-900/30 bg-red-950/5 p-6 text-center text-red-400 flex flex-col items-center justify-center">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p className="text-sm font-bold">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="mt-4 rounded-xl bg-red-950/40 border border-red-900/30 px-4 py-2 text-xs font-bold hover:bg-red-900/40 transition"
          >
            Retry Fetch
          </button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* TAB 1: REVENUE REPORTS */}
          {activeTab === 'revenue' && (
            <motion.div
              key="revenue"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* METRICS PANEL */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow flex flex-col justify-between">
                  <div className="flex justify-between items-start text-slate-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Total Sales</span>
                    <DollarSign className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-white">${totalPeriodSales.toFixed(2)}</span>
                    <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-wide">
                      Filtered Period Total
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow flex flex-col justify-between">
                  <div className="flex justify-between items-start text-slate-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Cash Revenue</span>
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-white">${totalPeriodCash.toFixed(2)}</span>
                    <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-wide">
                      {totalPeriodSales > 0
                        ? `${Math.round((totalPeriodCash / totalPeriodSales) * 100)}% of Period Sales`
                        : '0% of Period Sales'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow flex flex-col justify-between">
                  <div className="flex justify-between items-start text-slate-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Online Revenue</span>
                    <CreditCard className="h-4 w-4 text-cyan-500" />
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-white">${totalPeriodOnline.toFixed(2)}</span>
                    <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-wide">
                      {totalPeriodSales > 0
                        ? `${Math.round((totalPeriodOnline / totalPeriodSales) * 100)}% of Period Sales`
                        : '0% of Period Sales'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow flex flex-col justify-between">
                  <div className="flex justify-between items-start text-slate-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Transactions</span>
                    <ArrowRightLeft className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-white">{totalPeriodTransactions}</span>
                    <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-wide">
                      Avg Order: {totalPeriodTransactions > 0 ? `$${(totalPeriodSales / totalPeriodTransactions).toFixed(2)}` : '$0.00'}
                    </p>
                  </div>
                </div>
              </div>

              {/* FILTERS & GRAPH PANEL */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Graph Trend panel */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 shadow-xl lg:col-span-2 space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-white">Sales Revenue Trend</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Historical graphical visualization of sales records.</p>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {/* Period Filter */}
                      <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
                          <button
                            key={period}
                            onClick={() => setTimeframe(period)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition ${
                              timeframe === period
                                ? 'bg-orange-500 text-white shadow-md'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {period === 'daily' ? 'Day' : period === 'weekly' ? 'Wk' : period === 'monthly' ? 'Mo' : 'Yr'}
                          </button>
                        ))}
                      </div>

                      {/* Payment Filter */}
                      <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                        {(['all', 'cash', 'online'] as const).map((method) => (
                          <button
                            key={method}
                            onClick={() => setPaymentFilter(method)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition capitalize ${
                              paymentFilter === method
                                ? 'bg-orange-500 text-white shadow-md'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Line Chart */}
                  <div className="border border-slate-800/40 bg-slate-950/20 rounded-xl p-4 flex items-center justify-center">
                    {activeData.length > 0 ? (
                      renderLineChart()
                    ) : (
                      <div className="py-20 text-center text-slate-500">
                        <TrendingUp className="h-8 w-8 stroke-[1.5] mx-auto mb-2 text-slate-700" />
                        <p className="text-xs font-bold">No revenue records in this date range.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cash vs Online split breakdown pie/progress card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 shadow-xl flex flex-col justify-between gap-6">
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Payment Method Split</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Ratio distribution between cash sales and electronic cards.</p>
                  </div>

                  {totalPeriodSales > 0 ? (
                    <div className="space-y-6 my-auto">
                      {/* Simple Custom Progress bar graphic */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="flex items-center gap-1.5 text-emerald-400">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Cash Revenue
                          </span>
                          <span>${totalPeriodCash.toFixed(2)}</span>
                        </div>
                        <div className="h-3.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${(totalPeriodCash / totalPeriodSales) * 100}%` }}
                          />
                          <div
                            className="h-full bg-cyan-500"
                            style={{ width: `${(totalPeriodOnline / totalPeriodSales) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs font-bold pt-1">
                          <span className="flex items-center gap-1.5 text-cyan-400">
                            <span className="h-2 w-2 rounded-full bg-cyan-500" />
                            Online Payment
                          </span>
                          <span>${totalPeriodOnline.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Informative Stats */}
                      <div className="rounded-xl bg-slate-950 p-4 border border-slate-800/80 space-y-2.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold">Total Sales Value</span>
                          <span className="font-extrabold text-white">${totalPeriodSales.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold">Cash Ratio</span>
                          <span className="font-extrabold text-emerald-400">
                            {Math.round((totalPeriodCash / totalPeriodSales) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold">Online Ratio</span>
                          <span className="font-extrabold text-cyan-400">
                            {Math.round((totalPeriodOnline / totalPeriodSales) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-500 my-auto">
                      <HelpCircle className="h-8 w-8 stroke-[1.5] mx-auto mb-2 text-slate-700" />
                      <p className="text-xs font-bold">No transactions for payment distribution.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* DETAILED STATS TABLE */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 shadow-xl space-y-4">
                <div>
                  <h3 className="font-extrabold text-sm text-white">Aggregated Periodic Breakdown</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Itemized logs representing sales metrics gathered on a periodic basis.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                        <th className="py-3 px-4">Time Period</th>
                        <th className="py-3 px-4">Cash Sales</th>
                        <th className="py-3 px-4">Online Sales</th>
                        <th className="py-3 px-4">Total Revenue</th>
                        <th className="py-3 px-4">Volume (Count)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {activeData.length > 0 ? (
                        activeData
                          .slice()
                          .reverse()
                          .map((row, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-900/20 transition-all font-semibold"
                            >
                              <td className="py-3 px-4 text-white font-extrabold">{row.label}</td>
                              <td className="py-3 px-4 text-slate-400">${row.cash.toFixed(2)}</td>
                              <td className="py-3 px-4 text-slate-400">${row.online.toFixed(2)}</td>
                              <td className="py-3 px-4 text-orange-400 font-extrabold">${row.value.toFixed(2)}</td>
                              <td className="py-3 px-4 text-slate-500">{row.count} Orders</td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500">
                            No billing metrics to outline.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: TABLE BOOKING HISTORY */}
          {activeTab === 'bookings' && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* BOOKING STATS ROW */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow flex flex-col justify-between">
                  <div className="flex justify-between items-start text-slate-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Total Bookings</span>
                    <Calendar className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-white">{reservations.length}</span>
                    <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-wide">
                      Store-wide reservations
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-sky-950/20 bg-sky-950/5 p-5 shadow border-sky-900/30 flex flex-col justify-between">
                  <div className="flex justify-between items-start text-sky-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Confirmed</span>
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-sky-400">{statusCounts.confirmed}</span>
                    <p className="text-[9px] text-sky-500 font-bold mt-1 uppercase tracking-wide">
                      Awaiting Arrival
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-950/20 bg-emerald-950/5 p-5 shadow border-emerald-900/30 flex flex-col justify-between">
                  <div className="flex justify-between items-start text-emerald-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Seated / Completed</span>
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-emerald-400">{statusCounts.seated}</span>
                    <p className="text-[9px] text-emerald-500 font-bold mt-1 uppercase tracking-wide">
                      Currently Dining
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-red-950/20 bg-red-950/5 p-5 shadow border-red-900/30 flex flex-col justify-between">
                  <div className="flex justify-between items-start text-red-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Cancelled</span>
                    <X className="h-4 w-4" />
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-red-400">{statusCounts.cancelled}</span>
                    <p className="text-[9px] text-red-500 font-bold mt-1 uppercase tracking-wide">
                      Lost bookings
                    </p>
                  </div>
                </div>
              </div>

              {/* FREQUENCIES SUMMARY LISTS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Table Bookings count list */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 shadow-xl space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      <Table className="h-4 w-4 text-orange-500" />
                      Table Booking Frequency
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Total reservation check-ins grouped by individual table.</p>
                  </div>

                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                    {tableFrequencies.length > 0 ? (
                      tableFrequencies.map((row, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs border-b border-slate-800/40 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="h-5 w-5 bg-slate-950 rounded border border-slate-800 flex items-center justify-center text-[9px] font-bold text-orange-400">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-white">{row.tableNumber}</span>
                          </div>
                          <span className="font-extrabold text-slate-400">{row.count} Bookings</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 py-6 text-center">No table bookings recorded.</p>
                    )}
                  </div>
                </div>

                {/* Customer Booking count list */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 shadow-xl space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-orange-500" />
                      Customer Booking Frequency
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Most active guests ranked by table booking count.</p>
                  </div>

                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                    {customerFrequencies.length > 0 ? (
                      customerFrequencies.map((row, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs border-b border-slate-800/40 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="h-5 w-5 bg-slate-950 rounded border border-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-500">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-white">{row.name}</p>
                              <p className="text-[9px] text-slate-500 font-semibold">{row.phone}</p>
                            </div>
                          </div>
                          <span className="font-extrabold text-[#f59e0b] bg-orange-950/20 px-2 py-1 rounded-md text-[10px]">
                            {row.count} Booked
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 py-6 text-center">No customer reservations found.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* DETAILED BOOKINGS HISTORY TABLE */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Chronological Reservation Registry</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Full historical database log of customer dining bookings.</p>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    {/* Status filter dropdown */}
                    <select
                      value={reservationStatusFilter}
                      onChange={(e) => setReservationStatusFilter(e.target.value)}
                      className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 transition"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="seated">Seated</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    {/* Search query input */}
                    <input
                      type="text"
                      placeholder="Search name, phone, table..."
                      value={reservationSearch}
                      onChange={(e) => setReservationSearch(e.target.value)}
                      className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-orange-500 transition w-full sm:w-56"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Table</th>
                        <th className="py-3 px-4">Guests</th>
                        <th className="py-3 px-4">Reservation Time</th>
                        <th className="py-3 px-4">Notes</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {filteredReservations.length > 0 ? (
                        filteredReservations.map((res) => {
                          const dateObj = new Date(res.reservation_time);
                          const formattedDate = dateObj.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          });

                          return (
                            <tr key={res.id} className="hover:bg-slate-900/20 transition-all font-semibold">
                              <td className="py-3.5 px-4">
                                <p className="font-extrabold text-white">{res.customer?.name || 'Walk-in'}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{res.customer?.phone || 'N/A'}</p>
                              </td>
                              <td className="py-3.5 px-4 font-extrabold text-orange-400">
                                {res.RestaurantTable?.table_number || 'Unassigned'}
                              </td>
                              <td className="py-3.5 px-4 text-slate-300">{res.guest_count} Guests</td>
                              <td className="py-3.5 px-4 text-slate-400">{formattedDate}</td>
                              <td className="py-3.5 px-4 text-slate-500 max-w-[150px] truncate" title={res.notes || ''}>
                                {res.notes || '—'}
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`rounded-full border px-2.5 py-0.5 text-[9px] uppercase font-bold tracking-wider ${
                                    res.status === 'pending'
                                      ? 'border-amber-500/30 bg-amber-950/20 text-amber-400'
                                      : res.status === 'confirmed'
                                      ? 'border-sky-500/30 bg-sky-950/20 text-sky-400'
                                      : res.status === 'seated'
                                      ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400'
                                      : 'border-red-500/30 bg-red-950/20 text-red-400'
                                  }`}
                                >
                                  {res.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  {res.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleUpdateReservationStatus(res.id, 'confirmed')}
                                        disabled={actionLoading}
                                        className="rounded-lg bg-sky-950 border border-sky-900 text-sky-400 hover:bg-sky-900/40 p-1.5 transition"
                                        title="Confirm Booking"
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleUpdateReservationStatus(res.id, 'cancelled')}
                                        disabled={actionLoading}
                                        className="rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/40 p-1.5 transition"
                                        title="Cancel Booking"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </>
                                  )}

                                  {res.status === 'confirmed' && (
                                    <>
                                      <button
                                        onClick={() => handleUpdateReservationStatus(res.id, 'seated')}
                                        disabled={actionLoading}
                                        className="rounded-lg bg-emerald-950 border border-emerald-900 text-emerald-400 hover:bg-emerald-900/40 p-1.5 transition"
                                        title="Mark Seated"
                                      >
                                        <Clock className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleUpdateReservationStatus(res.id, 'cancelled')}
                                        disabled={actionLoading}
                                        className="rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/40 p-1.5 transition"
                                        title="Cancel Booking"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </>
                                  )}

                                  {(res.status === 'seated' || res.status === 'cancelled') && (
                                    <span className="text-[10px] text-slate-600 font-bold uppercase py-1 px-2">
                                      Closed
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500">
                            No reservations found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
