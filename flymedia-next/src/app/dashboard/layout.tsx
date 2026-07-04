'use client';

import React, { useState, Suspense } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  TrendingUp,
  Users,
  Utensils,
  Tag,
  MonitorPlay,
  LogOut,
  CreditCard,
  Layers,
  Calendar,
  Percent,
  Gift,
  Truck,
  Sun,
  Moon,
  Image,
  Menu as MenuIcon,
  X,
  Building,
  Table,
  History,
  BarChart3,
  LayoutDashboard,
  FileText,
  Megaphone,
  Palette,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

function NavigationItems({
  isSuperAdmin,
  pathname,
  setMobileOpen,
}: {
  isSuperAdmin: boolean;
  pathname: string;
  setMobileOpen?: (open: boolean) => void;
}) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'organizations';
  const [profileOpen, setProfileOpen] = useState(
    pathname?.startsWith('/dashboard/profile') ?? false
  );

  const profileSubItems = [
    { name: 'Dashboard', href: '/dashboard/profile?sub=dashboard', icon: LayoutDashboard },
    { name: 'View Profile', href: '/dashboard/profile', icon: Building },
    { name: 'Menu Card Styling', href: '/dashboard/profile?sub=styling', icon: Palette },
    { name: 'EoD Report', href: '/dashboard/profile?sub=eod', icon: FileText },
    { name: 'Delegated Accounts', href: '/dashboard/profile?sub=delegated', icon: Users },
    { name: 'Campaigns', href: '/dashboard/profile?sub=campaigns', icon: Megaphone },
  ];

  const navItems = isSuperAdmin
    ? [
      { name: 'Organizations', href: '/dashboard/super-admin?tab=organizations', icon: Building, tab: 'organizations' },
      { name: 'Core Services', href: '/dashboard/super-admin?tab=services', icon: Layers, tab: 'services' },
      { name: 'Package Tiers', href: '/dashboard/super-admin?tab=packages', icon: Tag, tab: 'packages' },
      { name: 'Revenue', href: '/dashboard/super-admin?tab=revenue', icon: BarChart3, tab: 'revenue' },
      { name: 'Payment History', href: '/dashboard/super-admin?tab=payments', icon: CreditCard, tab: 'payments' },
    ]
    : [
      { name: 'Overview', href: '/dashboard', icon: TrendingUp },
      { name: 'Sales & Bookings', href: '/dashboard/analytics', icon: BarChart3 },
      { name: 'Order History', href: '/dashboard/orders', icon: History },
      { name: 'Manage Menu', href: '/dashboard/menu', icon: Utensils },
      { name: 'Manage Item', href: '/dashboard/inventory', icon: Layers },
      { name: 'Suppliers & POs', href: '/dashboard/suppliers', icon: Truck },
      { name: 'Table Manager', href: '/dashboard/tables', icon: Table },
      { name: 'Reservations', href: '/dashboard/reservations', icon: Calendar },
      { name: 'Offers & Coupons', href: '/dashboard/offers', icon: Tag },
      { name: 'Customer Database', href: '/dashboard/customers', icon: Users },
      { name: 'Loyalty Rewards', href: '/dashboard/loyalty', icon: Gift },
      { name: 'Advance Setup', href: '/dashboard/operations', icon: MonitorPlay },
      { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
      { name: 'Payment Settings', href: '/dashboard/settings/payment', icon: CreditCard },
      { name: 'Taxes & Fees', href: '/dashboard/taxes', icon: Percent },
      { name: 'Upload Background', href: '/dashboard/upload-background', icon: Image },
    ];

  return (
    <>
      {!isSuperAdmin && (
        <>
          {/* Overview, Analytics, Order History first */}
          {navItems.slice(0, 3).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen?.(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition duration-150 ${isActive
                    ? 'bg-[#1a2336] text-[#f59e0b] border-l-2 border-[#f59e0b] shadow-md shadow-[#f59e0b]/5'
                    : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                  }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.name}
              </Link>
            );
          })}

          {/* Business Profile Collapsible Group */}
          <div>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition duration-150 text-left ${
                pathname?.startsWith('/dashboard/profile')
                  ? 'bg-[#1a2336] text-[#f59e0b] border-l-2 border-[#f59e0b] shadow-md shadow-[#f59e0b]/5'
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
              }`}
            >
              <Building className="h-4.5 w-4.5 shrink-0" />
              <span className="flex-1">Business Profile</span>
              {profileOpen
                ? <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                : <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
            </button>
            {profileOpen && (
              <div className="ml-4 mt-0.5 pl-3.5 border-l border-[#1e293b]/60 space-y-0.5">
                {profileSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const currentSub = searchParams.get('sub');
                  // "View Profile" is active when no ?sub= param; others match their ?sub= value
                  const isSubActive = pathname === '/dashboard/profile' && (
                    sub.href === '/dashboard/profile' && !currentSub
                    || (sub.href.includes('?sub=') && currentSub === new URL(sub.href, 'http://x').searchParams.get('sub'))
                  );
                  return (
                    <Link
                      key={sub.name}
                      href={sub.href}
                      onClick={() => setMobileOpen?.(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition duration-150 ${
                        isSubActive
                          ? 'bg-[#f59e0b]/10 text-[#f59e0b]'
                          : 'text-slate-500 hover:bg-slate-900/40 hover:text-slate-200'
                      }`}
                    >
                      <SubIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{sub.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rest of nav items */}
          {navItems.slice(3).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen?.(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition duration-150 ${isActive
                    ? 'bg-[#1a2336] text-[#f59e0b] border-l-2 border-[#f59e0b] shadow-md shadow-[#f59e0b]/5'
                    : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                  }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.name}
              </Link>
            );
          })}
        </>
      )}

      {isSuperAdmin && navItems.map((item) => {
        const isActive = pathname === '/dashboard/super-admin' && activeTab === (item as any).tab;
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setMobileOpen?.(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition duration-150 ${isActive
                ? 'bg-[#1a2336] text-[#f59e0b] border-l-2 border-[#f59e0b] shadow-md shadow-[#f59e0b]/5'
                : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
              }`}
          >
            <Icon className="h-4.5 w-4.5" />
            {item.name}
          </Link>
        );
      })}

      {!isSuperAdmin && (
        <Link
          href="/pos"
          target="_blank"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-900/50 hover:text-white transition duration-150"
        >
          <MonitorPlay className="h-4.5 w-4.5 text-emerald-400" />
          Launch POS Screen
        </Link>
      )}
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('dashboard-theme', nextTheme);
  };

  React.useEffect(() => {
    const handleProfileUpdate = () => {
      fetch('/api/dashboard/profile')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setLogoUrl(data.organization?.logo || null);
            setCompanyName(data.organization?.name || null);
          }
        })
        .catch((err) => console.error('Error fetching layout profile details:', err));
    };

    if (status === 'authenticated') {
      handleProfileUpdate();
      window.addEventListener('profileUpdated', handleProfileUpdate);
    }
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [status]);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b11]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-[#f59e0b] mx-auto"></div>
          <p className="mt-4 text-slate-400 font-semibold tracking-wider">Loading Portal...</p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = (session?.user as any)?.roles?.includes('Super Admin');

  return (
    <div className={`flex min-h-screen text-slate-100 font-sans px-4 sm:px-6 transition-colors duration-300 ${theme === 'light' ? 'light-theme bg-[#f8fafc]' : 'bg-[#080b11]'}`}>

      {/* 1. SIDEBAR (DESKTOP) */}
      <aside className="hidden md:flex w-64 flex-col h-screen max-h-screen sticky top-0 bg-[#0c101b] border-r border-[#1e293b]/60 shrink-0 justify-between self-start">

        <div className="flex flex-col flex-1 h-0 overflow-hidden">
          {/* Logo block */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-[#1e293b]/60 bg-[#0c101b] cursor-pointer shrink-0">
            {logoUrl ? (
              <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-[#1e293b]/60 bg-[#0c101b] shrink-0">
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#f59e0b] to-[#ea580c] shadow-md shadow-[#f59e0b]/10">
                <span className="text-xl font-black text-white italic">T</span>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              </div>
            )}
            <span className="text-base font-black tracking-wider text-white truncate max-w-[140px]">
              {companyName ? (
                <>
                  {companyName} <span className="text-[#f59e0b]">HQ</span>
                </>
              ) : (
                <>
                  F-Ordering <span className="text-[#f59e0b]">HQ</span>
                </>
              )}
            </span>
          </div>

          {/* User Block info */}
          <div className="p-4 border-b border-[#1e293b]/60 bg-slate-950/20 flex items-center gap-3 shrink-0">
            <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-700 bg-slate-800 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
                alt="Profile Avatar"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Staff</p>
              <p className="text-xs font-bold text-white truncate leading-tight mt-0.5">{session?.user?.name || 'Sarah Connor'}</p>
              <p className="text-[9px] text-[#f59e0b] font-semibold uppercase mt-0.5 truncate">
                {(session?.user as any)?.roles?.[0] || 'Administrator'}
              </p>
            </div>
          </div>

          {/* Navigation Links list */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
            <Suspense fallback={<div className="h-10 w-full animate-pulse bg-slate-800/30 rounded-xl" />}>
              <NavigationItems isSuperAdmin={isSuperAdmin} pathname={pathname} />
            </Suspense>
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#1e293b]/60 shrink-0 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900/40 border border-[#1e293b]/60 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800/40 transition duration-150"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-amber-500" />
                Light Theme
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-sky-400" />
                Dark Theme
              </>
            )}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-950/20 border border-red-900/15 py-2.5 text-xs font-bold text-red-400 hover:bg-red-950/45 transition duration-150"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* MOBILE CONTAINER WRAPPER */}
      <div className="flex flex-col flex-1 min-h-screen">

        {/* MOBILE HEADER BAR */}
        <header className="flex h-16 items-center justify-between border-b border-[#1e293b]/60 bg-[#0c101b] px-6 md:hidden shrink-0">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <div className="relative h-11 w-11 rounded-lg overflow-hidden border border-[#1e293b]/60 bg-[#0c101b] shrink-0">
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-[#f59e0b] to-[#ea580c] shadow-sm">
                <span className="text-xs font-black text-white italic">T</span>
              </div>
            )}
            <span className="text-sm font-black text-white tracking-wider truncate max-w-[140px]">
              {companyName ? `${companyName} HQ` : 'F-Ordering HQ'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-lg border border-[#1e293b] bg-slate-950 p-2 text-slate-300 hover:bg-slate-900 transition shrink-0"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-sky-400" />}
            </button>
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-[#1e293b] bg-slate-950 p-2 text-slate-300 hover:bg-slate-900 transition"
            >
              <MenuIcon className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        {/* MAIN BODY PAGES OUTLET */}
        <main className="flex-1 overflow-y-auto bg-[#080b11]">
          {children}
        </main>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/80 backdrop-blur-sm">
          <div className="w-64 bg-[#0c101b] border-r border-[#1e293b]/60 flex flex-col h-full justify-between">
            <div className="flex flex-col flex-1 h-0 overflow-hidden">
              <div className="h-16 flex items-center justify-between px-6 border-b border-[#1e293b]/60 bg-[#0c101b] shrink-0">
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    <div className="relative h-11 w-11 rounded-md overflow-hidden border border-[#1e293b]/60 bg-[#0c101b] shrink-0">
                      <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                    </div>
                  ) : null}
                  <span className="text-sm font-black text-white tracking-wider truncate max-w-[140px]">
                    {companyName ? `${companyName} HQ` : 'F-Ordering HQ'}
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
                <Suspense fallback={<div className="h-10 w-full animate-pulse bg-slate-800/30 rounded-xl" />}>
                  <NavigationItems isSuperAdmin={isSuperAdmin} pathname={pathname} setMobileOpen={setMobileOpen} />
                </Suspense>
              </nav>
            </div>

            <div className="p-4 border-t border-[#1e293b]/60 shrink-0 space-y-2">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900/40 border border-[#1e293b]/60 py-2.5 text-xs font-bold text-slate-300"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="h-4 w-4 text-amber-500" />
                    Light Theme
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-sky-400" />
                    Dark Theme
                  </>
                )}
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-950/20 border border-red-900/15 py-2.5 text-xs font-bold text-red-400"
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
