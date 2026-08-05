'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Laptop, Smartphone, Globe, Users2, Check, Printer, Bell } from 'lucide-react';

export default function HeroSection() {
  const [activeTab, setActiveTab] = useState<'pos' | 'mobile' | 'qr' | 'waiter'>('pos');
  const [orderItems, setOrderItems] = useState<{ name: string; price: number; qty: number }[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [orderNo, setOrderNo] = useState(101);

  const addItem = (name: string, price: number) => {
    setOrderItems(prev => {
      const existing = prev.find(item => item.name === name);
      if (existing) {
        return prev.map(item => item.name === name ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { name, price, qty: 1 }];
    });
    triggerNotification(`Added 1x ${name} to billing cart`);
  };

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const sendToKitchen = () => {
    if (orderItems.length === 0) {
      triggerNotification("Add items to your order first!");
      return;
    }
    // Attempt sound playback
    try {
      const audio = new Audio('/ringbellnoti.mp3');
      audio.volume = 0.45;
      audio.play().catch(() => {});
    } catch (e) {}

    triggerNotification(`🔥 Order #${orderNo} dispatched to Kitchen Display Monitor (KDS)!`);
    setOrderNo(prev => prev + 1);
  };

  const printReceipt = () => {
    if (orderItems.length === 0) {
      triggerNotification("Add items to print receipt!");
      return;
    }
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
      triggerNotification(`📠 Receipt printed successfully for Order #${orderNo}`);
      setOrderItems([]);
    }, 1800);
  };

  return (
    <section className="relative overflow-hidden pt-36 pb-28 border-b border-slate-900 bg-[#030712] bg-dot-pattern">
      {/* Ambient Gradient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Floating simulator toast */}
      {notification && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-3 bg-slate-900/90 border border-orange-500/30 px-5 py-3 rounded-2xl shadow-xl shadow-orange-500/5 backdrop-blur-md animate-fade-in">
          <div className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
          <span className="text-xs font-bold text-slate-100">{notification}</span>
        </div>
      )}
      
      <div className="container relative z-10 mx-auto px-6 max-w-6xl">
        <div className="text-center max-w-4xl mx-auto">
          {/* Tagline pill */}
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-orange-500 border border-orange-500/20 mb-8 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-orange-400 animate-pulse" /> Direct Restaurant POS & Ordering System
          </span>
          
          <h1 className="text-4xl font-extrabold sm:text-6xl tracking-tight text-white leading-tight">
            Powering Outlets, Simplifying Bills,
            <span className="block mt-2 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent font-black glow-text-orange">
              Growing Restaurant Profits.
            </span>
          </h1>
          
          <p className="mt-8 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The premium cloud POS platform for restaurants, cafes, food chains, and cloud kitchens. Manage tables, billing, recipe stock, waiter dispatches, and table QR ordering smoothly.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a 
              href="#demo-form" 
              className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-orange-600 px-8 py-4 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:shadow-orange-500/20 transition duration-200 transform hover:-translate-y-0.5"
            >
              Book Live Demo
            </a>
            <Link 
              href="/register" 
              className="rounded-full border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 px-8 py-4 text-xs font-black uppercase tracking-wider text-white transition transform hover:-translate-y-0.5"
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-14 flex flex-wrap justify-center items-center gap-3 sm:gap-6">
            {[
              { label: 'No Commission', desc: 'Direct Orders' },
              { label: 'Cloud Based', desc: 'Real-time sync' },
              { label: 'GST Ready', desc: 'Tax compliant' },
              { label: 'Multi Outlet', desc: 'Franchise Support' },
              { label: '24/7 Support', desc: 'Always online' }
            ].map((badge) => (
              <div 
                key={badge.label}
                className="flex items-center gap-2 rounded-full bg-slate-900/30 border border-slate-850 px-4 py-2 hover:border-orange-500/30 transition duration-250"
              >
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-slate-300">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive POS Screenshot Showcase */}
        <div className="mt-20 bg-slate-900/40 border border-slate-850 p-3 sm:p-5 rounded-3xl shadow-2xl backdrop-blur-md max-w-5xl mx-auto glow-card">
          {/* Tab Swappers */}
          <div className="flex flex-wrap border-b border-slate-850 mb-5 pb-3 gap-2">
            {[
              { id: 'pos', name: 'Interactive POS Simulator', icon: Laptop },
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
                  className={`flex items-center gap-2 px-5 py-3 rounded-full text-xs font-black tracking-wide transition duration-250 ${
                    active 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>

          {/* Tab Previews Container */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-850 shadow-inner flex items-center justify-center">
            {activeTab === 'pos' && (
              <>
                <Image 
                  src="/pos_dashboard_preview.png"
                  alt="Restaurant POS SaaS Billing Dashboard Console"
                  fill
                  className="object-cover object-top opacity-30 sm:opacity-40 transition-opacity"
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  priority
                />
                
                {/* Visual simulator panel overlay */}
                <div className="absolute inset-0 flex flex-col md:flex-row justify-between p-4 sm:p-6 gap-4 z-20 overflow-y-auto">
                  {/* Left Side: Menu Items selection */}
                  <div className="flex-1 flex flex-col justify-center max-w-sm">
                    <div className="glass-panel p-4 rounded-2xl border border-slate-800 shadow-lg text-left backdrop-blur-md">
                      <div className="flex items-center gap-1.5 mb-2.5 text-orange-500">
                        <Sparkles className="h-4 w-4 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider">POS Simulator</span>
                      </div>
                      <h4 className="text-xs font-black text-white mb-1.5">Simulate Live Ordering</h4>
                      <p className="text-[10px] text-slate-400 mb-3.5 leading-relaxed">Click items below to add them to the POS checkout screen and watch real-time updates.</p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { name: 'Margherita Pizza', price: 14.99 },
                          { name: 'Double Cheese Burger', price: 16.99 },
                          { name: 'Crispy Chicken Sandwich', price: 14.99 },
                          { name: 'Fresh Lime Soda', price: 4.99 }
                        ].map(dish => (
                          <button
                            key={dish.name}
                            onClick={() => addItem(dish.name, dish.price)}
                            className="bg-slate-800/40 border border-slate-700/40 hover:border-orange-500/50 hover:bg-slate-800/75 p-2 rounded-xl text-left transition duration-200 flex flex-col justify-between group"
                          >
                            <span className="text-[9px] font-bold text-slate-200 group-hover:text-orange-400 transition line-clamp-1">{dish.name}</span>
                            <span className="text-[9px] font-black text-orange-500 mt-1">${dish.price}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Virtual Checkout billing screen */}
                  <div className="w-full md:w-64 flex flex-col justify-center">
                    <div className="glass-panel p-4 rounded-2xl border border-slate-800 shadow-lg text-left flex flex-col justify-between h-[230px] backdrop-blur-md">
                      <div className="border-b border-slate-850 pb-2 flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-300 uppercase">Cart (Order #{orderNo})</span>
                        <span className="text-[8px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">LIVE Terminal</span>
                      </div>

                      {/* Items List */}
                      <div className="flex-1 overflow-y-auto my-2 pr-1 custom-scrollbar space-y-1">
                        {orderItems.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-4">
                            <Laptop className="h-5 w-5 opacity-30 mb-1" />
                            <span className="text-[9px] font-bold">Terminal Empty</span>
                          </div>
                        ) : (
                          orderItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[9px] bg-slate-950/40 p-1.5 rounded-lg border border-slate-850">
                              <span className="font-semibold text-slate-200 line-clamp-1">{item.qty}x {item.name}</span>
                              <span className="font-bold text-orange-400">${(item.price * item.qty).toFixed(2)}</span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Total and Actions */}
                      <div className="border-t border-slate-850 pt-2 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black">
                          <span className="text-slate-400">Total:</span>
                          <span className="text-white text-xs">${orderItems.reduce((acc, curr) => acc + (curr.price * curr.qty), 0).toFixed(2)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={sendToKitchen}
                            className="bg-orange-500 hover:bg-orange-650 text-white rounded-lg py-2 text-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow transition"
                          >
                            <Bell className="h-3 w-3" />
                            To KDS
                          </button>
                          <button
                            onClick={printReceipt}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg py-2 text-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1 border border-slate-750 transition"
                          >
                            <Printer className="h-3 w-3" />
                            Print
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Virtual Printing Animation Overlay */}
                {isPrinting && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center animate-fade-in">
                    <Printer className="h-10 w-10 text-orange-500 animate-bounce mb-3" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">Printing Receipt...</span>
                    <span className="text-[10px] text-slate-400 mt-1">Epson Thermal Printer active</span>
                  </div>
                )}
              </>
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
