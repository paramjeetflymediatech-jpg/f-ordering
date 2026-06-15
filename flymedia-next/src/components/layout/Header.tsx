'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import styles from './Header.module.css';

const Header = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [customer, setCustomer] = useState<{ name: string } | null>(null);

  const isAppPage = ['/pos', '/dashboard', '/login', '/register'].some(path => pathname?.startsWith(path));

  const isOrderOnline = pathname?.startsWith('/order-online/');
  const matches = pathname?.match(/\/order-online\/([^\/]+)/);
  const orgSlug = matches ? matches[1] : '';

  useEffect(() => {
    if (isOrderOnline) {
      fetch('/api/public/customer/me')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.customer) {
            setCustomer(data.customer);
          } else {
            setCustomer(null);
          }
        })
        .catch(() => setCustomer(null));
    } else {
      setCustomer(null);
    }
  }, [pathname, isOrderOnline]);

  if (isAppPage) return null;

  const navLinks = isOrderOnline
    ? (customer
        ? [
            { name: `Profile (${customer.name})`, href: `/order-online/${orgSlug}/customer/profile` },
            { name: 'Menu', href: `/order-online/${orgSlug}/menu` },
            { name: 'About Us', href: '/about' },
            { name: 'Contact Us', href: '/contact' },
          ]
        : [
            { name: 'Login', href: `/order-online/${orgSlug}/customer/login` },
            { name: 'Menu', href: `/order-online/${orgSlug}/menu` },
            { name: 'About Us', href: '/about' },
            { name: 'Contact Us', href: '/contact' },
          ]
      )
    : [
        { name: 'Home', href: '/' },
        { name: 'About Us', href: '/about' },
        { name: 'Services', href: '/services' },
        { name: 'Packages', href: '/packages' },
        { name: 'Portfolio', href: '/portfolio' },
        { name: 'Blog', href: '/blog' },
      ];

  const logoHref = isOrderOnline ? `/order-online/${orgSlug}/menu` : '/';

  return (
    <header className={styles.header}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link href={logoHref} className="shrink-0" onClick={() => setMobileOpen(false)}>
          <Image 
            src="/logo.png" 
            alt="Flymedia Tech" 
            width={160} 
            height={50} 
            priority
            className="h-10 w-auto"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-bold transition ${
                  isActive ? 'text-orange-500' : 'text-slate-800 hover:text-orange-500'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          {isOrderOnline && customer && (
            <button
              onClick={async () => {
                await fetch('/api/public/customer/logout', { method: 'POST' });
                window.location.href = `/order-online/${orgSlug}/menu`;
              }}
              className="text-sm font-bold text-red-500 hover:text-red-400 transition ml-2"
            >
              Logout
            </button>
          )}
          {!isOrderOnline && (
            <>
              <Link
                href="/register"
                className="border border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white transition px-4 py-2.5 rounded-full text-xs font-extrabold shrink-0"
              >
                Become a Partner
              </Link>
              <Link
                href="/contact"
                className="bg-orange-500 hover:bg-orange-650 text-white transition px-4 py-2.5 rounded-full text-xs font-extrabold shrink-0"
              >
                Contact Us
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-slate-800 hover:text-orange-500 outline-none transition"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 top-[75px] z-50 md:hidden bg-slate-950/40 backdrop-blur-md flex flex-col justify-start">
          <div className="bg-white border-t border-slate-100 p-6 flex flex-col gap-4 shadow-xl">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`text-base font-bold transition py-2 ${
                    isActive ? 'text-orange-500' : 'text-slate-800 hover:text-orange-500'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            {isOrderOnline && customer && (
              <button
                onClick={async () => {
                  setMobileOpen(false);
                  await fetch('/api/public/customer/logout', { method: 'POST' });
                  window.location.href = `/order-online/${orgSlug}/menu`;
                }}
                className="w-full text-center border border-red-500/25 text-red-500 hover:bg-red-500/10 transition py-3 rounded-xl text-sm font-bold mt-2"
              >
                Logout Account
              </button>
            )}
            {!isOrderOnline && (
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-100">
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center border border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white transition py-3 rounded-xl text-sm font-bold"
                >
                  Become a Partner
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center bg-orange-500 hover:bg-orange-600 text-white transition py-3 rounded-xl text-sm font-bold"
                >
                  Contact Us
                </Link>
              </div>
            )}
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)}></div>
        </div>
      )}
    </header>
  );
};

export default Header;
