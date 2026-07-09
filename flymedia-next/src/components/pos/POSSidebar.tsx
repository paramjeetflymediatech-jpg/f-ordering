import React from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Layers,
  FolderOpen,
  Utensils,
  ShoppingBag,
  TrendingUp,
  Package,
  Settings,
  LogOut,
} from 'lucide-react';

interface POSSidebarProps {
  session: any;
  heldOrdersCount: number;
  setActiveModal?: (modal: any) => void;
  activeTab?: 'pos' | 'drafts';
  logoUrl?: string;
}

export function POSSidebar({ session, heldOrdersCount, setActiveModal, activeTab = 'pos', logoUrl }: POSSidebarProps) {
  const router = useRouter();

  const roles = session?.user?.roles || [];
  const isWaiter = roles.includes('Waiter');

  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const isCapacitor = (window as any).Capacitor !== undefined;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(isCapacitor || isMobileUA);
  }, []);

  const handleModalClick = (modalName: string) => {
    if (activeTab === 'drafts') {
      router.push('/pos');
    } else {
      setActiveModal?.(modalName);
    }
  };

  return (
    <aside className="hidden md:flex w-22 shrink-0 border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex-col justify-between items-center py-6 shadow-2xl">
      {/* Brand Logo */}
      <div className="flex flex-col items-center gap-1 cursor-pointer group shrink-0" onClick={() => router.push('/pos')}>
        {logoUrl ? (
          <div className="relative flex h-14 w-14 items-center justify-center rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg group-hover:border-orange-500/40 transition-all duration-300">
            <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-slate-950 bg-emerald-400"></span>
          </div>
        ) : (
          <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 shadow-md shadow-orange-500/20 border border-orange-400/20 group-hover:scale-105 transition-all duration-300">
            <span className="text-2xl font-black text-white italic">T</span>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-slate-950 bg-emerald-400"></span>
          </div>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex flex-col gap-3.5 w-full px-2 overflow-y-auto scrollbar-none my-4 flex-1">
        <button
          onClick={() => router.push('/pos')}
          className={`group relative flex w-full flex-col items-center justify-center rounded-xl py-3.5 transition-all duration-300 ${
            activeTab === 'pos'
              ? 'text-orange-450 bg-slate-900 border border-slate-800 shadow-md shadow-orange-500/5'
              : 'text-slate-450 hover:bg-slate-900/40 hover:text-white border border-transparent hover:border-slate-800/30'
          }`}
          title="Dashboard Terminal"
        >
          {/* Active Indicator line */}
          {activeTab === 'pos' && (
            <span className="absolute left-1.5 top-1/4 h-1/2 w-1 rounded-full bg-gradient-to-b from-orange-500 to-amber-400 shadow-md shadow-orange-500/40"></span>
          )}
          <Layers className="h-5.5 w-5.5 transition-transform duration-300 group-hover:scale-105" />
          <span className="text-[9.5px] font-extrabold mt-1.5 uppercase tracking-wider scale-90">POS</span>
        </button>

        <button
          onClick={() => router.push('/pos/drafts')}
          className={`group relative flex w-full flex-col items-center justify-center rounded-xl py-3.5 transition-all duration-300 ${
            activeTab === 'drafts'
              ? 'text-orange-450 bg-slate-900 border border-slate-800 shadow-md shadow-orange-500/5'
              : 'text-slate-450 hover:bg-slate-900/40 hover:text-white border border-transparent hover:border-slate-800/30'
          }`}
          title="Hold Queue / Drafts"
        >
          {activeTab === 'drafts' && (
            <span className="absolute left-1.5 top-1/4 h-1/2 w-1 rounded-full bg-gradient-to-b from-orange-500 to-amber-400 shadow-md shadow-orange-500/40"></span>
          )}
          <div className="relative">
            <FolderOpen className="h-5.5 w-5.5 transition-transform duration-300 group-hover:scale-105" />
            {heldOrdersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-orange-600 text-[9.5px] font-black text-white border border-slate-950">
                {heldOrdersCount}
              </span>
            )}
          </div>
          <span className="text-[9.5px] font-extrabold mt-1.5 uppercase tracking-wider scale-90">Drafts</span>
        </button>

        <button
          onClick={() => handleModalClick('table')}
          className="group flex w-full flex-col items-center justify-center rounded-xl py-3.5 text-slate-450 hover:bg-slate-900/40 hover:text-white border border-transparent hover:border-slate-800/30 transition-all duration-300"
          title="Dining Tables Status"
        >
          <Utensils className="h-5.5 w-5.5 transition-transform duration-300 group-hover:scale-105" />
          <span className="text-[9.5px] font-extrabold mt-1.5 uppercase tracking-wider scale-90">Tables</span>
        </button>

        {!isWaiter && (
          <>
            <a
              href="/dashboard/menu"
              target="_blank"
              className="group flex w-full flex-col items-center justify-center rounded-xl py-3.5 text-slate-455 hover:bg-slate-900/40 hover:text-white border border-transparent hover:border-slate-800/30 transition-all duration-300"
              title="Menu Management"
            >
              <ShoppingBag className="h-5.5 w-5.5 transition-transform duration-300 group-hover:scale-105" />
              <span className="text-[9.5px] font-extrabold mt-1.5 uppercase tracking-wider scale-90">Menu</span>
            </a>

            <a
              href="/dashboard"
              target="_blank"
              className="group flex w-full flex-col items-center justify-center rounded-xl py-3.5 text-slate-455 hover:bg-slate-900/40 hover:text-white border border-transparent hover:border-slate-800/30 transition-all duration-300"
              title="Reports & Trends"
            >
              <TrendingUp className="h-5.5 w-5.5 transition-transform duration-300 group-hover:scale-105" />
              <span className="text-[9.5px] font-extrabold mt-1.5 uppercase tracking-wider scale-90">Reports</span>
            </a>

            <button
              onClick={() => handleModalClick('inventory')}
              className="group flex w-full flex-col items-center justify-center rounded-xl py-3.5 text-slate-450 hover:bg-slate-900/40 hover:text-white border border-transparent hover:border-slate-800/30 transition-all duration-300"
              title="Ingredient Inventory"
            >
              <Package className="h-5.5 w-5.5 transition-transform duration-300 group-hover:scale-105" />
              <span className="text-[9.5px] font-extrabold mt-1.5 uppercase tracking-wider scale-90">Stock</span>
            </button>

            <button
              onClick={() => handleModalClick('settings')}
              className="group flex w-full flex-col items-center justify-center rounded-xl py-3.5 text-slate-450 hover:bg-slate-900/40 hover:text-white border border-transparent hover:border-slate-800/30 transition-all duration-300"
              title="System Settings"
            >
              <Settings className="h-5.5 w-5.5 transition-transform duration-300 group-hover:scale-105" />
              <span className="text-[9.5px] font-extrabold mt-1.5 uppercase tracking-wider scale-90">Settings</span>
            </button>
          </>
        )}
      </nav>

      {/* Footer Logout & User Profile */}
      <div className="flex flex-col items-center gap-4 w-full shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="rounded-xl p-2.5 text-red-400/80 hover:bg-red-950/20 hover:text-red-400 border border-transparent hover:border-red-900/20 transition-all duration-300"
          title="Sign Out"
        >
          <LogOut className="h-5 w-5" />
        </button>

        {/* Profile Avatar Card */}
        <div className="h-11 w-11 p-0.5 overflow-hidden rounded-full border border-slate-850 bg-slate-950 cursor-pointer hover:border-orange-500 transition-all duration-300 hover:scale-105">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
            alt="Manager Avatar"
            className="h-full w-full rounded-full object-cover"
          />
        </div>
      </div>
    </aside>
  );
}
