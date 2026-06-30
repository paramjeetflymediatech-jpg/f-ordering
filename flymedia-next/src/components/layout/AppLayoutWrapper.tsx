'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // All order-online pages (menu, login, register, profile…) have their own UI — no global header/footer
  const isOrderOnlinePage = pathname?.startsWith('/order-online') || pathname?.startsWith('/menu') || pathname?.startsWith('/book');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const host = window.location.host;
    
    let mainDomain = '';
    let slug = '';

    if (hostname.endsWith('localhost')) {
      mainDomain = 'localhost';
      if (host.includes(':')) {
        mainDomain += ':' + host.split(':')[1];
      }
      const parts = hostname.split('.');
      if (parts.length > 1) {
        slug = parts[0];
      }
    } else {
      let fallbackDomain = 'fly-pos.com';
      try {
        if (process.env.NEXT_PUBLIC_URL) {
          fallbackDomain = new URL(process.env.NEXT_PUBLIC_URL).hostname;
        }
      } catch (e) {}

      if (hostname.endsWith(fallbackDomain)) {
        mainDomain = fallbackDomain;
        if (host.includes(':')) {
          mainDomain += ':' + host.split(':')[1];
        }
        if (hostname !== fallbackDomain) {
          slug = hostname.replace('.' + fallbackDomain, '');
        }
      } else {
        const parts = hostname.split('.');
        if (parts.length > 2 && parts[0] !== 'www') {
          slug = parts[0];
          mainDomain = parts.slice(1).join('.');
          if (host.includes(':')) {
            mainDomain += ':' + host.split(':')[1];
          }
        }
      }
    }

    if (slug && mainDomain) {
      const newUrl = `${window.location.protocol}//${mainDomain}${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.href = newUrl;
    }
  }, [pathname]);

  // Internal app pages use the dark app shell
  const isAppPage = ['/pos', '/dashboard', '/login', '/register'].some(
    (path) => pathname?.startsWith(path)
  );

  if (isOrderOnlinePage) {
    return <>{children}</>;
  }

  if (isAppPage) {
    return <div className="app-container min-h-screen bg-slate-950 text-slate-100">{children}</div>;
  }

  return (
    <>
      <Header />
      <main style={{ minHeight: '100vh', paddingTop: '80px' }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
