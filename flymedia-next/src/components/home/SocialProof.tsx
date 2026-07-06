'use client';

import React from 'react';
import { Star } from 'lucide-react';

export default function SocialProof() {
  return (
    <section className="py-28 border-b border-slate-900 bg-[#030712] relative overflow-hidden">
      {/* Background decoration blur lights */}
      <div className="absolute top-1/2 left-10 w-96 h-96 bg-orange-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-blue-500/[0.02] rounded-full blur-[100px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-6 max-w-6xl">
        {/* Section title */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Customer Success
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-4 sm:text-4xl tracking-tight leading-tight">
            What Restaurant Owners Say
          </h2>
          <p className="text-slate-400 text-sm mt-4 leading-relaxed max-w-md mx-auto">
            Find out how partners use our POS software to speed up table turnaround times and drive direct online orders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: 'Amandeep Singh',
              outlet: 'Mitran Da Dhaba',
              text: 'We saw a 30% increase in daily bills after switching to F-Ordering POS. The offline billing has saved us during multiple power cuts!',
              rating: 5,
              image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'
            },
            {
              name: 'Marco Rossini',
              outlet: 'Pizzeria Romana',
              text: 'The table QR ordering system is incredible. Guests scan and order directly. We require 2 fewer waiters on shift and tips have increased!',
              rating: 5,
              image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120'
            },
            {
              name: 'Sarah Chen',
              outlet: 'The Chai Club',
              text: 'Managing recipes, raw stock levels, and franchise menu item cards is finally streamlined. Live sales alerts directly to my phone are fantastic.',
              rating: 5,
              image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120'
            }
          ].map((review) => (
            <div 
              key={review.name}
              className="bg-gradient-to-b from-slate-900/40 to-slate-950/20 border border-slate-850/80 p-8 rounded-3xl flex flex-col justify-between hover:border-orange-500/20 hover:shadow-lg hover:shadow-orange-500/[0.01] transition-all duration-300 transform hover:-translate-y-1 group"
            >
              <div>
                {/* Star Rating */}
                <div className="flex gap-1 mb-5">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-450 text-amber-450" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-350 italic leading-relaxed group-hover:text-slate-200 transition duration-200">
                  "{review.text}"
                </p>
              </div>

              <div className="flex items-center gap-3.5 mt-8 pt-6 border-t border-slate-900">
                <div className="relative h-11 w-11 rounded-full overflow-hidden border-2 border-orange-500/20 shadow-inner">
                  <img 
                    src={review.image} 
                    alt={review.name}
                    className="object-cover h-full w-full"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">{review.name}</h4>
                  <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mt-1">{review.outlet}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Showcase grid */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Active Restaurants', val: '1,200+', color: 'text-orange-500' },
            { label: 'Orders Processed', val: '5M+', color: 'text-orange-500' },
            { label: 'Revenue Generated', val: '$45M+', color: 'text-orange-500' },
            { label: 'Satisfaction Rate', val: '99.6%', color: 'text-emerald-450' }
          ].map((stat) => (
            <div 
              key={stat.label}
              className="bg-gradient-to-b from-slate-900/20 to-slate-950/40 border border-slate-850/60 p-6 rounded-2xl text-center shadow-inner hover:border-slate-800 transition duration-250"
            >
              <p className={`text-3xl font-black tracking-tight ${stat.color}`}>{stat.val}</p>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mt-2.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
