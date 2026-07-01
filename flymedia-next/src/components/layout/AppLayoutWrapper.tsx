'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // All order-online pages (menu, login, register, profile…) have their own UI — no global header/footer
  const isOrderOnlinePage = pathname?.startsWith('/order-online') || pathname?.startsWith('/menu') || pathname?.startsWith('/book');

  // Internal app pages use the dark app shell
  const isAppPage = ['/pos', '/kds', '/dashboard', '/login', '/register'].some(
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
