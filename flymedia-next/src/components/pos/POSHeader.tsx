import React from 'react';
import { Bell, Sun, Moon } from 'lucide-react';

interface POSHeaderProps {
  session: any;
  logoUrl?: string;
  companyName?: string;
  theme?: 'dark' | 'light';
  toggleTheme?: () => void;
  unreadCount?: number;
  onNotificationClick?: () => void;
}

export function POSHeader({ session, logoUrl, companyName, theme = 'dark', toggleTheme, unreadCount = 0, onNotificationClick }: POSHeaderProps) {
  return (
    <header className="flex h-20 items-center justify-between px-6 border-b border-slate-850 bg-gradient-to-r from-[#0a0f1d]/90 via-[#080b11]/90 to-[#0c1222]/90 backdrop-blur-xl sticky top-0 z-10 shrink-0 shadow-lg shadow-slate-950/20">
      <div className="flex items-center gap-3">
        <div className="relative">
          <h1 className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName || 'Logo'} className="h-16 max-w-[240px] object-contain shrink-0" />
            ) : (
              <span className="text-sm font-black tracking-widest text-[#f59e0b] uppercase truncate max-w-[150px]">
                {companyName || 'TableTaste'}
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Online
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Logged Staff</p>
          <p className="text-xs font-extrabold text-slate-200 mt-0.5 truncate max-w-[120px]">
            {session?.user?.name || 'Sarah Connor'}
          </p>
        </div>

        {toggleTheme && (
          <button
            onClick={toggleTheme}
            className="rounded-xl border border-slate-800 bg-[#090d16] p-2 text-slate-400 hover:text-white hover:bg-slate-900 hover:border-slate-700 transition duration-200"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="h-4 w-4 text-sky-400" />
            )}
          </button>
        )}

        <button
          onClick={onNotificationClick}
          className={`rounded-xl border bg-[#090d16] p-2 text-slate-400 hover:text-white hover:bg-slate-900 hover:border-slate-700 transition duration-200 relative ${
            unreadCount > 0 ? 'border-rose-500/50 text-rose-500' : 'border-slate-800'
          }`}
          title="Unread Orders Notifications"
        >
          <Bell className={`h-4 w-4 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[8px] font-bold text-white shadow-md">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>

  );
}
