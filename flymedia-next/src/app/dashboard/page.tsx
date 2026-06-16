'use client';

import React, { useState, useEffect } from 'react';
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
  Laptop
} from 'lucide-react';

// Sparkline for dashboard widgets
function MiniSparkline({ points, strokeColor }: { points: number[]; strokeColor: string }) {
  const width = 120;
  const height = 30;
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

// Large SVG line chart for Dashboard Analytics
function DashboardSalesChart() {
  const points = [150, 220, 190, 380, 270, 420, 480];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const width = 550;
  const height = 150;
  const max = 500;
  const min = 0;
  const range = max - min;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * (width - 40) + 20;
    const y = height - ((p - min) / range) * (height - 40) - 20;
    return { x, y, val: p };
  });

  const linePath = `M ${coords.map((c) => `${c.x},${c.y}`).join(' L ')}`;
  const areaPath = `${linePath} L ${coords[coords.length - 1].x},${height - 15} L ${coords[0].x},${height - 15} Z`;

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
        {[100, 200, 300, 400].map((level) => {
          const y = height - (level / range) * (height - 40) - 20;
          return (
            <line
              key={level}
              x1="20"
              y1={y}
              x2={width - 20}
              y2={y}
              stroke="#1e293b"
              strokeWidth="0.75"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Shaded Area */}
        <path d={areaPath} fill="url(#dashboardAreaGrad)" />

        {/* Glowing Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {coords.map((c, i) => (
          <g key={i} className="group/dot cursor-pointer">
            <circle
              cx={c.x}
              cy={c.y}
              r="4"
              fill="#0f172a"
              stroke="#f59e0b"
              strokeWidth="1.5"
              className="transition duration-150 group-hover/dot:r-5.5"
            />
            <title>{`${days[i]}: $${c.val}`}</title>
          </g>
        ))}

        {/* Labels */}
        {coords.map((c, i) => (
          <text
            key={i}
            x={c.x}
            y={height - 2}
            textAnchor="middle"
            fill="#64748b"
            fontSize="9"
            fontWeight="600"
          >
            {days[i]}
          </text>
        ))}
      </svg>
    </div>
  );
}

// Donut Chart for Dashboard Analytics
function DashboardCategoryChart() {
  const categories = [
    { name: 'Main Course', percentage: 45, color: '#f59e0b' },
    { name: 'Beverages', percentage: 25, color: '#06b6d4' },
    { name: 'Appetizers', percentage: 15, color: '#10b981' },
    { name: 'Desserts', percentage: 10, color: '#a855f7' },
    { name: 'Others', percentage: 5, color: '#64748b' },
  ];

  const radius = 34;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercentage = 0;

  return (
    <div className="flex items-center justify-between gap-5 h-full py-2">
      <div className="relative w-24 h-24 shrink-0">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          {categories.map((cat, i) => {
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
          <span className="text-[8px] text-slate-400 font-semibold tracking-wider uppercase leading-none">Sales</span>
          <span className="text-[11px] font-bold text-white mt-0.5">$4.8k</span>
        </div>
      </div>

      <div className="flex-1 space-y-1 text-xs">
        {categories.map((cat, i) => (
          <div key={i} className="flex items-center justify-between font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-slate-400 truncate max-w-[100px]">{cat.name}</span>
            </div>
            <span className="text-white">{cat.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSyncSeed = async () => {
    setSyncLoading(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/db/sync', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setSyncMessage('Database seeded successfully! Demo credentials: owner@fordering.com / password123');
      } else {
        setSyncMessage('Sync failed: ' + data.message);
      }
    } catch (err) {
      setSyncMessage('Failed to trigger database sync API.');
    } finally {
      setSyncLoading(false);
    }
  };

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
        
        {/* SaaS Initialize Alerts */}
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
        </div>

        {/* Dashboard Widgets Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          
          <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-xs font-semibold text-slate-400">Today's Sales</p>
              <p className="mt-2 text-2xl font-black text-white">$1,850.50</p>
              <p className="mt-1.5 text-[10px] text-slate-500 font-semibold">32 completed POS orders</p>
            </div>
            <MiniSparkline points={[1100, 1800, 1300, 2200, 1600, 2400, 1850.5]} strokeColor="#10b981" />
          </div>

          <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-xs font-semibold text-slate-400">Active Tables</p>
              <p className="mt-2 text-2xl font-black text-white">4 / 12</p>
              <p className="mt-1.5 text-[10px] text-slate-500 font-semibold">currently occupied tables</p>
            </div>
            <MiniSparkline points={[2, 6, 4, 8, 5, 9, 4]} strokeColor="#f59e0b" />
          </div>

          <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-xs font-semibold text-slate-400">Staff Terminals</p>
              <p className="mt-2 text-2xl font-black text-white">3 Active</p>
              <p className="mt-1.5 text-[10px] text-slate-500 font-semibold">cashiers & waiters logged in</p>
            </div>
            <MiniSparkline points={[1, 3, 2, 4, 3, 5, 3]} strokeColor="#06b6d4" />
          </div>

          <div className="rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-xs font-semibold text-slate-400">Service Status</p>
              <p className="mt-2 text-2xl font-black text-emerald-400">ONLINE</p>
              <p className="mt-1.5 text-[10px] text-slate-500 font-semibold">Socket.IO & BullMQ status healthy</p>
            </div>
            <MiniSparkline points={[100, 100, 100, 100, 100, 100, 100]} strokeColor="#a855f7" />
          </div>

        </div>

        {/* Visual Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-8 rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Revenue Trend</h3>
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#f59e0b]" /> Live Updates
              </span>
            </div>
            <DashboardSalesChart />
          </div>

          <div className="lg:col-span-4 rounded-2xl border border-[#1e293b]/60 bg-[#0c101b] p-5 shadow-xl flex flex-col justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Category Metrics</h3>
            <DashboardCategoryChart />
          </div>

        </div>

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
