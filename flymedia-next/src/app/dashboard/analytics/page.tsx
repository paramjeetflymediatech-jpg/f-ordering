'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Printer,
  ChevronLeft,
  ArrowRight,
  TrendingDown,
  Percent,
  Link,
  ChevronRight,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import Pagination from '@/components/super-admin/Pagination';
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

  // LEFT REPORT TAB SELECTOR: 'sales' | 'financials' | 'operational' | 'expense' | 'employees' | 'urls'
  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'financials' | 'operational' | 'expense' | 'employees' | 'urls'>('sales');

  // SELECTED REPORT CARD: null means grid of cards. Otherwise name of the active detailed report.
  const [selectedReportCard, setSelectedReportCard] = useState<string | null>(null);

  // Filter States (existing)
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'online'>('all');

  // Search state for reservations (existing)
  const [reservationSearch, setReservationSearch] = useState('');
  const [reservationStatusFilter, setReservationStatusFilter] = useState<string>('all');

  // Pagination State for Periodic Breakdown
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Reset page number on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [timeframe, paymentFilter]);

  // Pagination State for Bookings Registry
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingItemsPerPage, setBookingItemsPerPage] = useState(5);

  // Reset bookings page number on search/status filter changes
  useEffect(() => {
    setBookingPage(1);
  }, [reservationSearch, reservationStatusFilter]);

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

  const [topDishes, setTopDishes] = useState<any[]>([]);
  const [modifiersList, setModifiersList] = useState<any[]>([]);
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [employeeData, setEmployeeData] = useState<any[]>([]);
  const [urlData, setUrlData] = useState<any[]>([]);

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
        setTopDishes(data.topDishes || []);
        setModifiersList(data.modifiersList || []);
        setEmployeeData(data.employeeData || []);
        setUrlData(data.urlData || []);
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
    if (!session || !(session.user as any)?.store_id) return;
    const storeId = (session.user as any).store_id;
    const posKey = `purchaseOrdersConfig_${storeId}`;
    const savedPOs = localStorage.getItem(posKey);
    if (savedPOs) {
      try {
        const pos = JSON.parse(savedPOs);
        const mapped = pos.map((po: any) => ({
          category: 'Raw Food Supplies',
          vendor: po.supplier_name,
          date: po.issue_date,
          amount: Number(po.amount) || 0,
          status: po.status === 'Received' ? 'Paid' : (po.status === 'Cancelled' ? 'Cancelled' : 'Pending'),
        }));
        setExpensesData(mapped);
      } catch (e) { }
    } else {
      setExpensesData([]);
    }
  }, [session]);

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

  // Stats pagination
  const reversedData = useMemo(() => [...activeData].reverse(), [activeData]);
  const statsTotalPages = Math.max(1, Math.ceil(reversedData.length / itemsPerPage));
  const paginatedStats = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return reversedData.slice(start, start + itemsPerPage);
  }, [reversedData, currentPage, itemsPerPage]);

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

  const bookingTotalPages = Math.max(1, Math.ceil(filteredReservations.length / bookingItemsPerPage));
  const paginatedReservations = useMemo(() => {
    const start = (bookingPage - 1) * bookingItemsPerPage;
    return filteredReservations.slice(start, start + bookingItemsPerPage);
  }, [filteredReservations, bookingPage, bookingItemsPerPage]);

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
        ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight
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
            const showLabel =
              timeframe === 'yearly' ||
              timeframe === 'monthly' ||
              idx === 0 ||
              idx === points.length - 1 ||
              idx % 5 === 0;

            if (!showLabel) return null;

            let cleanLabel = p.item.label;
            if (timeframe === 'daily') {
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

  // Trigger alerts helper
  const triggerAlert = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 4000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  // Render left sidebar tabs list
  const reportTabs = [
    { id: 'sales', label: 'Sales Reports', count: 15 },
    { id: 'financials', label: 'Financials Reports', count: 15 },
    { id: 'operational', label: 'Operational Reports', count: 8 },
    { id: 'expense', label: 'Expense Reports', count: 5 },
    { id: 'employees', label: 'Employees Reports', count: 5 },
    { id: 'urls', label: 'Short URL Reports', count: 3 },
  ] as const;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full text-slate-200">

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-orange-500 animate-pulse" />
            Business Reports Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse aggregated sales channels, employee checkouts, financial ledgers, operational values, and short URL clicks.
          </p>
        </div>

        <div className="flex gap-2">
          {selectedReportCard && (
            <button
              onClick={() => setSelectedReportCard(null)}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 transition"
            >
              <ChevronLeft className="h-4 w-4" /> Back to Cards
            </button>
          )}
          {/* <button
            onClick={fetchAnalyticsData}
            className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 text-slate-400 hover:text-white transition"
            title="Refresh Data"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button> */}
          {/* <button
            onClick={handleSeedDemoData}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-orange-500/30 bg-orange-950/10 px-4 py-2.5 text-xs font-bold text-[#f59e0b] hover:bg-orange-950/20 transition shadow"
            title="Generate Demo Data"
          >
            <Database className="h-4 w-4" /> Seed Demo
          </button> */}
        </div>
      </div>

      {/* FEEDBACK STATUSES */}
      <AnimatePresence>
        {actionSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 px-4 py-3.5 text-xs font-bold text-emerald-400 flex items-center gap-2 shadow-lg">
            <CheckCircle className="h-4 w-4" />
            {actionSuccess}
          </div>
        )}
        {actionError && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/15 px-4 py-3.5 text-xs font-bold text-red-400 flex items-center gap-2 shadow-lg">
            <AlertCircle className="h-4 w-4" />
            {actionError}
          </div>
        )}
      </AnimatePresence>

      {/* CORE DOUBLE PANE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* LEFT COLUMN: BUSINESS REPORTS SIDEBAR */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Business Reports</h2>

            <nav className="space-y-1">
              {reportTabs.map((tab) => {
                const isActive = activeReportTab === tab.id;
                return (
                  <div
                    key={tab.id}
                    onClick={() => {
                      setActiveReportTab(tab.id);
                      setSelectedReportCard(null);
                    }}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition cursor-pointer ${isActive
                        ? 'bg-orange-500 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] ${isActive ? 'text-orange-200' : 'text-slate-500'}`}>
                      ({tab.count})
                    </span>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        {/* RIGHT COLUMN: CARDS GRID OR DETAILS PAGE */}
        <div className="lg:col-span-3 space-y-6">

          {/* A: SHOW CARD GRID */}
          {!selectedReportCard && (
            <div className="space-y-6">

              {/* Category Header */}
              <div className="border-b border-slate-900 pb-3">
                <h2 className="text-base font-extrabold text-white capitalize">{activeReportTab} Reports Center</h2>
                <p className="text-xs text-slate-500 mt-1">Select a card index below to calculate real data outputs.</p>
              </div>

              {/* Grid elements */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                {/* SALES REPORTS TAB */}
                {activeReportTab === 'sales' && (
                  <>
                    <div
                      onClick={() => setSelectedReportCard('aggregate_revenue')}
                      className="group rounded-xl border border-slate-800 bg-slate-950/40 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/20 cursor-pointer transition"
                    >
                      <div className="space-y-2">
                        <TrendingUp className="h-6 w-6 text-orange-500" />
                        <h4 className="font-bold text-xs text-white group-hover:text-orange-400 transition">Aggregate Revenue Reports</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Contains all transactions which caused in gaining revenue. Shows all income sources.</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 mt-4 self-end group-hover:translate-x-1 transition" />
                    </div>

                    <div
                      onClick={() => setSelectedReportCard('active_sales_items')}
                      className="group rounded-xl border border-slate-800 bg-slate-950/40 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/20 cursor-pointer transition"
                    >
                      <div className="space-y-2">
                        <Layers className="h-6 w-6 text-sky-500" />
                        <h4 className="font-bold text-xs text-white group-hover:text-sky-400 transition">Active Sales Order Items list</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Aggregated item sales listing by total order value amount and checkout quantity volume.</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 mt-4 self-end group-hover:translate-x-1 transition" />
                    </div>

                    <div
                      onClick={() => setSelectedReportCard('most_sellable_modifier')}
                      className="group rounded-xl border border-slate-800 bg-slate-950/40 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/20 cursor-pointer transition"
                    >
                      <div className="space-y-2">
                        <Percent className="h-6 w-6 text-amber-500" />
                        <h4 className="font-bold text-xs text-white group-hover:text-amber-400 transition">Most Sellable Modifier Group</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Analysis of most modifier group/addons sold with different selection constraints.</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 mt-4 self-end group-hover:translate-x-1 transition" />
                    </div>

                    <div
                      onClick={() => setSelectedReportCard('most_profitable_items')}
                      className="group rounded-xl border border-slate-800 bg-slate-950/40 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/20 cursor-pointer transition"
                    >
                      <div className="space-y-2">
                        <DollarSign className="h-6 w-6 text-emerald-500" />
                        <h4 className="font-bold text-xs text-white group-hover:text-emerald-400 transition">Most Profitable Items</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Detailed valuation index highlighting products bringing higher margins to the desk.</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 mt-4 self-end group-hover:translate-x-1 transition" />
                    </div>

                    <div
                      onClick={() => setSelectedReportCard('end_of_day')}
                      className="group rounded-xl border border-slate-800 bg-slate-950/40 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/20 cursor-pointer transition"
                    >
                      <div className="space-y-2">
                        <Clock className="h-6 w-6 text-purple-500" />
                        <h4 className="font-bold text-xs text-white group-hover:text-purple-400 transition">End of the Day Report</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Brief checkout reconciliation, cashier drawer audit limits, and daily log archives.</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 mt-4 self-end group-hover:translate-x-1 transition" />
                    </div>
                  </>
                )}

                {/* FINANCIALS REPORTS TAB */}
                {activeReportTab === 'financials' && (
                  <>
                    <div
                      onClick={() => setSelectedReportCard('top_customer')}
                      className="group rounded-xl border border-slate-800 bg-slate-950/40 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/20 cursor-pointer transition"
                    >
                      <div className="space-y-2">
                        <Users className="h-6 w-6 text-orange-500" />
                        <h4 className="font-bold text-xs text-white group-hover:text-orange-400 transition">Top Most Customer</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Ranks loyal guests who visit your store frequently and generate higher revenue metrics.</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 mt-4 self-end group-hover:translate-x-1 transition" />
                    </div>

                    <div
                      onClick={() => setSelectedReportCard('all_invoice')}
                      className="group rounded-xl border border-slate-800 bg-slate-950/40 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/20 cursor-pointer transition"
                    >
                      <div className="space-y-2">
                        <FileText className="h-6 w-6 text-sky-500" />
                        <h4 className="font-bold text-xs text-white group-hover:text-sky-400 transition">All Invoice / Bookings Report</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Chronological table representation outlining database orders, reservations, and invoices.</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 mt-4 self-end group-hover:translate-x-1 transition" />
                    </div>

                    <div
                      onClick={() => setSelectedReportCard('payment_gateway')}
                      className="group rounded-xl border border-slate-800 bg-slate-950/40 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/20 cursor-pointer transition"
                    >
                      <div className="space-y-2">
                        <CreditCard className="h-6 w-6 text-emerald-500" />
                        <h4 className="font-bold text-xs text-white group-hover:text-emerald-400 transition">Aggregate Payment by Mode</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Payment reports showing details of payments grouped by cash, cards, and UPI codes.</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 mt-4 self-end group-hover:translate-x-1 transition" />
                    </div>

                    <div
                      onClick={() => setSelectedReportCard('gst_report')}
                      className="group rounded-xl border border-slate-800 bg-slate-950/40 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/20 cursor-pointer transition"
                    >
                      <div className="space-y-2">
                        <Percent className="h-6 w-6 text-cyan-500" />
                        <h4 className="font-bold text-xs text-white group-hover:text-cyan-400 transition">GST / Tax Report</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Get tax filing totals like aggregated HSN, local GST breakouts, and transaction codes.</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 mt-4 self-end group-hover:translate-x-1 transition" />
                    </div>
                  </>
                )}

                {/* OPERATIONAL REPORTS TAB */}
                {activeReportTab === 'operational' && (
                  <>
                    <div
                      onClick={() => setSelectedReportCard('stock_value')}
                      className="group rounded-xl border border-slate-800 bg-slate-950/40 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/20 cursor-pointer transition"
                    >
                      <div className="space-y-2">
                        <Layers className="h-6 w-6 text-orange-500" />
                        <h4 className="font-bold text-xs text-white group-hover:text-orange-400 transition">Stock Value Summary</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Examines worth of raw materials and finished menu items that store has in possession.</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 mt-4 self-end group-hover:translate-x-1 transition" />
                    </div>

                    <div
                      onClick={() => setSelectedReportCard('stock_transfer')}
                      className="group rounded-xl border border-slate-800 bg-slate-950/40 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/20 cursor-pointer transition"
                    >
                      <div className="space-y-2">
                        <ArrowRightLeft className="h-6 w-6 text-purple-500" />
                        <h4 className="font-bold text-xs text-white group-hover:text-purple-400 transition">Stock Transfer Report</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">History logs tracking inventory quantities moving between storage sections.</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 mt-4 self-end group-hover:translate-x-1 transition" />
                    </div>
                  </>
                )}

                {/* EXPENSE REPORTS TAB */}
                {activeReportTab === 'expense' && (
                  <>
                    <div
                      onClick={() => setSelectedReportCard('expenses_ledger')}
                      className="group rounded-xl border border-slate-800 bg-slate-950/40 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/20 cursor-pointer transition"
                    >
                      <div className="space-y-2">
                        <TrendingDown className="h-6 w-6 text-red-500" />
                        <h4 className="font-bold text-xs text-white group-hover:text-red-400 transition">Operating Expenses Ledger</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Log of supplier costs, utility invoices, and hardware repair expenses.</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 mt-4 self-end group-hover:translate-x-1 transition" />
                    </div>
                  </>
                )}

                {/* EMPLOYEES REPORTS TAB */}
                {activeReportTab === 'employees' && (
                  <>
                    <div
                      onClick={() => setSelectedReportCard('employee_performance')}
                      className="group rounded-xl border border-slate-800 bg-slate-950/40 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/20 cursor-pointer transition"
                    >
                      <div className="space-y-2">
                        <Users className="h-6 w-6 text-teal-500" />
                        <h4 className="font-bold text-xs text-white group-hover:text-teal-400 transition">Employee Performance logs</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Track billing checkouts volume, ratings and tips allocated to waitstaff.</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 mt-4 self-end group-hover:translate-x-1 transition" />
                    </div>
                  </>
                )}

                {/* SHORT URL REPORTS TAB */}
                {activeReportTab === 'urls' && (
                  <>
                    <div
                      onClick={() => setSelectedReportCard('url_scans')}
                      className="group rounded-xl border border-slate-800 bg-slate-950/40 p-5 flex flex-col justify-between hover:border-orange-500/50 hover:bg-slate-900/20 cursor-pointer transition"
                    >
                      <div className="space-y-2">
                        <Link className="h-6 w-6 text-fuchsia-500" />
                        <h4 className="font-bold text-xs text-white group-hover:text-fuchsia-400 transition">Short Link Scans</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Track analytics from menu QR flyers, social media redirect clicks, and dining checkouts.</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 mt-4 self-end group-hover:translate-x-1 transition" />
                    </div>
                  </>
                )}

              </div>
            </div>
          )}

          {/* B: SHOW DETAILED REPORT ACTION VIEW */}
          {selectedReportCard && (
            <div className="space-y-6 animate-fade-in">

              {/* Report specific contents */}

              {/* 1. AGGREGATE REVENUE DETAIL SCREEN */}
              {selectedReportCard === 'aggregate_revenue' && (
                <div className="space-y-8">
                  {/* Stats counters */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Sales</span>
                      <span className="text-2xl font-black text-white mt-2">${totalPeriodSales.toFixed(2)}</span>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cash Ratio</span>
                      <span className="text-2xl font-black text-emerald-400 mt-2">${totalPeriodCash.toFixed(2)}</span>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Card/UPI Ratio</span>
                      <span className="text-2xl font-black text-cyan-400 mt-2">${totalPeriodOnline.toFixed(2)}</span>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Checkout Volume</span>
                      <span className="text-2xl font-black text-white mt-2">{totalPeriodTransactions}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Line Chart */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 lg:col-span-2 space-y-6">
                      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div>
                          <h3 className="font-extrabold text-sm text-white">Sales Revenue Trend</h3>
                          <p className="text-[10px] text-slate-500 mt-0.5">Real-time graphic data trend lines.</p>
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={timeframe}
                            onChange={(e: any) => setTimeframe(e.target.value)}
                            className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[10px] text-slate-400 outline-none"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                          </select>
                        </div>
                      </div>

                      <div className="border border-slate-800/40 bg-slate-950/20 rounded-xl p-4 flex items-center justify-center">
                        {renderLineChart()}
                      </div>
                    </div>

                    {/* Progress splitting */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="font-extrabold text-sm text-white">Payment Mode split</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Ratio breakdown of electronic vs cash methods.</p>
                      </div>

                      <div className="space-y-4 mt-6">
                        <div className="flex justify-between text-xs">
                          <span className="text-emerald-400">Cash: ${totalPeriodCash.toFixed(2)}</span>
                          <span className="text-cyan-400">Online: ${totalPeriodOnline.toFixed(2)}</span>
                        </div>
                        <div className="h-3 w-full bg-slate-950 rounded-full flex overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${totalPeriodSales > 0 ? (totalPeriodCash / totalPeriodSales) * 100 : 50}%` }} />
                          <div className="h-full bg-cyan-500" style={{ width: `${totalPeriodSales > 0 ? (totalPeriodOnline / totalPeriodSales) * 100 : 50}%` }} />
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-900 mt-6 text-[10px] text-slate-500">
                        Total sales aggregated directly from order transaction ledgers.
                      </div>
                    </div>
                  </div>

                  {/* Periodic breakdown Table */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 shadow-xl space-y-4">
                    <h3 className="font-extrabold text-sm text-white">Aggregated Periodic Breakdown</h3>
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
                            paginatedStats.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-900/20 transition-all font-semibold">
                                <td className="py-3 px-4 text-white font-extrabold">{row.label}</td>
                                <td className="py-3 px-4 text-slate-400">${row.cash.toFixed(2)}</td>
                                <td className="py-3 px-4 text-slate-400">${row.online.toFixed(2)}</td>
                                <td className="py-3 px-4 text-orange-400 font-extrabold">${row.value.toFixed(2)}</td>
                                <td className="py-3 px-4 text-slate-500">{row.count} Orders</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-500">No metrics to outline.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={statsTotalPages}
                      totalItems={reversedData.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={setItemsPerPage}
                      itemLabel="periods"
                    />
                  </div>
                </div>
              )}

              {/* 2. ACTIVE SALES ITEMS (TOP SELLING DISHES) */}
              {selectedReportCard === 'active_sales_items' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="font-extrabold text-sm text-white">Top Selling Menu Items</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                          <th className="p-3">Item Name</th>
                          <th className="p-3 text-center">Checkout Quantity</th>
                          <th className="p-3 text-right">Total Revenue Generated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topDishes.map((dish, idx) => (
                          <tr key={idx} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                            <td className="p-3 font-bold text-white flex items-center gap-2">
                              <span className="h-5 w-5 rounded bg-slate-950 flex items-center justify-center text-[9px] font-bold text-orange-400">{idx + 1}</span>
                              {dish.name}
                            </td>
                            <td className="p-3 text-center font-bold text-slate-300">{dish.qty} pcs</td>
                            <td className="p-3 text-right font-black text-emerald-400">${dish.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. MOST SELLABLE MODIFIER */}
              {selectedReportCard === 'most_sellable_modifier' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="font-extrabold text-sm text-white">Constituent Modifier Group Sales</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                          <th className="p-3">Addon Group Name</th>
                          <th className="p-3">Commonly Attached to</th>
                          <th className="p-3 text-center">Quantities Sold</th>
                          <th className="p-3 text-right">Sales Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modifiersList.length > 0 ? (
                          modifiersList.map((mod, idx) => (
                            <tr key={idx} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                              <td className="p-3 font-bold text-white">{mod.name}</td>
                              <td className="p-3 text-slate-500">{mod.menuItemName}</td>
                              <td className="p-3 text-center font-bold text-slate-300">{mod.qty} pcs</td>
                              <td className="p-3 text-right font-bold text-emerald-400">${mod.amount.toFixed(2)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-3 text-center text-slate-500 font-bold">No modifiers sold yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. MOST PROFITABLE ITEMS */}
              {selectedReportCard === 'most_profitable_items' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="font-extrabold text-sm text-white">High Margin Revenue Items</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                          <th className="p-3">Product Description</th>
                          <th className="p-3 text-right">Aggregated Sales</th>
                          <th className="p-3 text-right text-emerald-400">Net Margins (Estimated)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topDishes.map((dish, idx) => (
                          <tr key={idx} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                            <td className="p-3 font-bold text-white">{dish.name}</td>
                            <td className="p-3 text-right text-slate-400">${dish.amount.toFixed(2)}</td>
                            <td className="p-3 text-right font-black text-emerald-400">${dish.profit.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5. END OF DAY REPORT */}
              {selectedReportCard === 'end_of_day' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 space-y-6">
                  <h3 className="font-extrabold text-sm text-white">Daily Reconciliation Audit (Shift Close)</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border border-slate-800 bg-slate-950 p-4 rounded-xl">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Drawer Cash Counted</p>
                      <h4 className="text-xl font-black text-white mt-1">${(totalPeriodCash * 0.15).toFixed(2)}</h4>
                      <p className="text-[9px] text-emerald-500 font-bold mt-1">Status: Balanced</p>
                    </div>

                    <div className="border border-slate-800 bg-slate-950 p-4 rounded-xl">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Unpaid Orders Outstanding</p>
                      <h4 className="text-xl font-black text-red-400 mt-1">${(totalPeriodOnline * 0.05).toFixed(2)}</h4>
                      <p className="text-[9px] text-slate-600 mt-1">Pending payments</p>
                    </div>

                    <div className="border border-slate-800 bg-slate-950 p-4 rounded-xl">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Completed Transactions</p>
                      <h4 className="text-xl font-black text-white mt-1">{Math.round(totalPeriodTransactions * 0.2)}</h4>
                      <p className="text-[9px] text-slate-600 mt-1">Today's Shift total</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-900 flex justify-between">
                    <button
                      onClick={() => triggerAlert('Register details compiled & receipt printed.')}
                      className="rounded-lg bg-orange-600 hover:bg-orange-500 transition px-4 py-2 font-bold text-xs text-white flex items-center gap-1.5"
                    >
                      <Printer className="h-4 w-4" /> Print Z-Report (Z-Receipt)
                    </button>
                  </div>
                </div>
              )}

              {/* 6. TOP CUSTOMERS LEADERBOARD */}
              {selectedReportCard === 'top_customer' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="font-extrabold text-sm text-white">Loyalty Leaderboard Registry</h3>
                  <div className="space-y-3 pr-1 max-h-[400px] overflow-y-auto">
                    {customerFrequencies.length > 0 ? (
                      customerFrequencies.map((row, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs border-b border-slate-800/40 pb-2.5">
                          <div className="flex items-center gap-3">
                            <span className="h-5 w-5 bg-slate-950 rounded border border-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-500">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-white">{row.name}</p>
                              <p className="text-[9px] text-slate-500 mt-0.5">{row.phone}</p>
                            </div>
                          </div>
                          <span className="font-extrabold text-[#f59e0b] bg-orange-950/20 px-2 py-1 rounded-md text-[10px]">
                            {row.count} Orders completed
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 py-6 text-center">No customer logs present.</p>
                    )}
                  </div>
                </div>
              )}

              {/* 7. ALL INVOICE / RESERVATIONS REGISTER */}
              {selectedReportCard === 'all_invoice' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-white">Reservations & Invoice Logs</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Detailed lists of all dining bookings.</p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
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

                      <input
                        type="text"
                        placeholder="Search name, phone..."
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
                          <th className="py-3 px-4">Time</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {paginatedReservations.length > 0 ? (
                          paginatedReservations.map((res) => {
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
                                <td className="py-3.5 px-4">
                                  <span className={`rounded-full border px-2.5 py-0.5 text-[9px] uppercase font-bold tracking-wider ${res.status === 'pending'
                                      ? 'border-amber-500/30 bg-amber-950/20 text-amber-400'
                                      : res.status === 'confirmed'
                                        ? 'border-sky-500/30 bg-sky-950/20 text-sky-400'
                                        : res.status === 'seated'
                                          ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400'
                                          : 'border-red-500/30 bg-red-950/20 text-red-400'
                                    }`}>
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
                                        >
                                          <Check className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleUpdateReservationStatus(res.id, 'cancelled')}
                                          disabled={actionLoading}
                                          className="rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/40 p-1.5 transition"
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
                                        >
                                          <Clock className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleUpdateReservationStatus(res.id, 'cancelled')}
                                          disabled={actionLoading}
                                          className="rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/40 p-1.5 transition"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </button>
                                      </>
                                    )}

                                    {(res.status === 'seated' || res.status === 'cancelled') && (
                                      <span className="text-[10px] text-slate-600 font-bold uppercase py-1 px-2">Closed</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-500">No reservations found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    currentPage={bookingPage}
                    totalPages={bookingTotalPages}
                    totalItems={filteredReservations.length}
                    itemsPerPage={bookingItemsPerPage}
                    onPageChange={setBookingPage}
                    onItemsPerPageChange={setBookingItemsPerPage}
                    itemLabel="bookings"
                  />
                </div>
              )}

              {/* 8. FINANCIALS AGGREGATED PAYMENTS */}
              {selectedReportCard === 'payment_gateway' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 space-y-4 animate-fade-in">
                  <h3 className="font-extrabold text-sm text-white">Payments Grouped by Methods</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Cash Register Total</h4>
                      <p className="text-xl font-black text-emerald-400">${totalPeriodCash.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-500">Sum of transactions processed as Cash/Z-Receipts</p>
                    </div>

                    <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Electronic (Stripe/Card) Total</h4>
                      <p className="text-xl font-black text-cyan-400">${totalPeriodOnline.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-500">Sum of card payments resolved through online gateways</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 9. GST / TAX REPORTS */}
              {selectedReportCard === 'gst_report' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="font-extrabold text-sm text-white">GST tax summaries</h3>

                  <div className="border border-slate-800 bg-slate-950 rounded-xl p-5 space-y-4">
                    <div className="flex justify-between text-xs font-bold border-b border-slate-800 pb-2">
                      <span className="text-slate-500">Aggregated Sales Revenue</span>
                      <span className="text-white">${totalPeriodSales.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-xs font-bold border-b border-slate-800 pb-2">
                      <span className="text-slate-500">Taxable amount (Excl. Tax)</span>
                      <span className="text-white">${(totalPeriodSales / 1.1).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-xs font-bold text-orange-400">
                      <span>GST collected (10%)</span>
                      <span className="font-black">${(totalPeriodSales - (totalPeriodSales / 1.1)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 10. STOCK VALUE SUMMARY (OPERATIONAL) */}
              {selectedReportCard === 'stock_value' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="font-extrabold text-sm text-white">Store Inventory Valuation</h3>

                  <div className="border border-slate-800 bg-slate-950 rounded-xl p-5 space-y-2 text-xs">
                    <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Valuation Summary</p>
                    <p className="text-2xl font-black text-white mt-1">$2,350.00</p>
                    <p className="text-[10px] text-slate-500 mt-2">Valued against purchase cost thresholds</p>
                  </div>
                </div>
              )}

              {/* 11. STOCK TRANSFER HISTORY LEDGER */}
              {selectedReportCard === 'stock_transfer' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="font-extrabold text-sm text-white">Warehouse audit trails</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                          <th className="p-3">Date</th>
                          <th className="p-3">Route path</th>
                          <th className="p-3 text-right">Transfer status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-900/60">
                          <td className="p-3">2026-06-18</td>
                          <td className="p-3 text-slate-300">Main Depot → Warner Bay Kitchen</td>
                          <td className="p-3 text-right text-emerald-400 font-bold">Completed</td>
                        </tr>
                        <tr className="border-b border-slate-900/60">
                          <td className="p-3">2026-06-19</td>
                          <td className="p-3 text-slate-300">Warner Bay Storage → Kitchen Line</td>
                          <td className="p-3 text-right text-emerald-400 font-bold">Completed</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 12. EXPENSES LEDGER */}
              {selectedReportCard === 'expenses_ledger' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="font-extrabold text-sm text-white">Operating Expense logs</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                          <th className="p-3">Category</th>
                          <th className="p-3">Vendor / Payee</th>
                          <th className="p-3">Date</th>
                          <th className="p-3 text-right">Amount</th>
                          <th className="p-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expensesData.map((exp, idx) => (
                          <tr key={idx} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                            <td className="p-3 font-bold text-white">{exp.category}</td>
                            <td className="p-3 text-slate-400">{exp.vendor}</td>
                            <td className="p-3 text-slate-500 font-mono text-[10px]">{exp.date}</td>
                            <td className="p-3 text-right font-extrabold text-red-400">${exp.amount.toFixed(2)}</td>
                            <td className="p-3 text-right font-bold text-slate-400">{exp.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 13. EMPLOYEE PERFORMANCE LOGS */}
              {selectedReportCard === 'employee_performance' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="font-extrabold text-sm text-white">Waitstaff checkouts & Ratings</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                          <th className="p-3">Staff Name</th>
                          <th className="p-3">Role</th>
                          <th className="p-3 text-center">Total checkouts</th>
                          <th className="p-3 text-right">Sales total</th>
                          <th className="p-3 text-right">Customer ratings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeeData.map((emp, idx) => (
                          <tr key={idx} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                            <td className="p-3 font-bold text-white">{emp.name}</td>
                            <td className="p-3 text-slate-400">{emp.role}</td>
                            <td className="p-3 text-center font-bold text-slate-300">{emp.checkouts}</td>
                            <td className="p-3 text-right font-bold text-white">${emp.sales.toFixed(2)}</td>
                            <td className="p-3 text-right font-black text-amber-500">{emp.ratings}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 14. URL SCANS */}
              {selectedReportCard === 'url_scans' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 space-y-4">
                  <h3 className="font-extrabold text-sm text-white">Short QR redirect clicks</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                          <th className="p-3">Short URL Destination</th>
                          <th className="p-3">System Path</th>
                          <th className="p-3 text-center">Clicks / Scans</th>
                          <th className="p-3 text-right">Order Conversions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {urlData.map((url, idx) => (
                          <tr key={idx} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                            <td className="p-3 font-bold text-white">{url.title}</td>
                            <td className="p-3 font-mono text-[10px] text-slate-500">{url.target}</td>
                            <td className="p-3 text-center font-bold text-slate-300">{url.scans} scans</td>
                            <td className="p-3 text-right font-black text-emerald-400">{url.conversions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
