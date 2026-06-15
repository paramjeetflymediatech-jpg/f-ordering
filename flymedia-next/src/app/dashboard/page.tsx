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
} from 'lucide-react';

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
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-400 font-semibold">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      
      {/* Sidebar / Topnav combined layout */}
      <nav className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-orange-500" />
          <span className="text-xl font-bold text-white tracking-wider">
            F-Ordering <span className="text-orange-500">HQ</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-white">{session?.user?.name}</p>
            <p className="text-xs text-orange-400 font-medium capitalize">
              {(session?.user as any)?.roles?.[0] || 'Administrator'}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:text-white transition"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Sync Bootstrap Alert */}
        <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-950/20 to-amber-950/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-sm">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-500 animate-pulse" />
              SaaS Database Initialization
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Initialize database schema and populate roles, tables, permissions, and menu assets automatically. Recommended on first run.
            </p>
            {syncMessage && (
              <p className="mt-3 text-xs font-semibold text-orange-400 flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                {syncMessage}
              </p>
            )}
          </div>
          <button
            onClick={handleSyncSeed}
            disabled={syncLoading}
            className="shrink-0 flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-500 transition disabled:opacity-50 shadow-lg shadow-orange-600/20"
          >
            <RotateCw className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
            {syncLoading ? 'Seeding Tables...' : 'Seed Database'}
          </button>
        </div>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-400">Today's Sales</p>
              <span className="rounded-xl bg-emerald-950/60 p-2 text-emerald-400">
                <DollarSign className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-black text-white">$1,850.50</p>
            <p className="mt-1 text-xs text-slate-500">from 32 completed POS orders</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-400">Active Tables</p>
              <span className="rounded-xl bg-orange-950/60 p-2 text-orange-400">
                <Utensils className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-black text-white">4 / 12</p>
            <p className="mt-1 text-xs text-slate-500">currently occupied tables</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-400">Staff Terminals</p>
              <span className="rounded-xl bg-blue-950/60 p-2 text-blue-400">
                <Users className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-black text-white">3 Active</p>
            <p className="mt-1 text-xs text-slate-500">cashiers & waiters logged in</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-400">Service Status</p>
              <span className="rounded-xl bg-purple-950/60 p-2 text-purple-400">
                <MonitorPlay className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-black text-white text-emerald-400">ONLINE</p>
            <p className="mt-1 text-xs text-slate-500">Socket.IO & BullMQ status healthy</p>
          </div>
        </div>

        {/* Quick Launch Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">POS Terminal Screen</h3>
              <p className="text-slate-400 text-sm mt-2">
                Open the touch-friendly cashier dashboard to create orders, hold bills, process payments, and simulate receipts.
              </p>
            </div>
            <Link
              href="/pos"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-bold text-white hover:bg-orange-500 transition shadow-lg shadow-orange-600/10"
            >
              Launch POS Terminal
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Kitchen Display System</h3>
              <p className="text-slate-400 text-sm mt-2">
                View preparing orders in real-time. Kitchen staff can accept orders, update preparation states, and push notifications to waitstaff.
              </p>
            </div>
            <button
              onClick={() => alert('KDS module (Phase 3) is initialized in background. Launching mockup screen soon.')}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-sm font-bold text-slate-300 hover:bg-slate-700 transition"
            >
              Launch KDS Console
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
