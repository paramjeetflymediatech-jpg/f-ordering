'use client';

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgInfo, setOrgInfo] = useState<{ name: string; logo: string | null } | null>(null);

  // Load organization details from subdomain slug if available
  useEffect(() => {
    const fetchOrgDetails = async () => {
      if (typeof window === 'undefined') return;

      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      let slug = '';

      if (parts.length > 1 && parts[0] !== 'www') {
        slug = parts[0];
      }

      if (slug) {
        try {
          const res = await fetch(`/api/public/store?orgSlug=${slug}`);
          const data = await res.json();
          if (data.success && data.store?.Organization) {
            setOrgInfo({
              name: data.store.Organization.name,
              logo: data.store.Organization.logo,
            });
          }
        } catch (err) {
          console.error('Failed to fetch store details for subdomain logo:', err);
        }
      }
    };

    fetchOrgDetails();
  }, []);

  // Auto redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const roles = (session.user as any).roles || [];
      if (roles.includes('Cashier') || roles.includes('Waiter')) {
        router.push('/pos');
      } else {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        console.log(res?.error,'res?.error');
        setError(res.error || 'Invalid credentials');
        setLoading(false);
      } else {
        // Redirect logic will trigger via the useEffect
        console.log('inside else');
        router.refresh();
      }
    } catch (err: any) {
      console.log(err,'err unexcepted');
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const fillQuickCredentials = (userType: 'owner' | 'cashier') => {
    if (userType === 'owner') {
      setEmail('owner@fordering.com');
      setPassword('password123');
    } else {
      setEmail('cashier@fordering.com');
      setPassword('password123');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 relative">
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition backdrop-blur z-20"
      >
        ← Back to Home
      </Link>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.15),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.15),transparent_40%)]" />
      
      <div className="relative z-10 w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-xl shadow-2xl">
        <div className="text-center flex flex-col items-center">
          {orgInfo?.logo ? (
            <div className="h-20 w-20 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 p-2 flex items-center justify-center mb-4 shadow-xl shadow-orange-500/5">
              <img
                src={orgInfo.logo}
                alt={`${orgInfo.name} Logo`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center font-bold text-orange-400 text-xl mb-4">
              F
            </div>
          )}
          
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {orgInfo ? (
              <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent capitalize">
                {orgInfo.name}
              </span>
            ) : (
              <>
                <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
                  FLY -
                </span>
                <span className="text-slate-300 font-light"> POS</span>
              </>
            )}
          </h1>
          
          <p className="mt-3 text-sm text-slate-400">
            {orgInfo 
              ? `Sign in to access ${orgInfo.name}'s console`
              : 'Sign in to access your terminal or management console'
            }
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            <p className="font-semibold">Sign in failed</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="email-address" className="text-sm font-semibold text-slate-300">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                placeholder="cashier@fordering.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-semibold text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-3 text-sm font-bold text-white transition-all hover:from-orange-500 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connecting...
                </span>
              ) : (
                'Open Terminal'
              )}
            </button>
          </div>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">
            Demo Shortcuts
          </span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => fillQuickCredentials('cashier')}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            Cashier Demo
          </button>
          <button
            onClick={() => fillQuickCredentials('owner')}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            Owner Demo
          </button>
        </div>

        <div className="text-center text-sm text-slate-400">
          Want to start a new tenant store?{' '}
          <Link href="/register" className="font-semibold text-orange-500 hover:text-orange-400">
            Register Business
          </Link>
        </div>
      </div>
    </div>
  );
}
