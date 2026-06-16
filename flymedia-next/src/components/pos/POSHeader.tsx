import React from 'react';
import { Bell } from 'lucide-react';

interface POSHeaderProps {
  session: any;
}

export function POSHeader({ session }: POSHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between px-6 border-b border-[#1e293b]/40 bg-[#080b11]/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-black tracking-wider text-white">
          TABLE<span className="text-[#f59e0b]">TASTE</span> POS
        </h1>
        <span className="rounded-full bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 tracking-wider">
          ONLINE
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-slate-400 font-medium">Logged Staff</p>
          <p className="text-sm font-bold text-white leading-tight truncate">
            {session?.user?.name || 'Sarah Connor'}
          </p>
        </div>

        <button
          onClick={() => alert('No new notifications')}
          className="rounded-xl border border-[#1e293b] bg-[#0c101b] p-2.5 text-slate-400 hover:text-white hover:bg-slate-900 transition"
        >
          <Bell className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}
