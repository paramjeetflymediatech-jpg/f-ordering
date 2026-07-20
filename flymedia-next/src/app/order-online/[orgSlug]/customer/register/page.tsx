'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Phone, Mail, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import RestaurantNavbar from '../../../../../components/order-online/RestaurantNavbar';

export default function CustomerRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [store, setStore] = useState<any>(null);

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

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/public/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email: email || undefined, password, orgSlug }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/order-online/${orgSlug}/customer/login`);
        }, 2000);
      } else {
        setError(data.error || 'Failed to complete registration.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
  className="relative min-h-screen flex flex-col justify-between font-sans transition-colors duration-350 bg-cover bg-center"
      style={{
        backgroundColor: store?.bg_color_customer_register || bgColor,
        backgroundImage: store?.bg_customer_register 
          ? `url(${store.bg_customer_register})` 
          : store?.bg_color_customer_register 
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
      <RestaurantNavbar orgSlug={orgSlug} activePage="register" />
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8  backdrop-blur-xl rounded-2xl p-4"  style={{ color: accentColor }}>
            <h1 
              className="text-2xl font-black "
             style={{ color: accentColor }}
            >
              Create Account
            </h1>
            <p className="text-sm   mt-1">Earn loyalty points and track your orders</p>
          </div>

          <div className="border border-slate-200 rounded-2xl shadow-lg p-6 backdrop-blur-xl">
            {success ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto animate-bounce" />
                <h3 className="text-base font-bold text-slate-800">Account Created!</h3>
                <p className="text-xs text-slate-500">Redirecting to login...</p>
              </div>
            ) : (
              <form className="space-y-4 " onSubmit={handleSubmit}>
                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"
                  style={{ color: accentColor }} 
                  >Full Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" required placeholder="John Doe" value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"   style={{ color: accentColor }} >Phone (optional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input type="tel" placeholder="+1 555-0100" value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"   style={{ color: accentColor }} >Email <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input type="email" required placeholder="john@example.com" value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"   style={{ color: accentColor }} >Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input type={showPassword ? 'text' : 'password'} required placeholder="••••••••" value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-10 text-sm text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"   style={{ color: accentColor }} >Confirm Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input type={showConfirmPassword ? 'text' : 'password'} required placeholder="••••••••" value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-10 text-sm text-slate-800 outline-none focus:border-slate-400 focus:bg-white transition" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-600 focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-50 mt-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}

            <div className="mt-5 p-4 rounded-xl border border-slate-100 text-center text-sm backdrop-blur-xs" style={{ color: accentColor }}>
              Already have an account?{' '}
              <Link 
                href={`/order-online/${orgSlug}/customer/login`} 
                className="font-bold hover:underline"
                style={{ color: accentColor }}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>

     <footer 
        className="py-2 border-t text-center text-[14px] text-black flex flex-col justify-center gap-3"
        style={{ borderColor: `${primaryColor}1a`,backgroundColor:"white" }}
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
