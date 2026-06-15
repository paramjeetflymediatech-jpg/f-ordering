'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    organizationName: '',
    storeName: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    storeAddress: '',
    storePhone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (
      !form.organizationName ||
      !form.storeName ||
      !form.name ||
      !form.email ||
      !form.password
    ) {
      setError('Please fill out all required fields.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Registration failed. Please try again.');
        setLoading(false);
      } else {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      setError('An error occurred during onboarding. Please try again.');
      setLoading(false);
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(249,115,22,0.15),transparent_40%)]" />

      <div className="relative z-10 w-full max-w-2xl space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Register your{' '}
            <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              POS Storefront
            </span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Set up your brand and initialize your first store branch in seconds
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400 font-semibold">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Business Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-orange-500 border-b border-slate-800 pb-1">
                1. Organization Details
              </h3>
              <div>
                <label className="text-xs font-semibold text-slate-300">
                  Organization/Brand Name *
                </label>
                <input
                  name="organizationName"
                  required
                  value={form.organizationName}
                  onChange={handleChange}
                  placeholder="e.g. F-Ordering Burgers"
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">
                  Initial Branch/Store Name *
                </label>
                <input
                  name="storeName"
                  required
                  value={form.storeName}
                  onChange={handleChange}
                  placeholder="e.g. Downtown Branch"
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">
                  Store Address
                </label>
                <input
                  name="storeAddress"
                  value={form.storeAddress}
                  onChange={handleChange}
                  placeholder="e.g. 123 Main St, New York"
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">
                  Store Phone
                </label>
                <input
                  name="storePhone"
                  value={form.storePhone}
                  onChange={handleChange}
                  placeholder="e.g. +1 555-9876"
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-orange-500"
                />
              </div>
            </div>

            {/* Owner Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-orange-500 border-b border-slate-800 pb-1">
                2. Owner Credentials
              </h3>
              <div>
                <label className="text-xs font-semibold text-slate-300">
                  Owner Full Name *
                </label>
                <input
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">
                  Email Address *
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">
                  Password *
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">
                  Owner Phone Number
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 555-1234"
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-3 text-sm font-bold text-white transition-all hover:from-orange-500 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            >
              {loading ? 'Initializing SaaS Tenant...' : 'Create Brand & Initialize Store'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-slate-400">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-orange-500 hover:text-orange-400">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
