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
    <section className="bg-slate-950 py-12 border-b border-slate-800 overflow-hidden relative">
      <div className="container mx-auto px-6 max-w-5xl">
        <p className="text-center text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-6">
          Trusted by 1,200+ Restaurants, Cafes & Cloud Kitchens Globally
        </p>
        
        {/* Logo Marquee Grid */}
        <div className="flex gap-8 items-center overflow-x-hidden relative w-full select-none">
          <div className="flex space-x-12 animate-scroll shrink-0 min-w-full justify-around">
            {clientLogos.map((logo) => (
              <div key={logo.name} className="flex flex-col items-center">
                <span className="text-sm font-black text-slate-300 tracking-wide">{logo.name}</span>
                <span className="text-[10px] font-bold text-orange-500 uppercase mt-0.5">{logo.type}</span>
              </div>
            ))}
          </div>
          {/* Duplicate for infinite loop */}
          <div className="flex space-x-12 animate-scroll shrink-0 min-w-full justify-around" aria-hidden="true">
            {clientLogos.map((logo) => (
              <div key={`${logo.name}-dup`} className="flex flex-col items-center">
                <span className="text-sm font-black text-slate-300 tracking-wide">{logo.name}</span>
                <span className="text-[10px] font-bold text-orange-500 uppercase mt-0.5">{logo.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
