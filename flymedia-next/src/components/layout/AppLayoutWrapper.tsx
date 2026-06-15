'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAppPage = ['/pos', '/dashboard', '/login', '/register'].some(
    (path) => pathname?.startsWith(path)
  );

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
