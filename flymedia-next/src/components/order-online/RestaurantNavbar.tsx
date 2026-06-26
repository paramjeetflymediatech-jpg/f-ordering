'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShoppingBag, User } from 'lucide-react';

interface RestaurantNavbarProps {
  orgSlug: string;
  /** Optional: highlight the active page link */
  activePage?: 'menu' | 'login' | 'register' | 'profile';
}

interface StoreInfo {
  name: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
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

  const primaryColor = store?.primary_color || '#1e293b';
  const accentColor = store?.accent_color || '#f59e0b';

  return (
    <header
      className="w-full sticky top-0 z-40 shadow-md"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Left — Logo + Store Name */}
        <Link
          href={`/order-online/${orgSlug}/menu`}
          className="flex items-center gap-3 min-w-0"
        >
          {store?.logo_url ? (
            <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 bg-white/10 ring-2 ring-white/20">
              <Image
                src={store.logo_url}
                alt={store.name}
                width={40}
                height={40}
                className="object-cover h-full w-full"
              />
            </div>
          ) : (
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              {store?.name?.charAt(0) || '?'}
            </div>
          )}
          <span className="text-white font-bold text-sm truncate">
            {store?.name || orgSlug}
          </span>
        </Link>

        {/* Right — Navigation Links */}
        <nav className="flex items-center gap-1">
          <Link
            href={`/order-online/${orgSlug}/menu`}
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
            href={`/order-online/${orgSlug}/customer/login`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activePage === 'login' || activePage === 'register'
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            {activePage === 'profile' ? 'My Account' : 'Sign In'}
          </Link>
        </nav>
      </div>
    </header>
  );
}
