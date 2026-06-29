'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, User } from 'lucide-react';

interface RestaurantNavbarProps {
  orgSlug: string;
  /** Optional: highlight the active page link */
  activePage?: 'menu' | 'login' | 'register' | 'profile';
}

interface StoreInfo {
  name: string;
  theme_primary_color: string | null;
  theme_accent_color: string | null;
  Organization?: {
    name: string;
    logo: string | null;
  };
}

export default function RestaurantNavbar({ orgSlug, activePage }: RestaurantNavbarProps) {
  const [store, setStore] = useState<StoreInfo | null>(null);

  useEffect(() => {
    if (!orgSlug) return;
    fetch(`/api/public/store?orgSlug=${orgSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.store) setStore(data.store);
      })
      .catch(() => {});
  }, [orgSlug]);

  const primaryColor = store?.theme_primary_color || '#1e293b';
  const accentColor = store?.theme_accent_color || '#f59e0b';
  const logoUrl = store?.Organization?.logo || null;
  const displayName = store?.Organization?.name || store?.name || orgSlug;

  return (
    <header
      className="w-full sticky top-0 z-40 shadow-md"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Left — Logo + Store Name */}
        <Link
          href={`/menu`}
          className="flex items-center gap-3 min-w-0"
        >
          {logoUrl ? (
            <div className="h-12 max-h-12 w-auto shrink-0 flex items-center">
              <img
                src={logoUrl}
                alt={displayName}
                className="h-full w-auto object-contain"
              />
            </div>
          ) : (
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              {displayName.charAt(0) || '?'}
            </div>
          )}
          <span className="text-white font-bold text-sm truncate">
            {displayName}
          </span>
        </Link>

        {/* Right — Navigation Links */}
        <nav className="flex items-center gap-1">
          <Link
            href={`/menu`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activePage === 'menu'
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Menu
          </Link>

          <Link
            href={
              activePage === 'login'
                ? `/order-online/${orgSlug}/customer/register`
                : activePage === 'profile'
                ? `/order-online/${orgSlug}/customer/profile`
                : `/order-online/${orgSlug}/customer/login`
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activePage === 'login' || activePage === 'register' || activePage === 'profile'
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            {activePage === 'profile'
              ? 'My Account'
              : activePage === 'login'
              ? 'Sign Up'
              : 'Sign In'}
          </Link>
        </nav>
      </div>
    </header>
  );
}
