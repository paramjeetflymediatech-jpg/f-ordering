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
    console.log(window.location.origin,'origin',hostname)
    if (hostname === process.env.NEXT_PUBLIC_URL){
      window.location.href = process.env.NEXT_PUBLIC_URL
    }
    const parts = hostname.split('.');
    let slug = '';
    if (parts.length > 1 && parts[0] !== 'www') {
      slug = parts[0];
    }
    if (slug) {
      const path = window.location.pathname;
      if (path === '/' || path === '') {
        const originalDomain = parts.slice(1).join('.');
        const newUrl = `${window.location.protocol}//${originalDomain}${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.href = newUrl;
      }
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
