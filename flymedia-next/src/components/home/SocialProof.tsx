'use client';

import React from 'react';
import { Star } from 'lucide-react';

export default function SocialProof() {
  return (
    <section className="py-24 border-b border-slate-800">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Section title */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Customer Reviews</span>
          <h2 className="text-3xl font-extrabold text-white mt-2 sm:text-4xl">What Restaurant Owners Say</h2>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
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
              className="bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl flex flex-col justify-between hover:border-slate-700 hover:shadow-lg transition duration-200"
            >
              <div>
                {/* Star Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-300 italic leading-relaxed">
                  "{review.text}"
                </p>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-800">
                <div className="relative h-10 w-10 rounded-full overflow-hidden border border-orange-500/30">
                  <img 
                    src={review.image} 
                    alt={review.name}
                    className="object-cover h-full w-full"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{review.name}</h4>
                  <p className="text-[10px] font-bold text-orange-500 uppercase mt-0.5">{review.outlet}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Showcase grid */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Active Restaurants', val: '1,200+', color: 'text-orange-500' },
            { label: 'Orders Processed', val: '5M+', color: 'text-orange-500' },
            { label: 'Revenue Generated', val: '$45M+', color: 'text-orange-500' },
            { label: 'Satisfaction Rate', val: '99.6%', color: 'text-emerald-400' }
          ].map((stat) => (
            <div 
              key={stat.label}
              className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl text-center"
            >
              <p className={`text-3xl font-black ${stat.color}`}>{stat.val}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
