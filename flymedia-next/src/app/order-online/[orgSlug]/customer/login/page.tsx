'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Phone, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import RestaurantNavbar from '../../../../../components/order-online/RestaurantNavbar';

export default function CustomerLoginPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [store, setStore] = useState<any>(null);

  // Forgot Password Flow States
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    if (!orgSlug) return;
    fetch(`/api/public/store?orgSlug=${orgSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.store) setStore(data.store);
      })
      .catch(() => {});
  }, [orgSlug]);

  const primaryColor = store?.theme_primary_color || '#2A0E07';
  const accentColor = store?.theme_accent_color || '#C39A3C';
  const bgColor = store?.theme_bg_color || '#F9F6F0';
  const fontStyle = store?.theme_font || 'sans';

  const getFontFamily = () => {
    switch (fontStyle) {
      case 'serif':
        return 'Georgia, ui-serif, serif';
      case 'sans':
        return 'ui-sans-serif, system-ui, sans-serif';
      case 'playfair':
        return '"Playfair Display", Georgia, serif';
      default:
        return 'Poppins, Georgia, ui-serif, serif';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/public/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginIdentifier, password, orgSlug }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);
    setTempPassword(null);
    setForgotLoading(true);

    try {
      const res = await fetch('/api/public/customer/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginIdentifier: forgotIdentifier, orgSlug }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setForgotSuccess(data.message || 'A temporary password has been successfully sent!');
        if (data.tempPassword) {
          setTempPassword(data.tempPassword);
        }
      } else {
        setForgotError(data.error || 'Failed to request password reset. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setForgotError('A network error occurred. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div 
      className="relative min-h-screen flex flex-col justify-between font-sans transition-colors duration-350 bg-cover bg-center"
      style={{
        backgroundColor: store?.bg_color_customer_login || bgColor,
        backgroundImage: store?.bg_customer_login 
          ? `url(${store.bg_customer_login})` 
          : store?.bg_color_customer_login 
            ? 'none' 
            : store?.banner 
              ? `url(${store.banner})` 
              : "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        fontFamily: getFontFamily(),
      }}
    >
      <RestaurantNavbar orgSlug={orgSlug} activePage="login" />
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm z-10">
          {/*  hero section */}
          <div className="text-center mb-8  backdrop-blur-xl rounded-2xl p-4">
            <h1 
              className="text-2xl font-black tracking-tight"
              style={{ color: accentColor }}
            >
              {isForgotMode ? 'Reset Password' : 'Welcome Back'}
            </h1>
            <p className="text-sm   mt-1"  style={{ color: accentColor }}>
              {isForgotMode 
                ? 'Enter your phone or email to recover your account' 
                : 'Sign in to view your orders & earn loyalty points'}
            </p>
          </div>

          <div className="  backdrop-blur-xl border border-slate-200 rounded-2xl shadow-lg p-6" >
            {success ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto animate-bounce" />
                <h3 className="text-base font-bold text-slate-800">Signed In!</h3>
                <p className="text-xs text-slate-500">Taking you back to the menu...</p>
              </div>
            ) : isForgotMode ? (
              <div>
                {forgotSuccess ? (
                  <div className="space-y-4 py-2">
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50  border border-emerald-200 p-3 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{forgotSuccess}</span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier(forgotIdentifier);
                        setPassword('');
                        setIsForgotMode(false);
                        setForgotSuccess(null);
                        setTempPassword(null);
                      }}
                      className="w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Proceed to Sign In
                    </button>
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={handleForgotSubmit}>
                    {forgotError && (
                      <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-600">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{forgotError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1">
                        Phone or Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="+1 555-0100 or john@example.com"
                          value={forgotIdentifier}
                          onChange={(e) => setForgotIdentifier(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-50 hover:opacity-90 mt-2"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {forgotLoading ? 'Sending Reset Info...' : 'Send Temporary Password'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotMode(false);
                        setForgotError(null);
                      }}
                      className="w-full rounded-xl py-2.5 text-xs font-bold transition"
                      style={{ color: accentColor,backgroundColor:primaryColor }}
                    >
                      Back to Sign In
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold  uppercase tracking-wider mb-1" style={{ color: accentColor }}>
                    Phone or Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="+1 555-0100 or john@example.com"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold  uppercase tracking-wider" style={{color:accentColor}}>
                      Password <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotIdentifier(loginIdentifier);
                        setIsForgotMode(true);
                      }}
                      className="text-[10px] font-bold hover:underline transition"
                      style={{ color: accentColor }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-10 text-sm text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-50 hover:opacity-90 mt-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}

            <div className="mt-5 p-2 border rounded-xl text-center text-sm backdrop-blur" style={{ color: accentColor }}>
              Don&apos;t have an account?{' '}
              <Link 
                href={`/order-online/${orgSlug}/customer/register`} 
                className="font-bold hover:underline"
                style={{ color: accentColor }}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </main>

     <footer 
        className="py-2 border-t text-center text-[14px] text-black flex flex-col justify-center gap-3"
        style={{ borderColor: `${primaryColor}1a`, backgroundColor:"white"}}
      >
        <div className=' '> 
         <p>© {new Date().getFullYear()} {store?.Organization?.name || store?.name || 'Restaurant'}. Powered by Ordering System.</p>
        
        <div className="flex justify-center gap-3 mt-2 text-[14px] font-semibold text-black">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:underline">Terms & Conditions</a>
        </div></div>
      </footer>
    </div>
  );
}
