'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, User, Menu as MenuIcon, X, LogOut, Award } from 'lucide-react';

interface RestaurantNavbarProps {
  orgSlug: string;
  /** Optional: highlight the active page link */
  activePage?: 'menu' | 'login' | 'register' | 'profile';
}

interface StoreInfo {
  name: string;
  website: string | null;
  theme_primary_color: string | null;
  theme_accent_color: string | null;
  Organization?: {
    name: string;
    logo: string | null;
  };
}

export default function RestaurantNavbar({ orgSlug, activePage }: RestaurantNavbarProps) {
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!orgSlug) return;
    fetch(`/api/public/store?orgSlug=${orgSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.store) setStore(data.store);
      })
      .catch(() => {});
  }, [orgSlug]);

  useEffect(() => {
    fetch('/api/public/customer/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.customer) {
          setCustomer(data.customer);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/public/customer/logout', { method: 'POST' });
      setCustomer(null);
      window.location.reload();
    } catch (e) {}
  };

  const primaryColor = store?.theme_primary_color || '#1e293b';
  const accentColor = store?.theme_accent_color || '#f59e0b';
  const logoUrl = store?.Organization?.logo || null;
  const displayName = store?.Organization?.name || store?.name || orgSlug;

  return (
    <header
      className="w-full sticky top-0 z-40 px-6 py-2 shadow-md"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Left — Logo + Store Name */}
        <Link
          href={`/order-online/${orgSlug}/menu`}
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
          <span className="text-white font-bold text-sm truncate hidden sm:block">
            {displayName}
          </span>
        </Link>

        {/* Right — Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold">
          {store?.website ? (
            <a href={store.website} className="text-white hover:text-white/80 transition">
              Home
            </a>
          ) : (
            <Link href="/" className="text-white hover:text-white/80 transition">
              Home
            </Link>
          )}

          <Link
            href={`/order-online/${orgSlug}/menu`}
            className={`transition ${activePage === 'menu' ? 'text-white' : 'text-white/75 hover:text-white'}`}
            style={activePage === 'menu' ? { color: accentColor } : undefined}
          >
            Menu
          </Link>

          {store?.website ? (
            <a href={`${store.website.replace(/\/$/, '')}/#about`} className="text-white hover:text-white/80 transition">
              About Us
            </a>
          ) : (
            <Link href={store?.website ? (`${store.website.replace(/\/$/, '')}/about`) : "/about"} className="text-white hover:text-white/80 transition">
              About Us
            </Link>
          )}

          <Link
            href={`/order-online/${orgSlug}/book`}
            className="text-white hover:text-white/80 transition"
          >
            Book Table
          </Link>

          {customer ? (
            <div className="flex items-center gap-3">
              <Link
                href={`/order-online/${orgSlug}/customer/profile`}
                className={`transition flex items-center gap-1.5 ${activePage === 'profile' ? 'text-white' : 'text-white/75 hover:text-white'}`}
                style={activePage === 'profile' ? { color: accentColor } : undefined}
              >
                <User className="h-4 w-4" /> Hi, {customer.name}
              </Link>
              <button
                onClick={handleLogout}
                className="text-white/60 hover:text-red-400 p-1 rounded hover:bg-white/10 transition"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href={`/order-online/${orgSlug}/customer/login`}
                className={`transition flex items-center gap-1 ${activePage === 'login' ? 'text-white' : 'text-white/75 hover:text-white'}`}
                style={activePage === 'login' ? { color: accentColor } : undefined}
              >
                Sign In
              </Link>
              <Link
                href={`/order-online/${orgSlug}/customer/register`}
                className="text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition"
                style={{ backgroundColor: accentColor }}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 rounded-xl text-white hover:bg-white/10 transition shrink-0"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-72 h-full p-6 bg-white text-slate-800 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <span className="font-bold text-sm uppercase tracking-wider text-slate-800">Navigation</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:opacity-85 text-slate-500">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-4 text-sm font-semibold">
                {store?.website ? (
                  <a href={store.website} className="hover:opacity-80 py-1 transition text-slate-600">
                    Home
                  </a>
                ) : (
                  <Link href="/" onClick={() => setMobileMenuOpen(false)} className="hover:opacity-80 py-1 transition text-slate-600">
                    Home
                  </Link>
                )}
                <Link
                  href={`/order-online/${orgSlug}/menu`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`hover:opacity-80 py-1 transition ${activePage === 'menu' ? 'text-orange-500' : 'text-slate-650'}`}
                  style={activePage === 'menu' ? { color: accentColor } : undefined}
                >
                  Menu
                </Link>
                {store?.website ? (
                  <a href={`${store.website.replace(/\/$/, '')}/#about`} className="hover:opacity-80 py-1 transition text-slate-600">
                    About Us
                  </a>
                ) : (
                  <Link href={store?.website ? (`${store.website.replace(/\/$/, '')}/about`) : "/about"} onClick={() => setMobileMenuOpen(false)} className="hover:opacity-80 py-1 transition text-slate-600">
                    About Us
                  </Link>
                )}
                <Link href={`/order-online/${orgSlug}/book`} onClick={() => setMobileMenuOpen(false)} className="hover:opacity-80 py-1 transition text-slate-600">
                  Book Table
                </Link>
              </nav>
            </div>

            <div className="pt-6 border-t border-slate-200/80">
              {customer ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-850">{customer.name}</p>
                      {customer.loyaltyPoints !== undefined && (
                        <p className="text-[10px] font-semibold text-amber-600 uppercase">{customer.loyaltyPoints} PTS</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/order-online/${orgSlug}/customer/profile`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center block rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700"
                  >
                    My Account
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-200 py-2.5 text-xs font-bold text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/order-online/${orgSlug}/customer/login`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700"
                  >
                    Login
                  </Link>
                  <Link
                    href={`/order-online/${orgSlug}/customer/register`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                    style={{ backgroundColor: accentColor }}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
