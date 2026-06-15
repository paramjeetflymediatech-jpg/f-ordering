'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  Users,
  Utensils,
  Tag,
  MonitorPlay,
  LogOut,
  Menu,
  X,
  Sparkles,
  Building,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-400 font-semibold">Loading Portal...</p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = (session?.user as any)?.roles?.includes('Super Admin');

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: TrendingUp },
    { name: 'Menu Manager', href: '/dashboard/menu', icon: Utensils },
    { name: 'Offers & Coupons', href: '/dashboard/offers', icon: Tag },
    { name: 'Customer Database', href: '/dashboard/customers', icon: Users },
  ];

  if (isSuperAdmin) {
    navItems.push({ name: 'Super Admin Panel', href: '/dashboard/super-admin', icon: Building });
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      
      {/* 1. SIDEBAR (DESKTOP) */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 border-r border-slate-800 shrink-0">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-900">
          <TrendingUp className="h-6 w-6 text-orange-500" />
          <span className="text-lg font-bold text-white tracking-wider">
            F-Ordering <span className="text-orange-500">HQ</span>
          </span>
        </div>

        {/* User Block */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/20">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Staff</p>
          <p className="text-sm font-semibold text-white mt-1 truncate">{session?.user?.name}</p>
          <p className="text-[10px] text-orange-400 font-medium uppercase mt-0.5">
            {(session?.user as any)?.roles?.[0] || 'Administrator'}
          </p>
        </div>

        {/* Nav list */}
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/10'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}

          <Link
            href="/pos"
            target="_blank"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <MonitorPlay className="h-4 w-4 text-emerald-400" />
            Launch POS
          </Link>
        </nav>

        {/* Footer logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-950/30 border border-red-900/20 py-2.5 text-xs font-bold text-red-400 hover:bg-red-900/30 transition"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER BAR */}
      <div className="flex flex-col flex-1 min-h-screen">
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6 md:hidden shrink-0">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-orange-500" />
            <span className="text-base font-bold text-white">F-Ordering HQ</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-300 hover:bg-slate-850"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* MAIN ROUTE CONTENT */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/80 backdrop-blur-sm">
          <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between">
            <div>
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900">
                <span className="text-base font-bold text-white">F-Ordering HQ</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="p-4 space-y-1.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                        isActive
                          ? 'bg-orange-500 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
                <Link
                  href="/pos"
                  target="_blank"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  <MonitorPlay className="h-4 w-4 text-emerald-400" />
                  Launch POS
                </Link>
              </nav>
            </div>

            <div className="p-4 border-t border-slate-800">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-950/30 py-2.5 text-xs font-bold text-red-400"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)}></div>
        </div>
      )}

    </div>
  );
}
