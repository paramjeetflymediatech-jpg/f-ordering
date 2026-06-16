'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-slate-950 border-b border-slate-800">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Transparent SaaS Plans</span>
          <h2 className="text-3xl font-extrabold text-white mt-2 sm:text-4xl">Affordable Pricing Built to Scale</h2>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            No hidden fees, no credit cards required to start. Swap billing cycles to get extra savings.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-slate-900 border border-slate-800 p-1.5">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition ${
                !isYearly ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                isYearly ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Yearly Billing
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 text-[9px] font-black tracking-normal px-2 py-0.5 rounded-full uppercase">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {[
            {
              name: 'Starter Plan',
              desc: 'Perfect for local single-outlet operations, cafes, and pop-up food trucks.',
              price: isYearly ? 24 : 29,
              features: ['1 POS Billing Terminal', 'QR Table Menu Ordering', 'Digital Receipt Dispatch (Email/SMS)', '100 Monthly Reservation Slots', 'Offline Resiliency Billing'],
              popular: false,
              cta: 'Start Free Trial',
              href: '/register'
            },
            {
              name: 'Professional Plan',
              desc: 'Engineered for busy independent outlets, food chains, and recipe builders.',
              price: isYearly ? 63 : 79,
              features: ['3 POS Terminals per outlet', 'Full KDS (Kitchen Display System) support', 'Recipe & Raw Ingredient Stock Control', 'CRM, Loyalty, and Coupon campaigns', 'Epson Thermal Printer LAN/Bluetooth integration'],
              popular: true,
              cta: 'Start Professional Trial',
              href: '/register'
            },
            {
              name: 'Enterprise Plan',
              desc: 'Tailored for franchise operations, central commissaries, and large chains.',
              price: isYearly ? 119 : 149,
              features: ['Unlimited Outlets & POS Terminals', 'Franchise menu locking & sync dashboard', 'API access for custom integrations', 'Dedicated Account Support Manager', '24/7 Priority Emergency dispatch support'],
              popular: false,
              cta: 'Inquire Enterprise Custom',
              href: '#demo-form'
            }
          ].map((plan) => (
            <div 
              key={plan.name}
              className={`bg-slate-900 border rounded-3xl p-8 flex flex-col justify-between transition duration-200 relative ${
                plan.popular 
                  ? 'border-orange-500 shadow-xl shadow-orange-500/[0.03] scale-105' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black tracking-widest uppercase px-4 py-1.5 rounded-full border border-orange-400/20 shadow-md">
                  Most Popular
                  </span>
              )}

              <div>
                <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">{plan.desc}</p>
                
                {/* Price info */}
                <div className="my-6 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-white">${plan.price}</span>
                  <span className="text-slate-400 text-xs font-bold">/ month</span>
                </div>

                {/* Feature lists */}
                <ul className="space-y-3 pt-3 border-t border-slate-800">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex gap-2.5 items-start text-xs font-semibold text-slate-300">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Link 
                  href={plan.href}
                  className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-white shadow-lg' 
                      : 'bg-slate-800 hover:bg-slate-750 text-white'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-3.5 w-3.5 text-white" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
