'use client';

import React, { useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import OrganizationsTab from '../../../components/super-admin/OrganizationsTab';
import ServicesTab from '../../../components/super-admin/ServicesTab';
import PackagesTab from '../../../components/super-admin/PackagesTab';
import RevenueTab from '../../../components/super-admin/RevenueTab';
import PaymentsTab from '../../../components/super-admin/PaymentsTab';

function SuperAdminDashboardContent() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'organizations';

  // Redirect if not Super Admin
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    } else if (sessionStatus === 'authenticated') {
      const roles = (session?.user as any)?.roles || [];
      if (!roles.includes('Super Admin')) {
        router.push('/dashboard');
      }
    }
  }, [sessionStatus, session, router]);

  if (sessionStatus === 'loading') {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {activeTab === 'organizations' && <OrganizationsTab />}
      {activeTab === 'services' && <ServicesTab />}
      {activeTab === 'packages' && <PackagesTab />}
      {activeTab === 'revenue' && <RevenueTab />}
      {activeTab === 'payments' && <PaymentsTab />}
    </div>
  );
}

export default function SuperAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[80vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-orange-500"></div>
        </div>
      }
    >
      <SuperAdminDashboardContent />
    </Suspense>
  );
}
