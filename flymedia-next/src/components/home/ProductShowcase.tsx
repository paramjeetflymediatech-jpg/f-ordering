'use client';

import React from 'react';
import { 
  Laptop, 
  Bell, 
  Search, 
  Smartphone, 
  ClipboardList, 
  Users, 
  Layers, 
  TrendingUp, 
  Building, 
  ShieldCheck 
} from 'lucide-react';

export default function ProductShowcase() {
  const features = [
    {
      title: 'POS Billing Terminal',
      desc: 'Super-fast offline-first billing system. Take orders, apply discounts, print receipts, and split bills in seconds.',
      benefit: 'Reduces checkout queues by 40%',
      icon: Laptop,
      color: 'from-orange-500/10 to-amber-500/5 text-orange-500 border-orange-500/20'
    },
    {
      title: 'Kitchen Display System (KDS)',
      desc: 'Paperless kitchen order tickets (KOT) sent instantly to kitchen display monitors with prep timers and alert logs.',
      benefit: 'Eliminates order delays and errors',
      icon: Bell,
      color: 'from-blue-500/10 to-cyan-500/5 text-blue-550 border-blue-500/20'
    },
    {
      title: 'QR Code Table Ordering',
      desc: 'Let customers scan table QR codes, browse menus, customize dishes, order, and pay securely directly from their phones.',
      benefit: 'Saves 25% on waiter service time',
      icon: Search,
      color: 'from-emerald-500/10 to-teal-500/5 text-emerald-500 border-emerald-500/20'
    },
    {
      title: 'Waiter Mobile POS App',
      desc: 'Empower table staff to take orders, add modifiers (extra cheese, bacon), and fire them to the kitchen directly from any mobile device.',
      benefit: 'Increases average table turnover rate',
      icon: Smartphone,
      color: 'from-purple-500/10 to-pink-500/5 text-purple-500 border-purple-500/20'
    },
    {
      title: 'Recipe & Inventory Manager',
      desc: 'Track ingredient stock levels, cost recipes, automate purchase re-orders, and monitor kitchen wastage in real-time.',
      benefit: 'Reduces food wastage by up to 15%',
      icon: ClipboardList,
      color: 'from-rose-500/10 to-red-500/5 text-rose-500 border-rose-500/20'
    },
    {
      title: 'CRM & Loyalty Engine',
      desc: 'Build customer database, configure discount coupon campaigns, track visits history, and reward points automatically.',
      benefit: 'Boosts customer retention by 30%',
      icon: Users,
      color: 'from-indigo-500/10 to-blue-500/5 text-indigo-550 border-indigo-500/20'
    },
    {
      title: 'Table Booking & Layouts',
      desc: 'Visual floor map creator. Manage table occupancy, reservations queue, and seat guests with simple drag-and-drop features.',
      benefit: 'Maximizes seating capacity usage',
      icon: Layers,
      color: 'from-violet-500/10 to-purple-500/5 text-violet-500 border-violet-500/20'
    },
    {
      title: 'Live Analytics Dashboard',
      desc: 'Access real-time sales reporting, item performance statistics, staff logs, and profit-margin summaries from anywhere.',
      benefit: 'Data-driven menu engineering insights',
      icon: TrendingUp,
      color: 'from-teal-500/10 to-emerald-500/5 text-teal-500 border-teal-500/20'
    },
    {
      title: 'Multi-Outlet Management',
      desc: 'Centralized admin panel to configure global menus, manage franchise outlets, share stock, and audit consolidated sales.',
      benefit: 'Scale from 1 to 100 outlets smoothly',
      icon: Building,
      color: 'from-sky-500/10 to-blue-500/5 text-sky-550 border-sky-500/20'
    },
    {
      title: 'Offline Mode Resiliency',
      desc: 'Possess zero downtimes. The system continues working, taking orders, and billing offline, syncing data when Wi-Fi recovers.',
      benefit: 'Uninterrupted billing during internet loss',
      icon: ShieldCheck,
      color: 'from-amber-500/10 to-yellow-500/5 text-amber-500 border-amber-500/20'
    }
  ];

  return (
    <section id="features" className="py-28 bg-[#020617] border-b border-slate-900 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.015),transparent_60%)]" />

      <div className="container relative z-10 mx-auto px-6 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Built For Hospitality
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-4 sm:text-4xl tracking-tight leading-tight">
            Everything You Need To Sell & Scale
          </h2>
          <p className="text-slate-400 text-sm mt-4 leading-relaxed max-w-md mx-auto">
            Explore powerful, native modules built to eliminate kitchen queues, trace raw ingredients, and reward customer loyalty.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div 
                key={feat.title}
                className="bg-gradient-to-b from-slate-900/40 to-slate-950/20 border border-slate-850/80 p-8 rounded-3xl flex flex-col justify-between hover:border-orange-500/25 hover:shadow-xl hover:shadow-orange-500/[0.01] transition-all duration-300 transform hover:-translate-y-1 group"
              >
                <div>
                  {/* Icon container */}
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br border ${feat.color} shadow-inner`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-base font-black text-white mt-6 group-hover:text-orange-500 transition duration-200">
                    {feat.title}
                  </h3>
                  <p className="text-slate-450 text-xs mt-3 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <div className="mt-8 pt-5 border-t border-slate-900 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-orange-500 tracking-wider">Impact:</span>
                  <span className="text-[10px] font-bold text-slate-300 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-850">{feat.benefit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
