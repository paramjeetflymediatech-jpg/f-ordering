'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, Lock, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CustomerLoginPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/public/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginIdentifier,
          password,
          orgSlug,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        // Force refresh header session
        setTimeout(() => {
          window.location.href = `/order-online/${orgSlug}/menu`;
        }, 1500);
      } else {
        setError(data.error || 'Invalid identifier or password.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-100 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,98,255,0.1),transparent_40%),radial-gradient(circle_at_70%_70%,rgba(6,182,212,0.08),transparent_40%)]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link
          href={`/order-online/${orgSlug}/menu`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Menu
        </Link>

        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 border border-cyan-500/20">
            <Sparkles className="h-3.5 w-3.5" /> Customer Account
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Sign In
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Access your orders, track payments, and review your restaurant profile history.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900 border border-slate-800/80 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 backdrop-blur-md">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-xl font-bold text-white">Signed In Successfully!</h3>
              <p className="text-sm text-slate-400">
                Loading restaurant menu page...
              </p>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-950/40 border border-red-500/30 p-4 text-xs font-semibold text-red-400">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Phone Number or Email *
                </label>
                <div className="mt-2 relative">
                  <Phone className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. +1 555-0100 or john@example.com"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-650 outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Password *
                </label>
                <div className="mt-2 relative">
                  <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-650 outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition shadow-lg shadow-blue-550/20 disabled:opacity-50 mt-4"
              >
                {loading ? 'Verifying...' : 'Sign In'}
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-800 pt-6 text-center text-sm">
            <span className="text-slate-450">Don't have an account yet? </span>
            <Link
              href={`/order-online/${orgSlug}/customer/register`}
              className="font-bold text-cyan-400 hover:text-cyan-300 transition"
            >
              Sign Up Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
