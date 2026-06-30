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

  const handleModalClick = (modalName: string) => {
    if (activeTab === 'drafts') {
      router.push('/pos');
    } else {
      setActiveModal?.(modalName);
    }
  };

  return (
    <aside className="hidden md:flex w-20 shrink-0 border-r border-[#1e293b]/60 bg-[#0c101b] flex-col justify-between items-center py-5">
      {/* Brand Logo */}
      <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => router.push('/pos')}>
        {logoUrl ? (
          <div className="relative flex h-14 w-14 items-center justify-center rounded-xl overflow-hidden border border-[#1e293b]/60 bg-[#0c101b] shadow-lg">
            <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-[#0c101b] bg-emerald-400"></span>
          </div>
        ) : (
          <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#ea580c] shadow-lg shadow-[#f59e0b]/20">
            <span className="text-2xl font-black text-white italic">T</span>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-[#0c101b] bg-emerald-400"></span>
          </div>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex flex-col gap-2.5 w-full px-2">
        <button
          onClick={() => router.push('/pos')}
          className={`group relative flex w-full flex-col items-center justify-center rounded-xl py-3 transition duration-200 ${activeTab === 'pos'
              ? 'text-[#f59e0b] bg-[#1a2336]'
              : 'text-slate-400 hover:bg-[#111827] hover:text-white'
            }`}
          title="Dashboard Terminal"
        >
          {/* Active Indicator line */}
          {activeTab === 'pos' && (
            <span className="absolute left-0 top-1/4 h-1/2 w-1 rounded-r-md bg-[#f59e0b]"></span>
          )}
          <Layers className="h-5.5 w-5.5" />
          <span className="text-[10px] font-bold mt-1 scale-90">POS</span>
        </button>

        <button
          onClick={() => router.push('/pos/drafts')}
          className={`group relative flex w-full flex-col items-center justify-center rounded-xl py-3 transition duration-200 ${activeTab === 'drafts'
              ? 'text-[#f59e0b] bg-[#1a2336]'
              : 'text-slate-400 hover:bg-[#111827] hover:text-white'
            }`}
          title="Hold Queue / Drafts"
        >
          {activeTab === 'drafts' && (
            <span className="absolute left-0 top-1/4 h-1/2 w-1 rounded-r-md bg-[#f59e0b]"></span>
          )}
          <div className="relative">
            <FolderOpen className="h-5.5 w-5.5" />
            {heldOrdersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#f59e0b] text-[9px] font-extrabold text-slate-950">
                {heldOrdersCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-1 scale-90">Drafts</span>
        </button>

        <button
          onClick={() => handleModalClick('table')}
          className="group flex w-full flex-col items-center justify-center rounded-xl py-3 text-slate-400 hover:bg-[#111827] hover:text-white transition duration-200"
          title="Dining Tables Status"
        >
          <Utensils className="h-5.5 w-5.5" />
          <span className="text-[10px] font-bold mt-1 scale-90">Tables</span>
        </button>

        <a
          href="/dashboard/menu"
          target="_blank"
          className="group flex w-full flex-col items-center justify-center rounded-xl py-3 text-slate-400 hover:bg-[#111827] hover:text-white transition duration-200"
          title="Menu Management"
        >
          <ShoppingBag className="h-5.5 w-5.5" />
          <span className="text-[10px] font-bold mt-1 scale-90">Menu</span>
        </a>

        <a
          href="/dashboard"
          target="_blank"
          className="group flex w-full flex-col items-center justify-center rounded-xl py-3 text-slate-400 hover:bg-[#111827] hover:text-white transition duration-200"
          title="Reports & Trends"
        >
          <TrendingUp className="h-5.5 w-5.5" />
          <span className="text-[10px] font-bold mt-1 scale-90">Reports</span>
        </a>

        <button
          onClick={() => handleModalClick('inventory')}
          className="group flex w-full flex-col items-center justify-center rounded-xl py-3 text-slate-400 hover:bg-[#111827] hover:text-white transition duration-200"
          title="Ingredient Inventory"
        >
          <Package className="h-5.5 w-5.5" />
          <span className="text-[10px] font-bold mt-1 scale-90">Stock</span>
        </button>

        <button
          onClick={() => handleModalClick('settings')}
          className="group flex w-full flex-col items-center justify-center rounded-xl py-3 text-slate-400 hover:bg-[#111827] hover:text-white transition duration-200"
          title="System Settings"
        >
          <Settings className="h-5.5 w-5.5" />
          <span className="text-[10px] font-bold mt-1 scale-90">Settings</span>
        </button>
      </nav>

      {/* Footer Logout & User Profile */}
      <div className="flex flex-col items-center gap-4 w-full">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="rounded-xl p-2.5 text-red-400/80 hover:bg-red-950/30 hover:text-red-400 transition"
          title="Sign Out"
        >
          <LogOut className="h-5 w-5" />
        </button>

        {/* Profile Avatar Card */}
        <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-700 bg-slate-800 cursor-pointer hover:border-[#f59e0b] transition">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
            alt="Manager Avatar"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </aside>
  );
}
