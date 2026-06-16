'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Laptop, Smartphone, Globe, Users2, Check } from 'lucide-react';

export default function HeroSection() {
  const [activeTab, setActiveTab] = useState<'pos' | 'mobile' | 'qr' | 'waiter'>('pos');

  return (
    <section className="relative overflow-hidden pt-32 pb-24 border-b border-slate-800">
      {/* Radial Ambient Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.15),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.1),transparent_45%)]" />
      
      <div className="container relative z-10 mx-auto px-6 max-w-6xl">
        <div className="text-center max-w-4xl mx-auto">
          {/* Tagline pill */}
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-orange-500 border border-orange-500/20 mb-6">
            <Sparkles className="h-3.5 w-3.5" /> Direct Restaurant POS & Ordering System
          </span>
          
          <h1 className="text-4xl font-extrabold sm:text-6xl tracking-tight text-white leading-tight">
            Powering Outlets, Simplifying Bills,
            <span className="block mt-2 bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent font-black">
              Growing Restaurant Profits.
            </span>
          </h1>
          
          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The premium cloud POS platform for restaurants, cafes, food chains, and cloud kitchens. Manage tables, billing, recipe stock, waiter dispatches, and table QR ordering smoothly.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a 
              href="#demo-form" 
              className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-orange-600 px-8 py-4 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:shadow-orange-500/20 transition duration-200 transform hover:-translate-y-0.5"
            >
              Book Live Demo
            </a>
            <Link 
              href="/register" 
              className="rounded-full border border-slate-700 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-600 px-8 py-4 text-xs font-black uppercase tracking-wider text-white transition transform hover:-translate-y-0.5"
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-3 sm:gap-6">
            {[
              { label: 'No Commission', desc: 'Direct Orders' },
              { label: 'Cloud Based', desc: 'Real-time sync' },
              { label: 'GST Ready', desc: 'Tax compliant' },
              { label: 'Multi Outlet', desc: 'Franchise Support' },
              { label: '24/7 Support', desc: 'Always online' }
            ].map((badge) => (
              <div 
                key={badge.label}
                className="flex items-center gap-2 rounded-full bg-slate-900/60 border border-slate-800 px-4 py-2 hover:border-orange-500/40 transition duration-200"
              >
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive POS Screenshot Showcase */}
        <div className="mt-16 bg-slate-900/50 border border-slate-800 p-3 sm:p-5 rounded-3xl shadow-2xl backdrop-blur max-w-5xl mx-auto">
          {/* Tab Swappers */}
          <div className="flex flex-wrap border-b border-slate-800 mb-5 pb-3 gap-2">
            {[
              { id: 'pos', name: 'POS Billing Dashboard', icon: Laptop },
              { id: 'mobile', name: 'Customer Mobile Ordering', icon: Smartphone },
              { id: 'qr', name: 'QR Table Ordering', icon: Globe },
              { id: 'waiter', name: 'Waiter App Terminal', icon: Users2 }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold transition ${
                    active 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>

          {/* Tab Previews Container */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
            {activeTab === 'pos' && (
              <Image 
                src="/pos_dashboard_preview.png"
                alt="Restaurant POS SaaS Billing Dashboard Console"
                fill
                className="object-cover object-top animate-fade-in"
                sizes="(max-width: 1200px) 100vw, 1200px"
                priority
              />
            )}
            {activeTab === 'mobile' && (
              <Image 
                src="/mobile_app_preview.png"
                alt="Customer Mobile Ordering & Order Tracking Android iOS Screen"
                fill
                className="object-cover object-top animate-fade-in"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
            )}
            {activeTab === 'qr' && (
              <Image 
                src="/qr_ordering_preview.png"
                alt="Elegant QR Code Menu ordering card stand on restaurant table"
                fill
                className="object-cover object-center animate-fade-in"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
            )}
            {activeTab === 'waiter' && (
              <Image 
                src="/waiter_app_preview.png"
                alt="Waiter POS ordering app UI modifications on phone screen"
                fill
                className="object-cover object-center animate-fade-in"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
