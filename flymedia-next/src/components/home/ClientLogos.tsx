'use client';

import React from 'react';

export default function ClientLogos() {
  const clientLogos = [
    { name: 'Mitran Da Dhaba', type: 'Dhaba & Restaurant' },
    { name: 'Pizzeria Romana', type: 'Pizza Chain' },
    { name: 'The Chai Club', type: 'Cafe & Tea Bar' },
    { name: 'Spice Route', type: 'Fine Dining' },
    { name: 'Burger & Co', type: 'Fast Food Chain' },
    { name: 'Green Salad Club', type: 'Cloud Kitchen' },
    { name: 'Bistro 47', type: 'Bistro' },
    { name: 'Urban Wok', type: 'QSR Chain' }
  ];

  return (
    <section className="bg-[#020617] py-16 border-b border-slate-900 overflow-hidden relative">
      <div className="container mx-auto px-6 max-w-5xl">
        <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8">
          Trusted by 1,200+ Restaurants, Cafes & Cloud Kitchens Globally
        </p>
        
        {/* Logo Marquee Grid */}
        <div className="flex gap-6 items-center overflow-x-hidden relative w-full select-none">
          <div className="flex space-x-6 animate-scroll shrink-0 min-w-full justify-around">
            {clientLogos.map((logo) => (
              <div 
                key={logo.name} 
                className="flex flex-col items-center justify-center bg-slate-900/30 border border-slate-850 px-6 py-3.5 rounded-2xl shadow-sm hover:border-orange-500/30 hover:bg-slate-900/50 transition duration-200"
              >
                <span className="text-xs font-black text-slate-200 tracking-wide">{logo.name}</span>
                <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest mt-1">{logo.type}</span>
              </div>
            ))}
          </div>
          {/* Duplicate for infinite loop */}
          <div className="flex space-x-6 animate-scroll shrink-0 min-w-full justify-around" aria-hidden="true">
            {clientLogos.map((logo) => (
              <div 
                key={`${logo.name}-dup`} 
                className="flex flex-col items-center justify-center bg-slate-900/30 border border-slate-850 px-6 py-3.5 rounded-2xl shadow-sm hover:border-orange-500/30 hover:bg-slate-900/50 transition duration-200"
              >
                <span className="text-xs font-black text-slate-200 tracking-wide">{logo.name}</span>
                <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest mt-1">{logo.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
